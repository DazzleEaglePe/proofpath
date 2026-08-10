import { ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Hex } from 'viem';
import { CHAIN_ADAPTER, type ChainAdapter } from '../chain/chain-adapter';
import { CredentialRepository } from '../repositories/credential.repository';

export interface RevokeResponse {
  credentialHash: string;
  revoked: true;
  txHash: string;
  revokedAt: string;
}

/**
 * Revocación de credenciales — 06-API-SPEC.md §4.
 *
 * Es uno de los cuatro argumentos de "por qué blockchain" (`00-CONTEXT §3`) y la
 * respuesta a la pregunta del jurado *"¿cómo evitan que una ONG mienta?"*
 * (`03-DEMO-SCRIPT §4`): no eliminamos la confianza, la hacemos auditable.
 *
 * La cadena se marca PRIMERO. Si el orden fuera al revés y la transacción
 * fallara, la base diría "revocada" mientras cualquiera que verifique contra el
 * contrato seguiría viendo la credencial como válida — y la cadena es la fuente
 * de verdad (`02-DATA-MODEL §3`).
 */
@Injectable()
export class RevocationService {
  private readonly logger = new Logger(RevocationService.name);

  constructor(
    private readonly credentials: CredentialRepository,
    @Inject(CHAIN_ADAPTER) private readonly chain: ChainAdapter,
  ) {}

  async revoke(credentialHash: string, callerOrganizationId: string): Promise<RevokeResponse> {
    const cred = await this.credentials.findByHash(credentialHash);
    if (!cred) {
      throw new NotFoundException({
        error: 'CredentialNotFound',
        message: `No existe ninguna credencial con hash ${credentialHash}`,
      });
    }

    // Solo la organización emisora puede revocar lo que emitió.
    if (cred.organizationId !== callerOrganizationId) {
      throw new ForbiddenException({
        error: 'NotYourCredential',
        message: 'Esta credencial la emitió otra organización',
      });
    }

    // Idempotente: revocar dos veces no es un error, es el mismo resultado.
    if (cred.status === 'REVOKED') {
      return {
        credentialHash: cred.credentialHash,
        revoked: true,
        txHash: '',
        revokedAt: cred.revokedAt?.toISOString() ?? new Date().toISOString(),
      };
    }

    const txHash = await this.chain.revoke(cred.credentialHash as Hex);
    const actualizada = await this.credentials.markRevoked(cred.credentialHash);

    this.logger.warn(
      `Credencial ${cred.credentialHash} revocada por la organizacion ${callerOrganizationId} (${txHash})`,
    );

    return {
      credentialHash: actualizada.credentialHash,
      revoked: true,
      txHash,
      revokedAt: (actualizada.revokedAt ?? new Date()).toISOString(),
    };
  }
}
