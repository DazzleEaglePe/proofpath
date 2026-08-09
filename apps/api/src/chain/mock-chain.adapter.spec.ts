import { buildMerkleTree, leafOf } from '@proofpath/shared';
import { keccak256, toHex, type Hex } from 'viem';
import { MockChainAdapter } from './mock-chain.adapter';

/**
 * El plan B de la demo tiene que ser honesto: un mock que devuelve `true` a ciegas
 * no es un respaldo, es una mentira que se descubre en el peor momento posible.
 *
 * Estos tests fijan que en modo MOCK la verificacion sigue siendo real.
 */
describe('MockChainAdapter', () => {
  const CRED: Hex[] = [0, 1, 2].map((i) => keccak256(toHex(`credencial-${i}`)));
  const TOKEN_IDS = [1n, 2n, 3n];

  const tree = buildMerkleTree(CRED.map((c, i) => leafOf(c, TOKEN_IDS[i])));

  let adapter: MockChainAdapter;

  beforeEach(() => {
    adapter = new MockChainAdapter();
  });

  it('verifica de verdad un proof valido', async () => {
    const { onChainBatchId } = await adapter.issueBatch(tree.root, 3, 'proofpath.experience.v1');

    await expect(adapter.verifyProof(onChainBatchId, CRED[0], TOKEN_IDS[0], tree.proofFor(0))).resolves.toBe(
      true,
    );
  });

  it('rechaza una credencial manipulada — es la premisa del bloque del hash roto', async () => {
    const { onChainBatchId } = await adapter.issueBatch(tree.root, 3, 'proofpath.experience.v1');
    const hashManipulado = keccak256(toHex('credencial-0-editada'));

    await expect(
      adapter.verifyProof(onChainBatchId, hashManipulado, TOKEN_IDS[0], tree.proofFor(0)),
    ).resolves.toBe(false);
  });

  it('rechaza el tokenId equivocado', async () => {
    const { onChainBatchId } = await adapter.issueBatch(tree.root, 3, 'proofpath.experience.v1');

    await expect(adapter.verifyProof(onChainBatchId, CRED[0], 999n, tree.proofFor(0))).resolves.toBe(false);
  });

  it('devuelve false tras revocar, sin lanzar', async () => {
    const { onChainBatchId } = await adapter.issueBatch(tree.root, 3, 'proofpath.experience.v1');
    await adapter.revoke(CRED[0]);

    await expect(adapter.verifyProof(onChainBatchId, CRED[0], TOKEN_IDS[0], tree.proofFor(0))).resolves.toBe(
      false,
    );
    await expect(adapter.isRevoked(CRED[0])).resolves.toBe(true);
  });

  it('devuelve false para un batch que no existe', async () => {
    await expect(adapter.verifyProof(42n, CRED[0], TOKEN_IDS[0], tree.proofFor(0))).resolves.toBe(false);
  });

  it('guarda el batch con su root, tamaño y schema', async () => {
    const { onChainBatchId } = await adapter.issueBatch(tree.root, 3, 'proofpath.experience.v1');
    const batch = await adapter.getBatch(onChainBatchId);

    expect(batch).not.toBeNull();
    expect(batch?.merkleRoot).toBe(tree.root.toLowerCase());
    expect(batch?.size).toBe(3);
    expect(batch?.schemaId).toBe('proofpath.experience.v1');
  });

  it('rechaza el batch vacio, igual que el contrato', async () => {
    await expect(adapter.issueBatch(tree.root, 0, 'proofpath.experience.v1')).rejects.toThrow(/vacio/);
  });

  it('no deja acuñar dos TalentPass a la misma wallet', async () => {
    const wallet = '0x1111111111111111111111111111111111111111' as const;

    const first = await adapter.mintTalentPass(wallet, 'cid');
    expect(first.tokenId).toBe(1n);

    await expect(adapter.mintTalentPass(wallet, 'cid')).rejects.toThrow(/ya tiene/);
  });

  it('los txHash son deterministas, para que los ensayos sean reproducibles', async () => {
    const a = new MockChainAdapter();
    const b = new MockChainAdapter();

    const ra = await a.issueBatch(tree.root, 3, 'proofpath.experience.v1');
    const rb = await b.issueBatch(tree.root, 3, 'proofpath.experience.v1');

    expect(ra.txHash).toBe(rb.txHash);
  });
});
