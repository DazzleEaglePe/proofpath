import type { Address, Hex } from 'viem';

/**
 * Puerto hacia la cadena — 00-CONTEXT.md §7.
 *
 * Tiene dos implementaciones: `ArbitrumAdapter` contra Arbitrum Sepolia y
 * `MockChainAdapter` en memoria. Esto NO es abstraccion por gusto: es el plan B
 * de la demo. Si el RPC se cae o la sala tiene mala red, se cambia una variable
 * de entorno y el flujo completo sigue funcionando delante del jurado.
 *
 * Ver la tabla de degradacion en 03-DEMO-SCRIPT.md §2.
 */
export const CHAIN_ADAPTER = Symbol('CHAIN_ADAPTER');

export interface MintPassResult {
  tokenId: bigint;
  txHash: Hex;
}

export interface IssueBatchResult {
  onChainBatchId: bigint;
  txHash: Hex;
}

export interface BatchInfo {
  issuer: Address;
  merkleRoot: Hex;
  issuedAt: Date;
  size: number;
  schemaId: string;
}

export interface ChainAdapter {
  /** Identifica la implementacion activa. Se expone en /health para saber en que modo esta la demo. */
  readonly name: 'arbitrum' | 'mock';

  mintTalentPass(to: Address, cid: string): Promise<MintPassResult>;

  /** Registra el batch completo en una sola transaccion. */
  issueBatch(merkleRoot: Hex, size: number, schemaId: string): Promise<IssueBatchResult>;

  revoke(credentialHash: Hex): Promise<Hex>;

  /** Devuelve false, nunca lanza, si el proof no cuadra o la credencial esta revocada. */
  verifyProof(
    onChainBatchId: bigint,
    credentialHash: Hex,
    subjectTokenId: bigint,
    proof: Hex[],
  ): Promise<boolean>;

  getBatch(onChainBatchId: bigint): Promise<BatchInfo | null>;

  isRevoked(credentialHash: Hex): Promise<boolean>;

  /** Direccion del relayer, que es el minter y el issuer. */
  relayerAddress(): Address;
}
