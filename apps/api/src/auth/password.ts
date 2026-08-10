import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SALT_BYTES = 16;
const KEY_BYTES = 64;

/**
 * Hashing de contraseñas con scrypt.
 *
 * scrypt viene en `node:crypto`: no hace falta bcrypt ni argon2, que arrastran
 * compilacion nativa. Para el unico login del MVP —el de la organizacion— es
 * suficiente y no agrega superficie de instalacion.
 *
 * Formato almacenado: `salt:hash`, ambos en hex.
 */
export function hashPassword(plain: string): string {
  const salt = randomBytes(SALT_BYTES);
  const derived = scryptSync(plain, salt, KEY_BYTES);
  return `${salt.toString('hex')}:${derived.toString('hex')}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const partes = stored.split(':');
  if (partes.length !== 2) return false;

  const [saltHex, hashHex] = partes;
  const esperado = Buffer.from(hashHex, 'hex');
  if (esperado.length !== KEY_BYTES) return false;

  const derived = scryptSync(plain, Buffer.from(saltHex, 'hex'), KEY_BYTES);

  // Comparacion en tiempo constante: comparar con === filtra informacion sobre
  // cuantos bytes coincidieron.
  return timingSafeEqual(derived, esperado);
}
