import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WalletCrypto } from '../wallet/wallet-crypto';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        // Sin refresh en el MVP: una semana cubre el hackathon de sobra.
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService, { provide: WalletCrypto, useFactory: () => new WalletCrypto() }],
  exports: [OnboardingService],
})
export class OnboardingModule {}
