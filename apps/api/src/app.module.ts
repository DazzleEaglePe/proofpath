import path from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { ChainModule } from './chain/chain.module';
import { IssuanceModule } from './issuance/issuance.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { PrismaModule } from './prisma/prisma.module';
import { RepositoriesModule } from './repositories/repositories.module';
import { SkillsModule } from './skills/skills.module';
import { VerificationModule } from './verification/verification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Un solo .env en la raiz del monorepo, compartido con Prisma y Foundry.
      envFilePath: path.resolve(__dirname, '..', '..', '..', '.env'),
    }),
    PrismaModule,
    ChainModule,
    RepositoriesModule,
    SkillsModule,
    OnboardingModule,
    IssuanceModule,
    VerificationModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
