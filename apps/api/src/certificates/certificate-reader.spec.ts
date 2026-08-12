import {
  extractDate,
  extractHours,
  extractVerificationCode,
  readCertificate,
} from './certificate-reader';

const CERTIFICADO_ES = `
CERTIFICADO DE PARTICIPACIÓN

Fundación Impulso Joven certifica que Valeria Quispe Mamani ha completado
satisfactoriamente el curso «Análisis de datos con Python».

Emitido por: Fundación Impulso Joven
Duración: 40 horas académicas
Fecha: 12 de agosto de 2026
Código de verificación: IJ-2026-8842X

Verifica este certificado en https://impulsojoven.org/verificar/IJ-2026-8842X
`;

describe('readCertificate', () => {
  it('extrae los campos de un certificado en español', () => {
    const lectura = readCertificate(CERTIFICADO_ES);

    expect(lectura.holderName).toBe('Valeria Quispe Mamani');
    expect(lectura.issuerName).toBe('Fundación Impulso Joven');
    expect(lectura.title).toBe('Análisis de datos con Python');
    expect(lectura.issuedOn).toBe('2026-08-12');
    expect(lectura.hours).toBe(40);
    expect(lectura.verificationCode).toBe('IJ-2026-8842X');
    expect(lectura.verificationUrl).toBe(
      'https://impulsojoven.org/verificar/IJ-2026-8842X',
    );
  });

  // Lo mas importante de todo el modulo: leer no es verificar.
  it('siempre marca SELF_REPORTED, por completo que sea el certificado', () => {
    expect(readCertificate(CERTIFICADO_ES).verificationLevel).toBe('SELF_REPORTED');
    expect(readCertificate('texto cualquiera').verificationLevel).toBe('SELF_REPORTED');
  });

  it('un texto sin nada util devuelve todo en null y foundFields vacio', () => {
    const lectura = readCertificate('hola');

    expect(lectura.foundFields).toEqual([]);
    expect(lectura.holderName).toBeNull();
    expect(lectura.hours).toBeNull();
  });

  it('foundFields dice que se encontro, para que la UI marque el resto', () => {
    const lectura = readCertificate('Duración: 20 horas\nFecha: 2026-03-01');

    expect(lectura.foundFields).toContain('hours');
    expect(lectura.foundFields).toContain('issuedOn');
    expect(lectura.foundFields).not.toContain('holderName');
  });
});

describe('extractDate', () => {
  it('lee los tres formatos que aparecen de verdad', () => {
    expect(extractDate('emitido 2026-08-12')).toBe('2026-08-12');
    expect(extractDate('Lima, 5 de setiembre del 2026')).toBe('2026-09-05');
    expect(extractDate('fecha 05/09/2026')).toBe('2026-09-05');
  });

  it('acepta "setiembre", que es como se escribe en Peru', () => {
    expect(extractDate('1 de setiembre de 2026')).toBe('2026-09-01');
  });

  it('descarta fechas imposibles en vez de inventar una', () => {
    expect(extractDate('2026-13-45')).toBeNull();
  });
});

describe('extractHours', () => {
  it('prefiere la duracion anunciada sobre cualquier otro numero', () => {
    expect(extractHours('120 horas de trabajo. Duración: 40 horas')).toBe(40);
  });

  it('lee variantes de escritura', () => {
    expect(extractHours('carga horaria: 90 hrs')).toBe(90);
    expect(extractHours('60 horas cronológicas')).toBe(60);
    expect(extractHours('completed 24 hours')).toBe(24);
  });

  it('descarta valores que no pueden ser una duracion', () => {
    expect(extractHours('disponible 0 horas')).toBeNull();
    expect(extractHours('9999 horas')).toBeNull();
  });
});

describe('extractVerificationCode', () => {
  it('solo acepta codigos anunciados por una etiqueta', () => {
    expect(extractVerificationCode('Código de verificación: ABC-12345')).toBe(
      'ABC-12345',
    );
    expect(extractVerificationCode('Credential ID: XY9981ZZ')).toBe('XY9981ZZ');
  });

  // Sin la etiqueta entraban DNI, codigos de barras y fragmentos de URL.
  it('ignora cadenas alfanumericas sueltas', () => {
    expect(extractVerificationCode('el DNI 71234567 del participante')).toBeNull();
  });
});
