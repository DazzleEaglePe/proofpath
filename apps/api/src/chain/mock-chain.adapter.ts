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

  /**
   * Continua los contadores desde donde quedo la base de datos.
   *
   * Sin esto, el mock reinicia en 1 con cada arranque del backend mientras la
   * base conserva los tokenId y batchId ya usados, y la siguiente escritura
   * choca contra una restriccion unique. Pasa siempre que se reinicia la API
   * despues de sembrar o de emitir: justo lo que uno hace entre ensayo y ensayo
   * de la demo.
   *
   * Un contrato real no tiene este problema porque el contador vive en la
   * cadena y sobrevive al proceso. El mock tiene que imitar esa persistencia.
   */
  primeCounters(nextTokenId: bigint, nextBatchId: bigint): void {
    this.nextTokenId = nextTokenId > this.nextTokenId ? nextTokenId : this.nextTokenId;
    this.nextBatchId = nextBatchId > this.nextBatchId ? nextBatchId : this.nextBatchId;
    this.logger.log(
      `[mock] Contadores sincronizados con la base: proximo tokenId ${this.nextTokenId}, proximo batchId ${this.nextBatchId}`,
    );
  }

  /**
   * Rehidrata las raices Merkle y las revocaciones desde la base.
   *
   * SIN ESTO EL MOCK PIERDE TODO LO EMITIDO EN CADA REINICIO. Los contadores se
   * restauraban pero las raices no, asi que despues de un deploy, un reciclaje
   * de contenedor o un idle del PaaS, `verifyProof` no encontraba el batch y
   * TODA credencial anterior pasaba a `verified: false` — sin error y sin log.
   *
   * Se detecto en el entorno desplegado: una credencial con merkleRoot, txHash y
   * sin revocar daba falso. Es decir, el momento central del pitch en rojo.
   *
   * Un contrato real no necesita esto porque su estado vive en la cadena. El
   * mock tiene que imitar esa persistencia, y "imitarla" incluye sobrevivir al
   * proceso, no solo no chocar con un unique.
   */
  primeState(
    batches: Array<{
      onChainBatchId: bigint;
      merkleRoot: string;
      size: number;
      schemaId: string;
      issuedAt: Date | null;
    }>,
    revokedHashes: string[],
  ): void {
    for (const batch of batches) {
      this.batches.set(batch.onChainBatchId, {
        issuer: this.relayer,
        merkleRoot: batch.merkleRoot.toLowerCase() as Hex,
        issuedAt: batch.issuedAt ?? new Date(),
        size: batch.size,
        schemaId: batch.schemaId,
      });
    }
    for (const hash of revokedHashes) {
      this.revokedHashes.add(hash.toLowerCase());
    }

    this.logger.log(
      `[mock] Estado rehidratado: ${batches.length} batches y ${revokedHashes.length} revocaciones`,
    );
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
