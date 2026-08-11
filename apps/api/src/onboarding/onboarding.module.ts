import { Module } from '@nestjs/common';
import { WalletCrypto } from '../wallet/wallet-crypto';
import { AuthEmailService } from './auth-email.service';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { TalentAuthController } from './talent-auth.controller';
import { TalentAuthService } from './talent-auth.service';

// JwtService llega desde AuthModule, que es @Global.
@Module({
  controllers: [OnboardingController, TalentAuthController],
  providers: [
    OnboardingService,
    TalentAuthService,
    AuthEmailService,
    { provide: WalletCrypto, useFactory: () => new WalletCrypto() },
  ],
  exports: [OnboardingService],
})
export class OnboardingModule {}
