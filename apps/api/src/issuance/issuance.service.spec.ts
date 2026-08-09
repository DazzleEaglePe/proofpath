import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MockChainAdapter } from '../chain/mock-chain.adapter';
import type { BatchRepository, PersistIssuedBatchInput } from '../repositories/batch.repository';
import type {
  ExperienceRepository,
  IssuableExperience,
} from '../repositories/experience.repository';
import { IssuanceService } from './issuance.service';

/**
 * El flujo de emision completo, sin base de datos y sin cadena real.
 *
 * El test que mas vale es el ultimo: emite y despues **verifica contra el
 * adapter**, que hace verificacion de Merkle de verdad. Cierra el circuito
 * emision → verificacion, que es exactamente lo que se muestra en la demo.
 */
describe('IssuanceService', () => {
  const ORG = {
    id: 'org_1',
    name: 'Fundación Impulso Joven',
    walletAddress: '0x1111111111111111111111111111111111111111',
  };

  function experiencia(overrides: Partial<Record<string, unknown>> = {}): IssuableExperience {
    const base = {
      id: 'exp_1',
      talentProfileId: 'tp_1',
      role: 'Full Stack Developer',
      contributions: 'Dashboard, autenticación, integración API',
      hoursCommitted: 320,
      startDate: new Date('2026-03-01T00:00:00Z'),
      endDate: new Date('2026-07-01T00:00:00Z'),
      status: 'ORG_CONFIRMED',
      program: {
        title: 'Plataforma de mentorías juveniles',
        organizationId: ORG.id,
        organization: { walletAddress: ORG.walletAddress, name: ORG.name },
      },
      talentProfile: {
        id: 'tp_1',
        walletAddress: '0x2222222222222222222222222222222222222222',
        tokenId: 42n,
      },
      evidences: [{ type: 'REPOSITORY', url: 'https://github.com/ejemplo' }],
      skillClaims: [
        { name: 'React', type: 'HARD', confirmed: true },
        { name: 'Colaboración', type: 'HUMAN', confirmed: true },
      ],
    };
    return { ...base, ...overrides } as unknown as IssuableExperience;
  }

  function build(experiencias: IssuableExperience[]) {
    const persisted: PersistIssuedBatchInput[] = [];

    const experiences = {
      findManyForIssuance: jest
        .fn()
        .mockImplementation(async (ids: string[]) =>
          experiencias.filter((e) => ids.includes(e.id)),
        ),
    } as unknown as ExperienceRepository;

    const batches = {
      persistIssuedBatch: jest.fn().mockImplementation(async (input: PersistIssuedBatchInput) => {
        persisted.push(input);
        return { id: 'batch_1' };
      }),
    } as unknown as BatchRepository;

    const chain = new MockChainAdapter();
    return { service: new IssuanceService(experiences, batches, chain), chain, persisted };
  }

  it('emite las N credenciales en una sola transaccion', async () => {
    const exps = [
      experiencia({ id: 'exp_1', talentProfileId: 'tp_1' }),
      experiencia({
        id: 'exp_2',
        talentProfileId: 'tp_2',
        talentProfile: { id: 'tp_2', walletAddress: '0x3333333333333333333333333333333333333333', tokenId: 43n },
      }),
      experiencia({
        id: 'exp_3',
        talentProfileId: 'tp_3',
        talentProfile: { id: 'tp_3', walletAddress: '0x4444444444444444444444444444444444444444', tokenId: 44n },
      }),
    ];
    const { service, persisted } = build(exps);

    const res = await service.issueBatch(['exp_1', 'exp_2', 'exp_3']);

    expect(res.size).toBe(3);
    expect(res.credentials).toHaveLength(3);
    expect(res.merkleRoot).toMatch(/^0x[0-9a-f]{64}$/);
    expect(persisted).toHaveLength(1);
    expect(persisted[0].credentials).toHaveLength(3);
  });

  it('cierra el circuito: lo que emite, despues verifica contra la cadena', async () => {
    const { service, chain, persisted } = build([experiencia()]);

    const res = await service.issueBatch(['exp_1']);
    const guardada = persisted[0].credentials[0];

    await expect(
      chain.verifyProof(
        BigInt(res.onChainBatchId),
        guardada.credentialHash as `0x${string}`,
        guardada.subjectTokenId,
        guardada.merkleProof as `0x${string}`[],
      ),
    ).resolves.toBe(true);
  });

  it('una credencial manipulada deja de verificar', async () => {
    const { service, chain, persisted } = build([experiencia()]);
    const res = await service.issueBatch(['exp_1']);
    const guardada = persisted[0].credentials[0];

    const manipulado = `0x${'ab'.repeat(32)}` as `0x${string}`;
    await expect(
      chain.verifyProof(
        BigInt(res.onChainBatchId),
        manipulado,
        guardada.subjectTokenId,
        guardada.merkleProof as `0x${string}`[],
      ),
    ).resolves.toBe(false);
  });

  it('el VC guardado solo lleva skills confirmadas y ningun score', async () => {
    const { service, persisted } = build([experiencia()]);
    await service.issueBatch(['exp_1']);

    const vc = persisted[0].credentials[0].vcJson as unknown as {
      credentialSubject: { skills: { hard: string[]; human: string[] } };
    };

    expect(vc.credentialSubject.skills.hard).toEqual(['React']);
    expect(vc.credentialSubject.skills.human).toEqual(['Colaboración']);

    const serializado = JSON.stringify(vc);
    expect(serializado).not.toMatch(/score|nivel|level|puntaje|rating/i);
  });

  it('rechaza si una experiencia no esta confirmada por la organizacion', async () => {
    const { service } = build([experiencia({ status: 'AI_ANALYZED' })]);

    await expect(service.issueBatch(['exp_1'])).rejects.toThrow(BadRequestException);
  });

  it('rechaza si no hay ninguna skill confirmada — la IA no emite sola', async () => {
    const { service } = build([experiencia({ skillClaims: [] })]);

    await expect(service.issueBatch(['exp_1'])).rejects.toThrow(BadRequestException);
  });

  it('rechaza si el talento todavia no tiene TalentPass', async () => {
    const { service } = build([
      experiencia({
        talentProfile: { id: 'tp_1', walletAddress: null, tokenId: null },
      }),
    ]);

    await expect(service.issueBatch(['exp_1'])).rejects.toThrow(BadRequestException);
  });

  it('rechaza mezclar organizaciones en un mismo batch', async () => {
    const otra = experiencia({
      id: 'exp_2',
      program: {
        title: 'Otro programa',
        organizationId: 'org_2',
        organization: { walletAddress: '0x9999999999999999999999999999999999999999', name: 'Otra ONG' },
      },
    });
    const { service } = build([experiencia(), otra]);

    await expect(service.issueBatch(['exp_1', 'exp_2'])).rejects.toThrow(BadRequestException);
  });

  it('rechaza experiencias inexistentes', async () => {
    const { service } = build([experiencia()]);

    await expect(service.issueBatch(['exp_1', 'exp_fantasma'])).rejects.toThrow(NotFoundException);
  });

  it('rechaza el batch vacio', async () => {
    const { service } = build([]);

    await expect(service.issueBatch([])).rejects.toThrow(BadRequestException);
  });

  it('no emite nada si una sola experiencia del lote esta mal', async () => {
    const { service, persisted } = build([experiencia(), experiencia({ id: 'exp_2', skillClaims: [] })]);

    await expect(service.issueBatch(['exp_1', 'exp_2'])).rejects.toThrow(BadRequestException);
    expect(persisted).toHaveLength(0);
  });
});
