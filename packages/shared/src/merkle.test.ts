import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { keccak256, toHex, type Hex } from 'viem';
import { buildMerkleTree, leafOf, verifyProof } from './merkle';

/**
 * Cruce contrato <-> backend.
 *
 * Las constantes de este archivo NO se generaron con este codigo: salieron de
 * `AttestationRegistry.leafOf` ejecutandose dentro de la EVM, via
 * `forge test --match-test test_ExportarFixtures -vv`.
 *
 * Si alguien toca `leafOf` en cualquiera de los dos lados, este test se cae. Sin
 * el, la divergencia se manifestaria como "todo verifica en false" sin ningun
 * error visible, en vivo, durante la demo.
 */

const CRED = [0, 1, 2, 3].map((i) => keccak256(toHex(`credencial-${i}`)));
const TOKEN_IDS = [1n, 2n, 3n, 4n];

const LEAVES_ESPERADAS: Hex[] = [
  '0xcd03dab8748b80c87df45d98a898d953489af4772b32f9056a36c01b40f76480',
  '0x397a6aef30d57267f59c10c429d19bafc4988d485683e3dd5232a7fb503e5da8',
  '0x170aedbfd233385ec491867f1d44206e4e4897df7bc0cde9151a2c5ef690cd3c',
  '0x82e84cfddb87b0523c270c0e792159a94a18338fc8182c3dc0b341cc0a33dc80',
];

const ROOT_ESPERADO: Hex = '0x33dc04dfa7f2690347fc99bf26b5876276550457d06d4fc1a4e0b6c033ca7a32';

const PROOF_HOJA_0_ESPERADO: Hex[] = [
  '0x397a6aef30d57267f59c10c429d19bafc4988d485683e3dd5232a7fb503e5da8',
  '0x0d2fe56c892d722b60bd81bca012cbcc506bb8fe8b32be8aa1ece3ef91ac8bc4',
];

test('leafOf reproduce exactamente las hojas que calcula el contrato', () => {
  for (let i = 0; i < 4; i++) {
    assert.equal(leafOf(CRED[i], TOKEN_IDS[i]), LEAVES_ESPERADAS[i], `hoja ${i}`);
  }
});

test('el root del arbol coincide con el que construye el contrato en sus tests', () => {
  assert.equal(buildMerkleTree(LEAVES_ESPERADAS).root, ROOT_ESPERADO);
});

test('el proof de la hoja 0 es el mismo que espera el contrato', () => {
  assert.deepEqual(buildMerkleTree(LEAVES_ESPERADAS).proofFor(0), PROOF_HOJA_0_ESPERADO);
});

test('todo proof generado valida contra su propio root', () => {
  const tree = buildMerkleTree(LEAVES_ESPERADAS);
  for (let i = 0; i < LEAVES_ESPERADAS.length; i++) {
    assert.ok(
      verifyProof(tree.proofFor(i), tree.root, LEAVES_ESPERADAS[i]),
      `la hoja ${i} deberia validar`,
    );
  }
});

test('el tokenId equivocado produce otra hoja y no valida', () => {
  const tree = buildMerkleTree(LEAVES_ESPERADAS);
  const hojaFalsa = leafOf(CRED[0], 999n);
  assert.notEqual(hojaFalsa, LEAVES_ESPERADAS[0]);
  assert.equal(verifyProof(tree.proofFor(0), tree.root, hojaFalsa), false);
});

test('subjectTokenId se codifica como uint256 de 32 bytes, no como texto', () => {
  // Si alguien concatenara "42" en ASCII en vez de 32 bytes, la hoja cambiaria.
  // Este test fija que 42n produce la hoja del entero, no la del string.
  const conEntero = leafOf(CRED[0], 42n);
  const conCeroALaIzquierda = leafOf(CRED[0], BigInt('0x2a'));
  assert.equal(conEntero, conCeroALaIzquierda, '42 y 0x2a son el mismo uint256');
});

test('un batch de una sola credencial da root = hoja y proof vacio', () => {
  const tree = buildMerkleTree([LEAVES_ESPERADAS[0]]);
  assert.equal(tree.root, LEAVES_ESPERADAS[0]);
  assert.deepEqual(tree.proofFor(0), []);
  assert.ok(verifyProof([], tree.root, LEAVES_ESPERADAS[0]));
});

test('un arbol de tamaño impar promueve el nodo suelto y sigue validando', () => {
  const tree = buildMerkleTree(LEAVES_ESPERADAS.slice(0, 3));
  for (let i = 0; i < 3; i++) {
    assert.ok(verifyProof(tree.proofFor(i), tree.root, LEAVES_ESPERADAS[i]), `hoja ${i}`);
  }
});

test('un batch grande sigue validando hoja por hoja', () => {
  // 200 voluntarios en una sola tx es el numero que se dice en el pitch.
  const muchas = Array.from({ length: 200 }, (_, i) => leafOf(keccak256(toHex(`c-${i}`)), BigInt(i + 1)));
  const tree = buildMerkleTree(muchas);
  for (const i of [0, 1, 99, 198, 199]) {
    assert.ok(verifyProof(tree.proofFor(i), tree.root, muchas[i]), `hoja ${i} de 200`);
  }
});

test('el batch vacio se rechaza', () => {
  assert.throws(() => buildMerkleTree([]), /vacio/);
});
