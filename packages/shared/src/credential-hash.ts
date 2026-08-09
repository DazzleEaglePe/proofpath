import { keccak256, toHex } from 'viem';
import { canonicalize } from './canonicalize';

/**
 * credentialHash = keccak256(utf8Bytes(canonicalJSON(vc))) — 02-DATA-MODEL.md §5.
 *
 * Es el ancla on-chain de la credencial. Se recomputa en el navegador durante la
 * demo del "hash roto" (03-DEMO-SCRIPT.md §1, bloque 2:00-2:30): si alguien edita
 * un caracter del VC servido, este hash deja de coincidir con la cadena.
 *
 * Devuelve siempre 0x + 64 hex en minusculas, para que comparar con `===` sea seguro.
 */
export function credentialHash(vc: unknown): `0x${string}` {
  const canonical = canonicalize(vc);
  const bytes = new TextEncoder().encode(canonical);
  return keccak256(toHex(bytes)).toLowerCase() as `0x${string}`;
}
