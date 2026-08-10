import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CredentialRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Lookup por el hash, que es como llega cualquiera desde un link publico. */
  findByHash(credentialHash: string) {
    return this.prisma.credential.findUnique({
      where: { credentialHash: credentialHash.toLowerCase() },
      include: {
        batch: true,
        organization: true,
        experience: { include: { program: true } },
      },
    });
  }

  /**
   * Perfil publico por tokenId. Trae solo credenciales emitidas: una credencial
   * PENDING no existe para el mundo exterior.
   */
  findPublicProfileByTokenId(tokenId: bigint) {
    return this.prisma.talentProfile.findUnique({
      where: { tokenId },
      include: {
        credentials: {
          where: { status: 'ISSUED' },
          include: {
            batch: true,
            organization: true,
            experience: {
              include: {
                program: true,
                evidences: true,
                skillClaims: { where: { confirmed: true }, orderBy: { name: 'asc' } },
              },
            },
          },
          orderBy: { issuedAt: 'desc' },
        },
      },
    });
  }

  markRevoked(credentialHash: string) {
    return this.prisma.credential.update({
      where: { credentialHash: credentialHash.toLowerCase() },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });
  }
}
