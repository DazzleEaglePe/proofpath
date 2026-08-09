/**
 * ABIs minimas de los contratos. Solo lo que el backend consume.
 *
 * Escritas a mano y no importadas desde `packages/contracts/out`: son pocas
 * funciones, y con `as const` viem infiere los tipos de argumentos y retorno, lo
 * que atrapa en compilacion los errores de aridad y de tipo.
 *
 * Si cambian las firmas en Solidity, hay que actualizarlas aqui.
 */

export const TALENT_PASS_ABI = [
  {
    type: 'function',
    name: 'mint',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'cid', type: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'tokenIdOf',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'TalentPassMinted',
    inputs: [
      { name: 'holder', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'cid', type: 'string', indexed: false },
    ],
  },
] as const;

export const ATTESTATION_REGISTRY_ABI = [
  {
    type: 'function',
    name: 'issueBatch',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'root', type: 'bytes32' },
      { name: 'size', type: 'uint32' },
      { name: 'schemaId', type: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'revoke',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'credentialHash', type: 'bytes32' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'verifyProof',
    stateMutability: 'view',
    inputs: [
      { name: 'batchId', type: 'uint256' },
      { name: 'credentialHash', type: 'bytes32' },
      { name: 'subjectTokenId', type: 'uint256' },
      { name: 'proof', type: 'bytes32[]' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'revoked',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'batches',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'issuer', type: 'address' },
      { name: 'merkleRoot', type: 'bytes32' },
      { name: 'issuedAt', type: 'uint64' },
      { name: 'size', type: 'uint32' },
      { name: 'schemaId', type: 'string' },
    ],
  },
  {
    type: 'event',
    name: 'BatchIssued',
    inputs: [
      { name: 'batchId', type: 'uint256', indexed: true },
      { name: 'issuer', type: 'address', indexed: true },
      { name: 'merkleRoot', type: 'bytes32', indexed: false },
      { name: 'size', type: 'uint32', indexed: false },
      { name: 'schemaId', type: 'string', indexed: false },
    ],
  },
] as const;
