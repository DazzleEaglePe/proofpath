import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { canonicalize } from './canonicalize';
import { credentialHash } from './credential-hash';

/**
 * Test de oro — exigido por 02-DATA-MODEL.md §5.
 *
 * Fija el hash del VC de ejemplo como constante. Si alguien toca la
 * canonicalizacion, este test se cae ANTES de que la divergencia llegue a la
 * cadena y produzca verificaciones en `false` sin error visible.
 *
 * El valor esperado NO se genero con este mismo codigo: se calculo con
 * `cast keccak` de Foundry sobre los bytes UTF-8 del JSON canonico, que es una
 * implementacion independiente. Eso es lo que le da valor a la constante.
 */

const VC = JSON.parse(
  readFileSync(join(__dirname, '..', 'src', 'fixtures', 'vc-example.json'), 'utf8'),
);

const EXPECTED_CANONICAL =
  '{"@context":["https://www.w3.org/ns/credentials/v2"],"credentialSubject":{"evidence":[{"type":"REPOSITORY","url":"https://github.com/..."},{"type":"DEPLOYED_DEMO","url":"https://..."}],"experience":{"contributions":"Dashboard, sistema de autenticación, integración API","endDate":"2026-07-01","hoursCommitted":320,"program":"Plataforma de mentorías juveniles","role":"Full Stack Developer","startDate":"2026-03-01"},"id":"did:pkh:eip155:421614:0xTALENT...","skills":{"hard":["React","TypeScript","REST APIs"],"human":["Colaboración","Comunicación","Autonomía"]},"tokenId":"42"},"issuanceDate":"2026-08-09T14:00:00Z","issuer":{"id":"did:pkh:eip155:421614:0xORG...","name":"Organización X"},"schemaId":"proofpath.experience.v1","type":["VerifiableCredential","ExperienceCredential"]}';

const EXPECTED_HASH = '0xc8827c3b4d969a2d0409b5d2b7a0bed193a08339b46867f37025b020cd74e764';

test('el JSON canonico del VC de ejemplo es byte a byte el esperado', () => {
  assert.equal(canonicalize(VC), EXPECTED_CANONICAL);
});

test('los acentos se serializan como UTF-8, no escapados', () => {
  const canonical = canonicalize(VC);
  assert.ok(canonical.includes('Colaboración'), 'debe contener el acento literal');
  assert.ok(!canonical.includes('\\u00f3'), 'no debe escapar a \\uXXXX');
  assert.equal(new TextEncoder().encode(canonical).length, 788);
});

test('credentialHash coincide con el valor calculado por cast keccak', () => {
  assert.equal(credentialHash(VC), EXPECTED_HASH);
});

test('el orden de las claves de entrada no altera el hash', () => {
  const reordered = {
    schemaId: VC.schemaId,
    type: VC.type,
    issuanceDate: VC.issuanceDate,
    credentialSubject: {
      skills: VC.credentialSubject.skills,
      tokenId: VC.credentialSubject.tokenId,
      id: VC.credentialSubject.id,
      evidence: VC.credentialSubject.evidence,
      experience: VC.credentialSubject.experience,
    },
    issuer: VC.issuer,
    '@context': VC['@context'],
  };
  assert.equal(credentialHash(reordered), EXPECTED_HASH);
});

test('el orden de los arrays SI altera el hash: es informacion, no presentacion', () => {
  const swapped = structuredClone(VC);
  swapped.credentialSubject.skills.hard = ['TypeScript', 'React', 'REST APIs'];
  assert.notEqual(credentialHash(swapped), EXPECTED_HASH);
});

test('cambiar un solo caracter del rol rompe el hash — es la premisa de la demo', () => {
  // 03-DEMO-SCRIPT.md §1, bloque 2:00-2:30: se edita un caracter en devtools
  // y el badge pasa de verde a rojo. Si este test falla, la demo no funciona.
  const tampered = structuredClone(VC);
  tampered.credentialSubject.experience.role = 'Full Stack Developeer';
  assert.notEqual(credentialHash(tampered), EXPECTED_HASH);
});

test('canonicalize maneja null, primitivos y anidamiento vacio', () => {
  assert.equal(canonicalize(null), 'null');
  assert.equal(canonicalize(42), '42');
  assert.equal(canonicalize('hola'), '"hola"');
  assert.equal(canonicalize({}), '{}');
  assert.equal(canonicalize([]), '[]');
  assert.equal(canonicalize({ b: 1, a: { d: 2, c: 3 } }), '{"a":{"c":3,"d":2},"b":1}');
});
