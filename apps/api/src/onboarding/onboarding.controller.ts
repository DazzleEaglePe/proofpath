import { Body, Controller, Param, Post } from '@nestjs/common';
import { OnboardingDto } from './dto/onboarding.dto';
import { OnboardingService, type OnboardingResponse } from './onboarding.service';

@Controller()
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Post('auth/onboarding')
  onboard(@Body() dto: OnboardingDto): Promise<OnboardingResponse> {
    return this.onboarding.onboard(dto.fullName, dto.email);
  }

  /**
   * Export de la llave privada.
   *
   * PENDIENTE Y BLOQUEANTE: hoy toma el id por la ruta y no verifica quien
   * llama. Antes de exponer esta API fuera de localhost hay que sacar el id del
   * JWT y borrar el parametro, o cualquiera se lleva la llave de cualquiera.
   */
  @Post('me/wallet/export/:profileId')
  export(@Param('profileId') profileId: string) {
    return this.onboarding.exportPrivateKey(profileId);
  }
}
