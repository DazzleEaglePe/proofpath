import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';

const ALGORITMO = 'aes-256-gcm';
const IV_BYTES = 12; // recomendado para GCM
const TAG_BYTES = 16;

/**
 * Cifrado de las llaves privadas del talento.
 *
 * La custodia es nuestra en el MVP, asi que la llave nunca se guarda en claro.
 * Formato almacenado: `iv:tag:ciphertext`, todo en hex.
 *
 * Se usa GCM y no CBC porque GCM autentica: si alguien altera un byte del
 * ciphertext en la base, el descifrado falla en vez de devolver basura que
 * despues intentariamos usar como llave.
 */
@Injectable()
export class WalletCrypto {
  private readonly key: Buffer;

  constructor(hexKey: string | undefined = process.env.WALLET_ENCRYPTION_KEY) {
    if (!hexKey) {
      throw new Error('Falta WALLET_ENCRYPTION_KEY. Generala con: openssl rand -hex 32');
    }
    const key = Buffer.from(hexKey, 'hex');
    if (key.length !== 32) {
      throw new Error(
        `WALLET_ENCRYPTION_KEY debe ser de 32 bytes en hex (64 caracteres); tiene ${key.length}`,
      );
    }
    this.key = key;
  }

  encrypt(plaintext: string): string {
    // IV nuevo en cada cifrado: reutilizarlo en GCM rompe la seguridad del modo.
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITMO, this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${tag.toString('hex')}:${ciphertext.toString('hex')}`;
  }

  decrypt(stored: string): string {
    const partes = stored.split(':');
    if (partes.length !== 3) {
      throw new Error('Formato invalido: se esperaba iv:tag:ciphertext');
    }

    const [ivHex, tagHex, dataHex] = partes;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    if (iv.length !== IV_BYTES) throw new Error('IV con longitud invalida');
    if (tag.length !== TAG_BYTES) throw new Error('Tag de autenticacion con longitud invalida');

    const decipher = createDecipheriv(ALGORITMO, this.key, iv);
    decipher.setAuthTag(tag);

    // Si el ciphertext fue alterado, final() lanza. Es lo que queremos.
    return Buffer.concat([
      decipher.update(Buffer.from(dataHex, 'hex')),
      decipher.final(),
    ]).toString('utf8');
  }
}
