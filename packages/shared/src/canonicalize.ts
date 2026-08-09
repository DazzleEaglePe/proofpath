/**
 * Canonicalizacion del Verifiable Credential — 02-DATA-MODEL.md §5.
 *
 * REGLA NORMATIVA. Este archivo lo consumen el backend (al emitir) y el frontend
 * (al verificar en el navegador). Si las dos partes canonicalizan distinto, todo
 * verifica en `false` sin lanzar ningun error: el fallo es silencioso.
 *
 * Por eso existe canonicalize.test.ts con un hash fijado como constante.
 * No modificar esta funcion sin actualizar ese test a conciencia.
 */

/**
 * Serializa a JSON con las claves ordenadas alfabeticamente en todos los niveles,
 * sin espacios ni saltos de linea. El orden de los arrays SI se preserva: es
 * informacion, no presentacion.
 */
export function canonicalize(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj) ?? 'null';

  // Un elemento `undefined` dentro de un array se serializa como `null`, igual
  // que hace JSON.stringify.
  if (Array.isArray(obj)) {
    return `[${obj.map((v) => (v === undefined ? 'null' : canonicalize(v))).join(',')}]`;
  }

  // Las claves con valor `undefined` se omiten, igual que JSON.stringify. Sin
  // esto, un campo opcional ausente del VC producia `"clave":undefined`: JSON
  // invalido, y un hash que ningun verificador puede reproducir.
  const record = obj as Record<string, unknown>;
  const keys = Object.keys(record)
    .filter((k) => record[k] !== undefined)
    .sort();

  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(record[k])}`).join(',')}}`;
}
