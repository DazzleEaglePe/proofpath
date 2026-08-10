import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import {
  VerificationService,
  type PublicProfileResponse,
  type VerificationResponse,
} from './verification.service';

/** Superficie publica: sin auth, sin PII. Es el link que se comparte. */
@Controller('public')
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  /**
   * Devuelve el VC crudo para que el NAVEGADOR recompute el hash por su cuenta.
   *
   * No cambiar esto por un booleano: el bloque 2:00–2:30 de la demo consiste en
   * editar un caracter de esta respuesta en devtools y ver el badge ponerse rojo.
   * Si la verificacion la resolviera solo el backend, manipular la respuesta no
   * cambiaria nada y el momento mas importante del pitch no ocurre.
   */
  @Get('credentials/:credentialHash/verification')
  verify(@Param('credentialHash') credentialHash: string): Promise<VerificationResponse> {
    if (!/^0x[0-9a-fA-F]{64}$/.test(credentialHash)) {
      throw new BadRequestException({
        error: 'InvalidCredentialHash',
        message: 'El credentialHash debe ser 0x seguido de 64 caracteres hexadecimales',
      });
    }
    return this.verification.verify(credentialHash);
  }

  @Get('talent/:tokenId')
  profile(@Param('tokenId') tokenId: string): Promise<PublicProfileResponse> {
    if (!/^\d+$/.test(tokenId)) {
      throw new BadRequestException({
        error: 'InvalidTokenId',
        message: 'El tokenId debe ser un entero',
      });
    }
    return this.verification.publicProfile(BigInt(tokenId));
  }
}
