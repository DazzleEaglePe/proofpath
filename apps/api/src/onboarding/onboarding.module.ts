import { Module } from '@nestjs/common';
import { WalletCrypto } from '../wallet/wallet-crypto';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

// JwtService llega desde AuthModule, que es @Global.
@Module({
  controllers: [OnboardingController],
  providers: [OnboardingService, { provide: WalletCrypto, useFactory: () => new WalletCrypto() }],
  exports: [OnboardingService],
})
export class OnboardingModule {}
