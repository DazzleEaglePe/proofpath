/**
 * Lectura de certificados por regex. Ver 00-CONTEXT §2.2.
 *
 * NIVEL DE CONFIANZA: CERO. Esto NO verifica nada. Lee texto que alguien nos
 * dio y PROPONE campos para que un emisor autorizado los confirme o corrija.
 * Un PDF se edita en dos minutos; leerlo bien no lo vuelve cierto.
 *
 * Su valor real es de tipeo: que la persona no transcriba a mano seis campos
 * de su certificado, y que la organizacion revise en vez de escribir. Nada mas
 * — y llamarlo de otro modo seria mentir sobre lo que probamos.
 *
 * Deliberadamente sin dependencias ni red: corre igual con OpenAI caido, que es
 * el escenario para el que ya esta preparado el resto del backend.
 */

/** Qué tan lejos llegó la verificación de una evidencia. Ver §2.2. */
export type VerificationLevel =
  | 'SIGNED' // firma verificable: Open Badges 3.0 / W3C VC / DKIM
  | 'ISSUER_CHECKED' // la URL o API del emisor lo confirmó
  | 'SELF_REPORTED'; // lo subió la persona. No prueba nada.

export interface CertificateFields {
  holderName: string | null;
  issuerName: string | null;
  title: string | null;
  /** ISO `YYYY-MM-DD`. Null si no se encontró una fecha inequívoca. */
  issuedOn: string | null;
  hours: number | null;
  verificationCode: string | null;
  verificationUrl: string | null;
}

export interface CertificateReading extends CertificateFields {
  /** Siempre SELF_REPORTED: leer no es verificar. */
  verificationLevel: VerificationLevel;
  /** Campos que sí se encontraron, para que la UI marque qué falta revisar. */
  foundFields: (keyof CertificateFields)[];
}

const MESES: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9, // grafía común en Perú
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

function iso(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}`;
}

/**
 * Fechas en los tres formatos que aparecen de verdad en certificados
 * hispanohablantes. El orden importa: se prueba primero el formato inequívoco.
 */
export function extractDate(text: string): string | null {
  // 2026-08-12 — sin ambigüedad posible.
  const isoMatch = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(text);
  if (isoMatch) {
    return iso(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  // "12 de agosto de 2026" / "12 de agosto del 2026"
  const largo = /\b(\d{1,2})\s+de\s+([a-záéíóú]+)\s+de[l]?\s+(\d{4})\b/i.exec(text);
  if (largo) {
    const mes = MESES[largo[2].toLocaleLowerCase('es')];
    if (mes) return iso(Number(largo[3]), mes, Number(largo[1]));
  }

  // 12/08/2026 — se asume DÍA/MES/AÑO, que es la convención en Perú.
  // Es una suposición, y por eso el humano confirma: un 03/04/2026 es
  // irrecuperablemente ambiguo y no hay regex que lo arregle.
  const barras = /\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/.exec(text);
  if (barras) {
    return iso(Number(barras[3]), Number(barras[2]), Number(barras[1]));
  }

  return null;
}

/** Horas de duración. Ignora "24 horas al día" y otras frases hechas. */
export function extractHours(text: string): number | null {
  const patrones = [
    /\b(?:duraci[oó]n|carga\s+horaria|total)\s*(?:de|:)?\s*(\d{1,4})\s*(?:horas?|hrs?\.?|h)\b/i,
    /\b(\d{1,4})\s*(?:horas?|hrs?\.?)\s*(?:acad[eé]micas|cronol[oó]gicas|lectivas|de\s+duraci[oó]n)\b/i,
    /\b(\d{1,4})\s*(?:horas?|hours?|hrs?\.?)\b/i,
  ];

  for (const patron of patrones) {
    const match = patron.exec(text);
    if (!match) continue;
    const horas = Number(match[1]);
    // Una jornada de 0 horas o de más de 2000 no es una duración: es ruido.
    if (horas > 0 && horas <= 2000) return horas;
  }
  return null;
}

/**
 * Código de verificación. Solo se acepta si viene ANUNCIADO por una etiqueta
 * ("código de verificación:", "credential id:"). Buscar cadenas alfanuméricas
 * sueltas devolvía basura: números de DNI, códigos de barras y fragmentos de
 * URL entraban como si fueran códigos.
 */
export function extractVerificationCode(text: string): string | null {
  const match =
    /\b(?:c[oó]digo\s+de\s+verificaci[oó]n|c[oó]digo|credential\s+id|certificate\s+id|verification\s+code|id)\s*[:#]\s*([A-Z0-9][A-Z0-9-]{5,})\b/i.exec(
      text,
    );
  return match ? match[1].toUpperCase() : null;
}

export function extractVerificationUrl(text: string): string | null {
  const urls = text.match(/https?:\/\/[^\s<>"')]+/gi);
  if (!urls) return null;

  // Se prefiere una URL que hable de verificar; si no hay, la primera sirve
  // como pista para que el revisor la abra.
  const verificadora = urls.find((url) =>
    /verif|certificate|credential|badge|statement/i.test(url),
  );
  return (verificadora ?? urls[0]).replace(/[.,;]+$/, '');
}

/** Valor que sigue a una etiqueta, en la misma línea. */
function afterLabel(text: string, labels: string[]): string | null {
  for (const label of labels) {
    const patron = new RegExp(`^\\s*(?:${label})\\s*[:\\-]\\s*(.+)$`, 'im');
    const match = patron.exec(text);
    if (match) {
      const valor = match[1].trim().replace(/[.,;]+$/, '');
      if (valor.length > 1 && valor.length <= 120) return valor;
    }
  }
  return null;
}

export function extractHolderName(text: string): string | null {
  const etiquetado = afterLabel(text, [
    'otorgado\\s+a',
    'se\\s+otorga\\s+a',
    'participante',
    'nombre',
    'awarded\\s+to',
    'presented\\s+to',
    'this\\s+is\\s+to\\s+certify\\s+that',
  ]);
  if (etiquetado) return etiquetado;

  // "certifica que Valeria Quispe Mamani ha completado..."
  const enFrase =
    /\bque\s+((?:[A-ZÁÉÍÓÚÑ][\wáéíóúñ]+\s+){1,4}[A-ZÁÉÍÓÚÑ][\wáéíóúñ]+)\s+(?:ha|complet|particip|aprob|asisti)/.exec(
      text,
    );
  return enFrase ? enFrase[1].trim() : null;
}

export function extractIssuerName(text: string): string | null {
  return afterLabel(text, [
    'emitido\\s+por',
    'otorgado\\s+por',
    'organizaci[oó]n',
    'instituci[oó]n',
    'issued\\s+by',
    'issuer',
  ]);
}

export function extractTitle(text: string): string | null {
  const etiquetado = afterLabel(text, [
    'curso',
    'programa',
    'taller',
    'certificaci[oó]n',
    'course',
    'program',
    'has\\s+successfully\\s+completed',
  ]);
  if (etiquetado) return etiquetado;

  // "ha completado el curso «Análisis de datos con Python»"
  const entreComillas = /[«"“']([^»"”']{6,120})[»"”']/.exec(text);
  return entreComillas ? entreComillas[1].trim() : null;
}

/**
 * Lee un certificado ya convertido a texto plano.
 *
 * Devuelve SIEMPRE `SELF_REPORTED`. Subir el nivel exige comprobar la firma o
 * consultar al emisor, y eso no ocurre aquí — si algún día esta función
 * devuelve otra cosa, es un bug con consecuencias.
 */
export function readCertificate(rawText: string): CertificateReading {
  const text = rawText.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ');

  const fields: CertificateFields = {
    holderName: extractHolderName(text),
    issuerName: extractIssuerName(text),
    title: extractTitle(text),
    issuedOn: extractDate(text),
    hours: extractHours(text),
    verificationCode: extractVerificationCode(text),
    verificationUrl: extractVerificationUrl(text),
  };

  const foundFields = (Object.keys(fields) as (keyof CertificateFields)[]).filter(
    (key) => fields[key] !== null,
  );

  return { ...fields, verificationLevel: 'SELF_REPORTED', foundFields };
}
