import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MockChainAdapter } from '../chain/mock-chain.adapter';
import type { CredentialRepository } from '../repositories/credential.repository';
import { RevocationService } from './revocation.service';

/**
 * La revocacion auditable es uno de los cuatro argumentos de "por que
 * blockchain" (00-CONTEXT §3) y la respuesta a "¿como evitan que una ONG
 * mienta?" del jurado. Estos tests fijan que funcione y que nadie pueda revocar
 * lo que no emitio.
 */
describe('RevocationService', () => {
  const HASH = `0x${'ab'.repeat(32)}`;
  const ORG = 'org_1';

  function build(opts: { status?: string; organizationId?: string } = {}) {
    const fila = {
      id: 'cred_1',
      credentialHash: HASH,
      organizationId: opts.organizationId ?? ORG,
      status: opts.status ?? 'ISSUED',
      revokedAt: opts.status === 'REVOKED' ? new Date('2026-08-01T00:00:00Z') : null,
    };

    const repo = {
      findByHash: jest.fn(async (h: string) => (h.toLowerCase() === HASH ? fila : null)),
      markRevoked: jest.fn(async () => ({
        ...fila,
        status: 'REVOKED',
        revokedAt: new Date('2026-08-10T00:00:00Z'),
      })),
    } as unknown as CredentialRepository;

    const chain = new MockChainAdapter();
    return { service: new RevocationService(repo, chain), chain, repo };
  }

  it('revoca en la cadena y en la base', async () => {
    const { service, chain, repo } = build();

    const res = await service.revoke(HASH, ORG);

    expect(res.revoked).toBe(true);
    expect(res.txHash).toMatch(/^0x[0-9a-f]{64}$/);
    await expect(chain.isRevoked(HASH as `0x${string}`)).resolves.toBe(true);
    expect(repo.markRevoked).toHaveBeenCalled();
  });

  it('marca la cadena antes que la base', async () => {
    // Si fuera al reves y la tx fallara, la base diria "revocada" mientras
    // cualquiera que verifique contra el contrato la seguiria viendo valida.
    const { service, chain, repo } = build();
    const orden: string[] = [];

    const revokeOriginal = chain.revoke.bind(chain);
    jest.spyOn(chain, 'revoke').mockImplementation(async (h) => {
      orden.push('cadena');
      return revokeOriginal(h);
    });
    (repo.markRevoked as jest.Mock).mockImplementation(async () => {
      orden.push('base');
      return { credentialHash: HASH, revokedAt: new Date() };
    });

    await service.revoke(HASH, ORG);

    expect(orden).toEqual(['cadena', 'base']);
  });

  it('una organizacion no puede revocar lo que emitio otra', async () => {
    const { service, repo } = build({ organizationId: 'org_2' });

    await expect(service.revoke(HASH, ORG)).rejects.toThrow(ForbiddenException);
    expect(repo.markRevoked).not.toHaveBeenCalled();
  });

  it('revocar dos veces no es un error', async () => {
    const { service, repo } = build({ status: 'REVOKED' });

    const res = await service.revoke(HASH, ORG);

    expect(res.revoked).toBe(true);
    // No se vuelve a tocar la cadena ni la base: ya estaba revocada.
    expect(repo.markRevoked).not.toHaveBeenCalled();
  });

  it('falla claro si la credencial no existe', async () => {
    const { service } = build();

    await expect(service.revoke(`0x${'00'.repeat(32)}`, ORG)).rejects.toThrow(NotFoundException);
  });
});
