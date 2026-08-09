import { concatHex, keccak256, numberToHex, type Hex } from 'viem';

/**
 * Construccion del Merkle — 01-CONTRACTS-SPEC.md §3.
 *
 * Espejo exacto de `AttestationRegistry.leafOf` y de `MerkleProof.verify` de
 * OpenZeppelin. Cualquier divergencia con el contrato hace que TODO verifique en
 * `false` sin lanzar ningun error. Por eso merkle.test.ts fija los valores contra
 * constantes calculadas con `cast keccak`.
 */

/**
 * leaf = keccak256(keccak256(abi.encodePacked(credentialHash, subjectTokenId)))
 *
 * El doble hash es deliberado: `abi.encodePacked(bytes32, uint256)` produce 64
 * bytes, el mismo tamaño que el preimage de un nodo interno. Con un solo hash un
 * nodo interno podria hacerse pasar por hoja (segunda preimagen).
 *
 * `subjectTokenId` se codifica como uint256 de 32 bytes. Pasarlo como string es
 * el error que rompe la verificacion en silencio.
 */
export function leafOf(credentialHash: Hex, subjectTokenId: bigint): Hex {
  const packed = concatHex([
    credentialHash.toLowerCase() as Hex,
    numberToHex(subjectTokenId, { size: 32 }),
  ]);
  return keccak256(keccak256(packed));
}

/**
 * Ordenamiento de pares por valor (`a < b ? hash(a,b) : hash(b,a)`), igual que
 * OZ `MerkleProof` y que `merkletreejs` con `sortPairs: true`. Asi el proof no
 * necesita cargar flags de posicion.
 */
function hashPair(a: Hex, b: Hex): Hex {
  return a < b ? keccak256(concatHex([a, b])) : keccak256(concatHex([b, a]));
}

export interface MerkleTree {
  /** El root que se publica on-chain con `issueBatch`. */
  root: Hex;
  /** Las hojas en el orden en que se pasaron. */
  leaves: Hex[];
  /** Proof de la hoja en esa posicion, listo para mandar como calldata. */
  proofFor(index: number): Hex[];
}

export function buildMerkleTree(leaves: Hex[]): MerkleTree {
  if (leaves.length === 0) {
    throw new Error('No se puede construir un Merkle tree de un batch vacio');
  }

  const normalized = leaves.map((l) => l.toLowerCase() as Hex);
  const layers: Hex[][] = [normalized];

  while (layers[layers.length - 1].length > 1) {
    const prev = layers[layers.length - 1];
    const next: Hex[] = [];
    for (let i = 0; i < prev.length; i += 2) {
      // Nodo impar sin pareja: sube tal cual al siguiente nivel.
      next.push(i + 1 === prev.length ? prev[i] : hashPair(prev[i], prev[i + 1]));
    }
    layers.push(next);
  }

  return {
    root: layers[layers.length - 1][0],
    leaves: normalized,
    proofFor(index: number): Hex[] {
      if (!Number.isInteger(index) || index < 0 || index >= normalized.length) {
        throw new Error(`Indice de hoja fuera de rango: ${index}`);
      }
      const proof: Hex[] = [];
      let i = index;
      for (let level = 0; level < layers.length - 1; level++) {
        const nodes = layers[level];
        const sibling = i % 2 === 0 ? i + 1 : i - 1;
        if (sibling < nodes.length) proof.push(nodes[sibling]);
        i = Math.floor(i / 2);
      }
      return proof;
    },
  };
}

/**
 * Verifica un proof igual que lo hace el contrato. Sirve para chequear en el
 * backend, antes de emitir, que cada proof generado realmente valida contra el
 * root que se va a publicar. Si algo esta mal, es mucho mejor descubrirlo aqui
 * que en vivo durante la demo.
 */
export function verifyProof(proof: Hex[], root: Hex, leaf: Hex): boolean {
  let computed = leaf.toLowerCase() as Hex;
  for (const node of proof) {
    computed = hashPair(computed, node.toLowerCase() as Hex);
  }
  return computed === (root.toLowerCase() as Hex);
}
