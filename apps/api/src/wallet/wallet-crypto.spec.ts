import { randomBytes } from 'node:crypto';
import { WalletCrypto } from './wallet-crypto';

describe('WalletCrypto', () => {
  const KEY = randomBytes(32).toString('hex');
  const LLAVE_FALSA = `0x${'ab'.repeat(32)}`;

  it('cifra y descifra la misma llave', () => {
    const crypto = new WalletCrypto(KEY);

    const cifrada = crypto.encrypt(LLAVE_FALSA);

    expect(cifrada).not.toContain(LLAVE_FALSA);
    expect(crypto.decrypt(cifrada)).toBe(LLAVE_FALSA);
  });

  it('usa un IV distinto cada vez, asi el mismo texto no da el mismo cifrado', () => {
    const crypto = new WalletCrypto(KEY);

    expect(crypto.encrypt(LLAVE_FALSA)).not.toBe(crypto.encrypt(LLAVE_FALSA));
  });

  it('falla si alguien altera el ciphertext en la base', () => {
    const crypto = new WalletCrypto(KEY);
    const [iv, tag, data] = crypto.encrypt(LLAVE_FALSA).split(':');

    // Se cambia un solo caracter del ciphertext.
    const alterado = data.slice(0, -1) + (data.at(-1) === 'a' ? 'b' : 'a');

    expect(() => crypto.decrypt(`${iv}:${tag}:${alterado}`)).toThrow();
  });

  it('falla con otra clave', () => {
    const cifrada = new WalletCrypto(KEY).encrypt(LLAVE_FALSA);
    const otra = new WalletCrypto(randomBytes(32).toString('hex'));

    expect(() => otra.decrypt(cifrada)).toThrow();
  });

  it('rechaza claves que no sean de 32 bytes', () => {
    expect(() => new WalletCrypto('abcd')).toThrow(/32 bytes/);
    expect(() => new WalletCrypto(undefined)).toThrow(/WALLET_ENCRYPTION_KEY/);
  });

  it('rechaza un formato almacenado invalido', () => {
    const crypto = new WalletCrypto(KEY);

    expect(() => crypto.decrypt('solo-una-parte')).toThrow(/Formato invalido/);
  });
});
