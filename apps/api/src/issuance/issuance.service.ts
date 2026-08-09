import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { buildMerkleTree, credentialHash, leafOf, verifyProof } from '@proofpath/shared';
import type { Hex } from 'viem';
import { CHAIN_ADAPTER, type ChainAdapter } from '../chain/chain-adapter';
import { buildVc, type SkillTypeInput } from '../credentials/vc-builder';
import type { Prisma } from '../generated/prisma/client';
import { BatchRepository } from '../repositories/batch.repository';
import {
  ExperienceRepository,
  type IssuableExperience,
} from '../repositories/experience.repository';

const SCHEMA_ID = 'proofpath.experience.v1';
const CHAIN_ID = 421614; // Arbitrum Sepolia

export interface IssueBatchResponse {
  batchId: string;
  onChainBatchId: string;
  merkleRoot: Hex;
  size: number;
  schemaId: string;
  txHash: string;
  credentials: Array<{ experienceId: string; credentialHash: Hex; subjectTokenId: string }>;
}

/**
 * Emision de un batch de credenciales — 06-API-SPEC.md §4.
 *
 * Aqui vive la regla que sostiene el argumento etico del proyecto: **ninguna
 * credencial se emite sin que un humano de la organizacion haya confirmado las
 * skills**. Vive en el service layer y no en el controller a proposito
 * (00-CONTEXT.md §7), para que no se pueda esquivar llamando desde otro lado.
 */
@Injectable()
export class IssuanceService {
  private readonly logger = new Logger(IssuanceService.name);

  constructor(
    private readonly experiences: ExperienceRepository,
    private readonly batches: BatchRepository,
    @Inject(CHAIN_ADAPTER) private readonly chain: ChainAdapter,
  ) {}

  async issueBatch(experienceIds: string[]): Promise<IssueBatchResponse> {
    if (experienceIds.length === 0) {
      throw new BadRequestException({
        error: 'EmptyBatch',
        message: 'No se puede emitir un batch sin experiencias',
      });
    }

    const unique = [...new Set(experienceIds)];
    const found = await this.experiences.findManyForIssuance(unique);

    this.assertAllFound(unique, found);
    const organizationId = this.assertSingleOrganization(found);
    this.assertReadyToIssue(found);

    const issuedAt = new Date();

    // 1. VC + hash de cada experiencia.
    const prepared = found.map((exp) => {
      const vc = this.vcFor(exp, issuedAt);
      const hash = credentialHash(vc);
      return {
        experience: exp,
        vc,
        hash,
        subjectTokenId: exp.talentProfile.tokenId as bigint,
      };
    });

    // 2. Arbol de Merkle sobre las hojas.
    const tree = buildMerkleTree(prepared.map((p) => leafOf(p.hash, p.subjectTokenId)));

    // 3. Verificar cada proof contra el root ANTES de tocar la cadena.
    //    Descubrir aqui que un proof no cuadra cuesta una excepcion; descubrirlo
    //    despues de emitir significa credenciales ancladas que no verifican, en
    //    una transaccion que ya no se puede deshacer.
    prepared.forEach((p, i) => {
      const leaf = leafOf(p.hash, p.subjectTokenId);
      if (!verifyProof(tree.proofFor(i), tree.root, leaf)) {
        throw new Error(
          `El proof de la experiencia ${p.experience.id} no valida contra el root. ` +
            'No se emitio nada. Revisar leafOf y la construccion del arbol.',
        );
      }
    });

    // 4. Una sola transaccion para las N credenciales.
    const onChain = await this.chain.issueBatch(tree.root, prepared.length, SCHEMA_ID);

    // 5. Persistir. Si esto falla, el batch ya esta on-chain: se loguea fuerte
    //    porque la cadena es la fuente de verdad y la base se puede reconciliar.
    const batch = await this.batches.persistIssuedBatch({
      organizationId,
      onChainBatchId: onChain.onChainBatchId,
      merkleRoot: tree.root,
      size: prepared.length,
      schemaId: SCHEMA_ID,
      txHash: onChain.txHash,
      issuedAt,
      credentials: prepared.map((p, i) => ({
        experienceId: p.experience.id,
        talentProfileId: p.experience.talentProfileId,
        vcJson: p.vc as unknown as Prisma.InputJsonValue,
        credentialHash: p.hash,
        merkleProof: tree.proofFor(i),
        subjectTokenId: p.subjectTokenId,
      })),
    });

    this.logger.log(
      `Batch ${onChain.onChainBatchId} con ${prepared.length} credenciales en una sola tx (${onChain.txHash})`,
    );

    return {
      batchId: batch.id,
      onChainBatchId: onChain.onChainBatchId.toString(),
      merkleRoot: tree.root,
      size: prepared.length,
      schemaId: SCHEMA_ID,
      txHash: onChain.txHash,
      credentials: prepared.map((p) => ({
        experienceId: p.experience.id,
        credentialHash: p.hash,
        subjectTokenId: p.subjectTokenId.toString(),
      })),
    };
  }

  private vcFor(exp: IssuableExperience, issuedAt: Date) {
    return buildVc({
      chainId: CHAIN_ID,
      schemaId: SCHEMA_ID,
      issuedAt,
      organization: {
        walletAddress: exp.program.organization.walletAddress,
        name: exp.program.organization.name,
      },
      talent: {
        walletAddress: exp.talentProfile.walletAddress as string,
        tokenId: exp.talentProfile.tokenId as bigint,
      },
      program: { title: exp.program.title },
      experience: {
        role: exp.role,
        contributions: exp.contributions,
        startDate: exp.startDate,
        endDate: exp.endDate,
        hoursCommitted: exp.hoursCommitted,
      },
      evidences: exp.evidences.map((e) => ({ type: e.type, url: e.url })),
      skills: exp.skillClaims.map((s) => ({ name: s.name, type: s.type as SkillTypeInput })),
    });
  }

  private assertAllFound(requested: string[], found: IssuableExperience[]): void {
    if (found.length === requested.length) return;
    const encontradas = new Set(found.map((e) => e.id));
    const faltantes = requested.filter((id) => !encontradas.has(id));
    throw new NotFoundException({
      error: 'ExperienceNotFound',
      message: `No existen estas experiencias: ${faltantes.join(', ')}`,
    });
  }

  /** Un batch pertenece a una sola organizacion: el issuer on-chain es uno solo. */
  private assertSingleOrganization(found: IssuableExperience[]): string {
    const orgIds = new Set(found.map((e) => e.program.organizationId));
    if (orgIds.size > 1) {
      throw new BadRequestException({
        error: 'MixedOrganizations',
        message: 'Un batch no puede mezclar experiencias de organizaciones distintas',
      });
    }
    return [...orgIds][0];
  }

  /**
   * Falla entera si una sola experiencia no esta lista. Nada de batches a medias:
   * es preferible un error claro antes de emitir que una transaccion irreversible
   * con la mitad de lo que la ONG creia estar emitiendo.
   */
  private assertReadyToIssue(found: IssuableExperience[]): void {
    const noConfirmadas = found.filter((e) => e.status !== 'ORG_CONFIRMED');
    if (noConfirmadas.length > 0) {
      throw new BadRequestException({
        error: 'ExperienceNotConfirmed',
        message:
          `Estas experiencias no estan en ORG_CONFIRMED: ${noConfirmadas.map((e) => e.id).join(', ')}. ` +
          'La organizacion debe confirmarlas antes de emitir.',
      });
    }

    // La regla del proyecto: la IA propone, el humano confirma (00-CONTEXT §2.2).
    const sinSkills = found.filter((e) => e.skillClaims.length === 0);
    if (sinSkills.length > 0) {
      throw new BadRequestException({
        error: 'SkillsNotConfirmed',
        message:
          `Estas experiencias no tienen ninguna skill confirmada: ${sinSkills.map((e) => e.id).join(', ')}. ` +
          'Una credencial sin skills confirmadas por un humano no se emite.',
      });
    }

    const sinPass = found.filter(
      (e) => e.talentProfile.tokenId === null || e.talentProfile.walletAddress === null,
    );
    if (sinPass.length > 0) {
      throw new BadRequestException({
        error: 'TalentPassMissing',
        message:
          `Estos talentos todavia no tienen TalentPass acuñado: ${sinPass.map((e) => e.talentProfileId).join(', ')}. ` +
          'La credencial se ancla al tokenId, asi que sin pass no hay a que anclarla.',
      });
    }
  }
}
