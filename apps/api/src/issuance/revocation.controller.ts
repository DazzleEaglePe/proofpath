import { BadRequestException, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, type JwtPayload } from '../auth/jwt.guard';
import { RevocationService, type RevokeResponse } from './revocation.service';

@Controller('credentials')
@UseGuards(JwtAuthGuard('org'))
export class RevocationController {
  constructor(private readonly revocation: RevocationService) {}

  /** Marca la credencial como revocada on-chain y off-chain. */
  @Post(':credentialHash/revoke')
  revoke(
    @CurrentUser() user: JwtPayload,
    @Param('credentialHash') credentialHash: string,
  ): Promise<RevokeResponse> {
    if (!/^0x[0-9a-fA-F]{64}$/.test(credentialHash)) {
      throw new BadRequestException({
        error: 'InvalidCredentialHash',
        message: 'El credentialHash debe ser 0x seguido de 64 caracteres hexadecimales',
      });
    }
    return this.revocation.revoke(credentialHash, user.sub);
  }
}
