import { Injectable, Logger } from '@nestjs/common';
import {
  createPublicClient,
  createWalletClient,
  decodeEventLog,
  http,
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrumSepolia } from 'viem/chains';
import { ATTESTATION_REGISTRY_ABI, TALENT_PASS_ABI } from './abis';
import type { BatchInfo, ChainAdapter, IssueBatchResult, MintPassResult } from './chain-adapter';

/**
 * Implementacion real contra Arbitrum Sepolia.
 *
 * Todas las escrituras las firma el relayer, que es una wallet unica del backend
 * que paga todo el gas: el talento nunca firma ni ve una wallet. En produccion
 * esto seria un paymaster ERC-4337; para el MVP un relayer es suficiente y
 * honesto de explicar (01-CONTRACTS-SPEC.md §5).
 */
@Injectable()
export class ArbitrumAdapter implements ChainAdapter {
  readonly name = 'arbitrum' as const;

  private readonly logger = new Logger(ArbitrumAdapter.name);
  private readonly publicClient: PublicClient;
  private readonly walletClient: WalletClient;
  private readonly account: ReturnType<typeof privateKeyToAccount>;
  private readonly talentPass: Address;
  private readonly registry: Address;

  constructor() {
    const rpc = requireEnv('ARBITRUM_SEPOLIA_RPC');
    this.talentPass = requireEnv('TALENTPASS_ADDRESS') as Address;
    this.registry = requireEnv('ATTESTATION_REGISTRY_ADDRESS') as Address;
    this.account = privateKeyToAccount(requireEnv('RELAYER_PRIVATE_KEY') as Hex);

    this.publicClient = createPublicClient({
      chain: arbitrumSepolia,
      transport: http(rpc),
    }) as PublicClient;

    this.walletClient = createWalletClient({
      account: this.account,
      chain: arbitrumSepolia,
      transport: http(rpc),
    });

    this.logger.log(`Relayer ${this.account.address} sobre Arbitrum Sepolia`);
  }

  relayerAddress(): Address {
    return this.account.address;
  }

  async mintTalentPass(to: Address, cid: string): Promise<MintPassResult> {
    const { request } = await this.publicClient.simulateContract({
      account: this.account,
      address: this.talentPass,
      abi: TALENT_PASS_ABI,
      functionName: 'mint',
      args: [to, cid],
    });

    const txHash = await this.walletClient.writeContract(request);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });

    const tokenId = this.findEventArg(receipt.logs, TALENT_PASS_ABI, 'TalentPassMinted', 'tokenId');
    if (tokenId === undefined) {
      throw new Error(`No se encontro TalentPassMinted en la tx ${txHash}`);
    }

    return { tokenId: tokenId as bigint, txHash };
  }

  async issueBatch(merkleRoot: Hex, size: number, schemaId: string): Promise<IssueBatchResult> {
    const { request } = await this.publicClient.simulateContract({
      account: this.account,
      address: this.registry,
      abi: ATTESTATION_REGISTRY_ABI,
      functionName: 'issueBatch',
      args: [merkleRoot, size, schemaId],
    });

    const txHash = await this.walletClient.writeContract(request);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });

    const batchId = this.findEventArg(receipt.logs, ATTESTATION_REGISTRY_ABI, 'BatchIssued', 'batchId');
    if (batchId === undefined) {
      throw new Error(`No se encontro BatchIssued en la tx ${txHash}`);
    }

    this.logger.log(`Batch ${batchId} con ${size} credenciales en una sola tx: ${txHash}`);
    return { onChainBatchId: batchId as bigint, txHash };
  }

  async revoke(credentialHash: Hex): Promise<Hex> {
    const { request } = await this.publicClient.simulateContract({
      account: this.account,
      address: this.registry,
      abi: ATTESTATION_REGISTRY_ABI,
      functionName: 'revoke',
      args: [credentialHash],
    });

    const txHash = await this.walletClient.writeContract(request);
    await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    return txHash;
  }

  async verifyProof(
    onChainBatchId: bigint,
    credentialHash: Hex,
    subjectTokenId: bigint,
    proof: Hex[],
  ): Promise<boolean> {
    return this.publicClient.readContract({
      address: this.registry,
      abi: ATTESTATION_REGISTRY_ABI,
      functionName: 'verifyProof',
      args: [onChainBatchId, credentialHash, subjectTokenId, proof],
    });
  }

  async isRevoked(credentialHash: Hex): Promise<boolean> {
    return this.publicClient.readContract({
      address: this.registry,
      abi: ATTESTATION_REGISTRY_ABI,
      functionName: 'revoked',
      args: [credentialHash],
    });
  }

  async getBatch(onChainBatchId: bigint): Promise<BatchInfo | null> {
    const [issuer, merkleRoot, issuedAt, size, schemaId] = await this.publicClient.readContract({
      address: this.registry,
      abi: ATTESTATION_REGISTRY_ABI,
      functionName: 'batches',
      args: [onChainBatchId],
    });

    // El contrato devuelve la struct en cero para un batchId que no existe.
    if (issuer === '0x0000000000000000000000000000000000000000') return null;

    return {
      issuer,
      merkleRoot,
      issuedAt: new Date(Number(issuedAt) * 1000),
      size,
      schemaId,
    };
  }

  /** Busca un log del contrato propio y devuelve un argumento del evento esperado. */
  private findEventArg(
    logs: readonly { data: Hex; topics: readonly Hex[] }[],
    abi: typeof TALENT_PASS_ABI | typeof ATTESTATION_REGISTRY_ABI,
    eventName: string,
    argName: string,
  ): unknown {
    for (const log of logs) {
      try {
        const decoded = decodeEventLog({
          abi,
          data: log.data,
          topics: log.topics as [Hex, ...Hex[]],
        });
        if (decoded.eventName === eventName) {
          return (decoded.args as Record<string, unknown>)[argName];
        }
      } catch {
        // Log de otro contrato o de otro evento: se ignora.
      }
    }
    return undefined;
  }
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Falta ${key} en el .env. Si todavia no desplegaste los contratos, usa CHAIN_ADAPTER=MOCK.`,
    );
  }
  return value;
}
