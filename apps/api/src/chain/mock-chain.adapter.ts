import { Injectable, Logger } from '@nestjs/common';
import { leafOf, verifyProof as verifyMerkleProof } from '@proofpath/shared';
import { keccak256, toHex, type Address, type Hex } from 'viem';
import type { BatchInfo, ChainAdapter, IssueBatchResult, MintPassResult } from './chain-adapter';

/**
 * Implementacion en memoria — el plan B de la demo (03-DEMO-SCRIPT.md §2).
 *
 * Decision importante: este mock NO devuelve `true` a ciegas. Guarda los roots de
 * los batches y **verifica los Merkle proofs de verdad**, con las mismas funciones
 * de `packages/shared` que usan el contrato y el navegador.
 *
 * Eso significa que con `CHAIN_ADAPTER=MOCK` el flujo completo sigue siendo real
 * salvo por la transaccion: una credencial manipulada sigue dando `false`, y el
 * bloque del hash roto —el clima del pitch— funciona igual sin RPC.
 *
 * Un mock que devolviera `true` siempre convertiria el plan B en una mentira, y
 * si el jurado pide manipular el dato, se cae la demo y la credibilidad con ella.
 */
@Injectable()
export class MockChainAdapter implements ChainAdapter {
  readonly name = 'mock' as const;

  private readonly logger = new Logger(MockChainAdapter.name);

  private readonly batches = new Map<bigint, BatchInfo>();
  private readonly revokedHashes = new Set<string>();
  private readonly tokenIdByAddress = new Map<string, bigint>();

  private nextBatchId = 1n;
  private nextTokenId = 1n;

  /** Direccion ficticia estable: en modo mock no hay llave real involucrada. */
  private readonly relayer = '0x000000000000000000000000000000000000dEaD' as Address;

  constructor() {
    this.logger.warn('ChainAdapter en modo MOCK: no se toca la cadena. Los proofs si se verifican.');
  }

  relayerAddress(): Address {
    return this.relayer;
  }

  async mintTalentPass(to: Address, _cid: string): Promise<MintPassResult> {
    const key = to.toLowerCase();
    const existing = this.tokenIdByAddress.get(key);
    if (existing !== undefined) {
      throw new Error(`${to} ya tiene un TalentPass (#${existing})`);
    }

    const tokenId = this.nextTokenId++;
    this.tokenIdByAddress.set(key, tokenId);
    return { tokenId, txHash: this.fakeTxHash(`mint:${key}:${tokenId}`) };
  }

  async issueBatch(merkleRoot: Hex, size: number, schemaId: string): Promise<IssueBatchResult> {
    if (size === 0) throw new Error('EmptyBatch: no se puede emitir un batch vacio');

    const onChainBatchId = this.nextBatchId++;
    this.batches.set(onChainBatchId, {
      issuer: this.relayer,
      merkleRoot: merkleRoot.toLowerCase() as Hex,
      issuedAt: new Date(),
      size,
      schemaId,
    });

    this.logger.log(`[mock] Batch ${onChainBatchId} con ${size} credenciales`);
    return { onChainBatchId, txHash: this.fakeTxHash(`batch:${onChainBatchId}:${merkleRoot}`) };
  }

  async revoke(credentialHash: Hex): Promise<Hex> {
    this.revokedHashes.add(credentialHash.toLowerCase());
    return this.fakeTxHash(`revoke:${credentialHash}`);
  }

  async verifyProof(
    onChainBatchId: bigint,
    credentialHash: Hex,
    subjectTokenId: bigint,
    proof: Hex[],
  ): Promise<boolean> {
    // Mismo orden de comprobaciones que el contrato: revocacion primero.
    if (this.revokedHashes.has(credentialHash.toLowerCase())) return false;

    const batch = this.batches.get(onChainBatchId);
    if (!batch) return false;

    return verifyMerkleProof(proof, batch.merkleRoot, leafOf(credentialHash, subjectTokenId));
  }

  async isRevoked(credentialHash: Hex): Promise<boolean> {
    return this.revokedHashes.has(credentialHash.toLowerCase());
  }

  async getBatch(onChainBatchId: bigint): Promise<BatchInfo | null> {
    return this.batches.get(onChainBatchId) ?? null;
  }

  /**
   * Hash determinista con forma de txHash. Se ve creible en pantalla y, al ser
   * determinista, la misma accion produce siempre el mismo valor: los ensayos de
   * la demo son reproducibles.
   */
  private fakeTxHash(seed: string): Hex {
    return keccak256(toHex(`proofpath:mock:${seed}`));
  }
}
