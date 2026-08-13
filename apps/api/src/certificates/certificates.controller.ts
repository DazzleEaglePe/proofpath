import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import {
  proposeFromCertificate,
  type CertificateProposal,
} from './certificate-proposal';
import { extractPdfText } from './pdf-text';

/** Un PDF de certificado no pesa mas que esto. El limite frena el abuso trivial. */
const MAX_PDF_BYTES = 5 * 1024 * 1024;

export interface ProposeCertificateDto {
  /** Texto del certificado, si el cliente ya lo tiene. */
  text?: string;
  /** PDF en base64. Alternativa a `text`. */
  pdfBase64?: string;
  /** Competencias que el usuario escribio a mano. */
  declaredSkills?: string[];
}

/**
 * Lectura y clasificacion de certificados. Ver 00-CONTEXT §2.2.
 *
 * SIN AUTENTICACION Y SIN ESCRITURA, a proposito: este endpoint no guarda nada,
 * no crea experiencias y no emite credenciales. Solo lee un texto y devuelve
 * una PROPUESTA. Cualquiera puede probarlo pegando un certificado, y eso no
 * afecta a la base ni a la cadena.
 *
 * Lo que sale de aqui no vale como evidencia de nada hasta que un emisor
 * autorizado lo confirme y lo firme.
 */
@Controller('public/certificates')
export class CertificatesController {
  @Post('propose')
  async propose(@Body() dto: ProposeCertificateDto): Promise<CertificateProposal> {
    const declaredSkills = dto.declaredSkills ?? [];

    if (dto.pdfBase64) {
      const data = Buffer.from(dto.pdfBase64, 'base64');

      if (data.byteLength === 0) {
        throw new BadRequestException({
          error: 'InvalidPdf',
          message: 'El archivo llegó vacío.',
        });
      }
      if (data.byteLength > MAX_PDF_BYTES) {
        throw new BadRequestException({
          error: 'PdfTooLarge',
          message: 'El PDF supera los 5 MB.',
        });
      }

      const texto = await extractPdfText(data);
      if (texto === null) {
        // Caso normal, no error del servidor: un PDF escaneado son pixeles.
        throw new BadRequestException({
          error: 'PdfWithoutText',
          message:
            'No pudimos leer texto en ese PDF. Si es una foto o un escaneo, copia el contenido y pégalo.',
        });
      }
      return proposeFromCertificate(texto, declaredSkills);
    }

    const text = dto.text?.trim() ?? '';
    if (text.length === 0) {
      throw new BadRequestException({
        error: 'EmptyCertificate',
        message: 'Envía el texto del certificado o un PDF.',
      });
    }

    return proposeFromCertificate(text, declaredSkills);
  }
}
