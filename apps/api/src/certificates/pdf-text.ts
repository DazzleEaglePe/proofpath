import { Logger } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';

const logger = new Logger('PdfText');

/**
 * Extrae el texto de un PDF. Ver 00-CONTEXT §2.2.
 *
 * NO VERIFICA NADA. Solo convierte bytes en texto para que el lector proponga
 * campos. Un PDF se edita en dos minutos; leerlo bien no lo vuelve cierto.
 *
 * Devuelve `null` en vez de lanzar cuando el archivo no se puede leer: un PDF
 * corrupto o escaneado es un caso NORMAL —no un error del servidor—, y la UI
 * tiene que poder decir "no pudimos leerlo, escríbelo a mano" en vez de mostrar
 * una pantalla rota.
 */
export async function extractPdfText(data: Buffer): Promise<string | null> {
  try {
    const parser = new PDFParse({ data });
    const result = await parser.getText();
    const texto = (result.text ?? '').trim();

    // Un PDF escaneado devuelve cadena vacia: son pixeles, no texto. Sin OCR no
    // hay nada que leer, y conviene distinguirlo de un fallo de parseo.
    return texto.length > 0 ? texto : null;
  } catch (error) {
    logger.warn(`No se pudo extraer texto del PDF: ${(error as Error).message}`);
    return null;
  }
}
