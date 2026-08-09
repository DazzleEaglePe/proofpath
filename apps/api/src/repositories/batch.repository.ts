import { Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface PersistCredentialInput {
  experienceId: string;
  talentProfileId: string;
  vcJson: Prisma.InputJsonValue;
  credentialHash: string;
  merkleProof: string[];
  subjectTokenId: bigint;
}

export interface PersistIssuedBatchInput {
  organizationId: string;
  onChainBatchId: bigint;
  merkleRoot: string;
  size: number;
  schemaId: string;
  txHash: string;
  issuedAt: Date;
  credentials: PersistCredentialInput[];
}

@Injectable()
export class BatchRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persiste el batch, sus credenciales y el nuevo estado de las experiencias en
   * **una sola transaccion**.
   *
   * Es importante que sea atomico: si se guardaran las credenciales sin marcar
   * las experiencias como ISSUED, un segundo click en "Emitir batch" las emitiria
   * de nuevo y el joven terminaria con credenciales duplicadas en pantalla, en
   * vivo. La transaccion, o entra todo o no entra nada.
   */
  async persistIssuedBatch(input: PersistIssuedBatchInput) {
    return this.prisma.$transaction(async (tx) => {
      const batch = await tx.batch.create({
        data: {
          organizationId: input.organizationId,
          onChainBatchId: input.onChainBatchId,
          merkleRoot: input.merkleRoot,
          size: input.size,
          schemaId: input.schemaId,
          txHash: input.txHash,
          issuedAt: input.issuedAt,
        },
      });

      for (const cred of input.credentials) {
        await tx.credential.create({
          data: {
            experienceId: cred.experienceId,
            organizationId: input.organizationId,
            talentProfileId: cred.talentProfileId,
            batchId: batch.id,
            vcJson: cred.vcJson,
            credentialHash: cred.credentialHash,
            merkleProof: cred.merkleProof,
            subjectTokenId: cred.subjectTokenId,
            status: 'ISSUED',
            issuedAt: input.issuedAt,
          },
        });
      }

      await tx.experience.updateMany({
        where: { id: { in: input.credentials.map((c) => c.experienceId) } },
        data: { status: 'ISSUED' },
      });

      return batch;
    });
  }
}
