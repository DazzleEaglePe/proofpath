import { NotFoundException } from '@nestjs/common';
import { buildMerkleTree, credentialHash, leafOf } from '@proofpath/shared';
import { MockChainAdapter } from '../chain/mock-chain.adapter';
import { buildVc } from '../credentials/vc-builder';
import type { CredentialRepository } from '../repositories/credential.repository';
import type { RouteRepository } from '../repositories/route.repository';
import { VerificationService } from './verification.service';

/**
 * Sin rutas sembradas: estos tests miran el perfil publico, no el motor de
 * rutas, que tiene su propia suite en `talent/route-progress.spec.ts`.
 */
const sinRutas = {
  listOpenWithMilestones: jest.fn(async () => []),
  findPendingExperiences: jest.fn(async () => []),
} as unknown as RouteRepository;

describe('VerificationService', () => {
  const ORG = { name: 'Fundación Impulso Joven', walletAddress: '0x1111111111111111111111111111111111111111' };

  function vcDeEjemplo(role = 'Full Stack Developer') {
    return buildVc({
      chainId: 421614,
      schemaId: 'proofpath.experience.v1',
      issuedAt: new Date('2026-08-09T14:00:00Z'),
      organization: ORG,
      talent: { walletAddress: '0x2222222222222222222222222222222222222222', tokenId: 42n },
      program: { title: 'Plataforma de mentorías juveniles' },
      experience: {
        role,
        contributions: 'Dashboard y autenticación',
        startDate: new Date('2026-03-01T00:00:00Z'),
        endDate: new Date('2026-07-01T00:00:00Z'),
        hoursCommitted: 320,
      },
      evidences: [{ type: 'REPOSITORY', url: 'https://github.com/x' }],
      skills: [
        { name: 'React', type: 'HARD' },
        { name: 'Colaboración', type: 'HUMAN' },
      ],
    });
  }

  /** Emite de verdad en el adapter mock y arma la fila como quedaria en la base. */
  async function escenario(opts: { vcGuardado?: unknown; status?: string } = {}) {
    const vc = vcDeEjemplo();
    const hash = credentialHash(vc);
    const tokenId = 42n;
    const tree = buildMerkleTree([leafOf(hash, tokenId)]);

    const chain = new MockChainAdapter();
    const { onChainBatchId, txHash } = await chain.issueBatch(tree.root, 1, 'proofpath.experience.v1');

    const fila = {
      id: 'cred_1',
      credentialHash: hash,
      // Permite simular que alguien edito la fila por fuera de la aplicacion.
      vcJson: opts.vcGuardado ?? vc,
      merkleProof: tree.proofFor(0),
      subjectTokenId: tokenId,
      status: opts.status ?? 'ISSUED',
      issuedAt: new Date('2026-08-09T14:00:00Z'),
      batch: { onChainBatchId, merkleRoot: tree.root, txHash },
      organization: ORG,
      experience: { program: { title: 'Plataforma de mentorías juveniles' } },
    };

    const repo = {
      findByHash: jest.fn(async (h: string) => (h.toLowerCase() === hash ? fila : null)),
      findPublicProfileByTokenId: jest.fn(),
    } as unknown as CredentialRepository;

    return { service: new VerificationService(repo, chain, sinRutas), chain, hash, vc };
  }

  it('devuelve el VC crudo, no solo un booleano', async () => {
    const { service, hash, vc } = await escenario();

    const res = await service.verify(hash);

    // De esto depende el bloque del hash roto: el navegador necesita el VC
    // completo para recomputar el hash por su cuenta.
    expect(res.vc).toEqual(vc);
    expect(res.merkleProof).toBeDefined();
    expect(res.batchId).toBe('1');
  });

  it('verifica contra la cadena y devuelve verified true', async () => {
    const { service, hash } = await escenario();

    const res = await service.verify(hash);

    expect(res.onChain.verified).toBe(true);
    expect(res.onChain.revoked).toBe(false);
  });

  it('detecta que el VC guardado fue editado y no lo da por verificado', async () => {
    // Alguien cambia una letra del rol directamente en la base de datos.
    const manipulado = vcDeEjemplo('Full Stack Developeer');
    const { service, hash } = await escenario({ vcGuardado: manipulado });

    const res = await service.verify(hash);

    expect(res.onChain.verified).toBe(false);
  });

  it('una credencial revocada no verifica', async () => {
    const { service, chain, hash } = await escenario();
    await chain.revoke(hash);

    const res = await service.verify(hash);

    expect(res.onChain.revoked).toBe(true);
    expect(res.onChain.verified).toBe(false);
  });

  it('falla claro si el hash no existe', async () => {
    const { service } = await escenario();

    await expect(service.verify(`0x${'00'.repeat(32)}`)).rejects.toThrow(NotFoundException);
  });

  it('el perfil publico no expone PII y cuenta experiencias en vez de puntuar', async () => {
    const credencial = (programa: string, skills: Array<{ name: string; type: string }>) => ({
      credentialHash: `0x${'11'.repeat(32)}`,
      status: 'ISSUED',
      issuedAt: new Date(),
      batch: { txHash: '0xabc' },
      organization: ORG,
      experience: {
        role: 'Voluntario',
        startDate: new Date('2026-03-01T00:00:00Z'),
        endDate: null,
        program: { title: programa },
        evidences: [],
        skillClaims: skills,
      },
    });

    const repo = {
      findByHash: jest.fn(),
      findPublicProfileByTokenId: jest.fn(async () => ({
        tokenId: 42n,
        fullName: 'Luis S.',
        headline: 'Organizador comunitario',
        email: 'luis@example.com',
        phone: '999888777',
        walletAddress: '0xsecreto',
        encryptedPrivateKey: 'no-deberia-salir',
        credentials: [
          credencial('Proyecto de Datos', [{ name: 'Colaboración', type: 'HUMAN' }]),
          credencial('Campaña Humanitaria', [{ name: 'Colaboración', type: 'HUMAN' }]),
          credencial('Programa de Mentoría', [
            { name: 'Colaboración', type: 'HUMAN' },
            { name: 'Comunicación', type: 'HUMAN' },
          ]),
        ],
      })),
    } as unknown as CredentialRepository;

    const service = new VerificationService(repo, new MockChainAdapter(), sinRutas);
    const perfil = await service.publicProfile(42n);

    // Conteo de evidencias, no puntaje.
    const colaboracion = perfil.skills.find((s) => s.name === 'Colaboración');
    expect(colaboracion?.experienceCount).toBe(3);
    expect(colaboracion?.experienceTitles).toEqual([
      'Proyecto de Datos',
      'Campaña Humanitaria',
      'Programa de Mentoría',
    ]);
    expect(Object.keys(colaboracion ?? {}).sort()).toEqual([
      'experienceCount',
      'experienceTitles',
      'name',
      'type',
    ]);

    // Nada de PII en la respuesta publica.
    const serializado = JSON.stringify(perfil);
    expect(serializado).not.toContain('luis@example.com');
    expect(serializado).not.toContain('999888777');
    expect(serializado).not.toContain('no-deberia-salir');

    // Puntos por dimension, sin total. Ver 00-CONTEXT §2.1.
    expect(Array.isArray(perfil.points)).toBe(true);
    expect(perfil).not.toHaveProperty('totalPoints');
  });

  // PRIVACIDAD: en la superficie autenticada una experiencia sin emitir pinta
  // "en revision". Aqui NO: seria publicar una afirmacion que nadie verifico,
  // en una pagina que cualquiera abre. Este test lo blinda porque es el tipo de
  // regresion que no rompe nada y solo se nota cuando ya filtro.
  it('el perfil publico nunca muestra hitos en revision', async () => {
    const conRuta = {
      listOpenWithMilestones: jest.fn(async () => [
        {
          id: 'route_1',
          title: 'Beca Semilla',
          description: 'Convocatoria de demostración',
          closesAt: null,
          organization: { name: 'Fondo Semilla', isTrusted: true },
          milestones: [
            {
              id: 'ms_1',
              order: 1,
              title: 'Formación acreditada',
              kind: 'CREDENTIAL_IN_CATEGORY',
              category: 'APRENDIZAJE',
              skillName: null,
              requiredHours: null,
            },
          ],
        },
      ]),
      findPendingExperiences: jest.fn(),
    } as unknown as RouteRepository;

    const repo = {
      findByHash: jest.fn(),
      // Un talento SIN credenciales emitidas, pero con experiencias en curso.
      findPublicProfileByTokenId: jest.fn(async () => ({
        tokenId: 7n,
        fullName: 'Myriam C.',
        headline: null,
        credentials: [],
      })),
    } as unknown as CredentialRepository;

    const service = new VerificationService(repo, new MockChainAdapter(), conRuta);
    const perfil = await service.publicProfile(7n);

    expect(perfil.routes[0].progress.milestones[0].state).toBe('PENDING');
    expect(JSON.stringify(perfil)).not.toContain('IN_REVIEW');
    // Y jamas se consulta lo que esta sin emitir.
    expect(conRuta.findPendingExperiences).not.toHaveBeenCalled();
  });
});
