import { Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, type JwtPayload } from '../auth/jwt.guard';
import { OnboardingService } from './onboarding.service';

@Controller()
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  /**
   * Export de la llave privada del propio perfil.
   *
   * El id sale del token firmado, nunca de la URL: no existe forma de pedir la
   * llave de otra persona porque no hay parametro que manipular.
   */
  @Post('me/wallet/export')
  @UseGuards(JwtAuthGuard('talent'))
  export(@CurrentUser() user: JwtPayload) {
    return this.onboarding.exportPrivateKey(user.sub);
  }
}
