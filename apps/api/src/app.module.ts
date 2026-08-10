import path from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { ChainModule } from './chain/chain.module';
import { IssuanceModule } from './issuance/issuance.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { OrgModule } from './org/org.module';
import { PrismaModule } from './prisma/prisma.module';
import { RepositoriesModule } from './repositories/repositories.module';
import { SkillsModule } from './skills/skills.module';
import { TalentModule } from './talent/talent.module';
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
    AuthModule,
    SkillsModule,
    OrgModule,
    OnboardingModule,
    TalentModule,
    IssuanceModule,
    VerificationModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
