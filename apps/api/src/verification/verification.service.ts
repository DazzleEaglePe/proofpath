import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { credentialHash as recomputeHash } from '@proofpath/shared';
import type { Hex } from 'viem';
import { CHAIN_ADAPTER, type ChainAdapter } from '../chain/chain-adapter';
import { CredentialRepository } from '../repositories/credential.repository';

export interface VerificationResponse {
  /** El VC CRUDO. Ver la nota de abajo: de esto depende el climax de la demo. */
  vc: unknown;
  credentialHash: Hex;
  subjectTokenId: string;
  batchId: string | null;
  merkleProof: Hex[];
  issuer: { name: string; walletAddress: string };
  onChain: {
    merkleRoot: string | null;
    issuedAt: string | null;
    revoked: boolean;
    txHash: string | null;
    verified: boolean;
  };
}

export interface PublicSkill {
  name: string;
  type: 'HARD' | 'HUMAN';
  /** Conteo de experiencias, NUNCA un puntaje. Ver 00-CONTEXT.md §2.1. */
  experienceCount: number;
  experienceTitles: string[];
}

export interface PublicProfileResponse {
  tokenId: string;
  fullName: string;
  headline: string | null;
  isVerified: boolean;
  experienceCount: number;
  experiences: Array<{
    credentialHash: string;
    programTitle: string;
    organizationName: string;
    role: string;
    startDate: string;
    endDate: string | null;
    txHash: string | null;
    revoked: boolean;
    evidences: Array<{ type: string; url: string; label: string }>;
    skills: { hard: string[]; human: string[] };
  }>;
  skills: PublicSkill[];
}

/**
 * Superficie publica: sin auth y sin PII.
 *
 * Aqui vive el endpoint del que depende el bloque 2:00–2:30 de la demo
 * (03-DEMO-SCRIPT.md §1), y por eso devuelve el VC entero en vez de un booleano.
 * Ver la explicacion completa en 06-API-SPEC.md §5.
 */
@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private readonly credentials: CredentialRepository,
    @Inject(CHAIN_ADAPTER) private readonly chain: ChainAdapter,
  ) {}

  async verify(credentialHash: string): Promise<VerificationResponse> {
    const cred = await this.credentials.findByHash(credentialHash);
    if (!cred) {
      throw new NotFoundException({
        error: 'CredentialNotFound',
        message: `No existe ninguna credencial con hash ${credentialHash}`,
      });
    }

    const hash = cred.credentialHash as Hex;
    const proof = cred.merkleProof as Hex[];
    const onChainBatchId = cred.batch?.onChainBatchId ?? null;

    // Comprobacion de integridad propia: el VC guardado debe seguir hasheando a
    // lo mismo que se anclo. Si alguien edito la fila en la base, esto lo detecta
    // sin salir a la red — y es exactamente lo que el navegador va a repetir por
    // su cuenta con las mismas funciones de packages/shared.
    const recomputado = recomputeHash(cred.vcJson);
    if (recomputado !== hash) {
      this.logger.error(
        `INTEGRIDAD ROTA en ${cred.id}: el vcJson guardado hashea a ${recomputado} pero la credencial dice ${hash}. ` +
          'Alguien edito la base por fuera de la aplicacion.',
      );
    }

    let revoked = cred.status === 'REVOKED';
    let verified = false;

    if (onChainBatchId !== null && recomputado === hash) {
      try {
        revoked = await this.chain.isRevoked(hash);
        verified = await this.chain.verifyProof(
          onChainBatchId,
          hash,
          cred.subjectTokenId,
          proof,
        );
      } catch (e) {
        // La cadena caida no debe tirar la pagina publica: se responde
        // verified:false y el front lo muestra como "no se pudo verificar".
        this.logger.warn(`No se pudo consultar la cadena: ${(e as Error).message}`);
      }
    }

    return {
      vc: cred.vcJson,
      credentialHash: hash,
      subjectTokenId: cred.subjectTokenId.toString(),
      batchId: onChainBatchId?.toString() ?? null,
      merkleProof: proof,
      issuer: {
        name: cred.organization.name,
        walletAddress: cred.organization.walletAddress,
      },
      onChain: {
        merkleRoot: cred.batch?.merkleRoot ?? null,
        issuedAt: cred.issuedAt?.toISOString() ?? null,
        revoked,
        txHash: cred.batch?.txHash ?? null,
        verified: verified && !revoked,
      },
    };
  }

  async publicProfile(tokenId: bigint): Promise<PublicProfileResponse> {
    const profile = await this.credentials.findPublicProfileByTokenId(tokenId);
    if (!profile) {
      throw new NotFoundException({
        error: 'TalentPassNotFound',
        message: `No existe un TalentPass con tokenId ${tokenId}`,
      });
    }

    const experiences = profile.credentials.map((c) => ({
      credentialHash: c.credentialHash,
      programTitle: c.experience.program.title,
      organizationName: c.organization.name,
      role: c.experience.role,
      startDate: c.experience.startDate.toISOString(),
      endDate: c.experience.endDate?.toISOString() ?? null,
      txHash: c.batch?.txHash ?? null,
      revoked: c.status === 'REVOKED',
      evidences: c.experience.evidences.map((e) => ({
        type: e.type,
        url: e.url,
        label: e.label,
      })),
      skills: {
        hard: c.experience.skillClaims.filter((s) => s.type === 'HARD').map((s) => s.name),
        human: c.experience.skillClaims.filter((s) => s.type === 'HUMAN').map((s) => s.name),
      },
    }));

    return {
      tokenId: (profile.tokenId as bigint).toString(),
      fullName: profile.fullName,
      headline: profile.headline,
      // Sin email, sin telefono, sin wallet: el perfil publico no lleva PII.
      isVerified: experiences.some((e) => !e.revoked),
      experienceCount: experiences.length,
      experiences,
      skills: summarizeSkills(profile.credentials),
    };
  }
}

/**
 * Agrupa las skills confirmadas por nombre y cuenta EN CUANTAS EXPERIENCIAS
 * aparecen.
 *
 * Este conteo es la alternativa deliberada al puntaje. "Colaboración —
 * demostrada en 3 experiencias" dice de donde sale la afirmacion y quien la
 * respalda; "Liderazgo 87/100" no dice nada y jerarquiza personas.
 * Ver 00-CONTEXT.md §2.1.
 */
function summarizeSkills(
  credentials: Array<{
    experience: {
      program: { title: string };
      skillClaims: Array<{ name: string; type: string }>;
    };
  }>,
): PublicSkill[] {
  const acumulado = new Map<string, PublicSkill>();

  for (const cred of credentials) {
    for (const skill of cred.experience.skillClaims) {
      const actual = acumulado.get(skill.name);
      if (actual) {
        actual.experienceCount += 1;
        actual.experienceTitles.push(cred.experience.program.title);
      } else {
        acumulado.set(skill.name, {
          name: skill.name,
          type: skill.type as 'HARD' | 'HUMAN',
          experienceCount: 1,
          experienceTitles: [cred.experience.program.title],
        });
      }
    }
  }

  // Mas evidencias primero; a igualdad, alfabetico. Es un orden de lectura, no
  // un ranking de personas: ordena las skills de UN perfil, nunca perfiles entre si.
  return [...acumulado.values()].sort(
    (a, b) => b.experienceCount - a.experienceCount || a.name.localeCompare(b.name),
  );
}
