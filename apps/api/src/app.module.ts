import path from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { ChainModule } from './chain/chain.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Un solo .env en la raiz del monorepo, compartido con Prisma y Foundry.
      envFilePath: path.resolve(__dirname, '..', '..', '..', '.env'),
    }),
    PrismaModule,
    ChainModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
