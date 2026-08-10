import { Global, Logger, Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ArbitrumAdapter } from './arbitrum.adapter';
import { CHAIN_ADAPTER, type ChainAdapter } from './chain-adapter';
import { MockChainAdapter } from './mock-chain.adapter';

/**
 * Elige la implementacion segun `CHAIN_ADAPTER` del .env.
 *
 * Cambiar de ARBITRUM a MOCK y reiniciar es toda la maniobra de degradacion si el
 * RPC falla en vivo. Esa es la razon de ser del puerto: que la decision sea una
 * variable de entorno y no una refactorizacion a las 3 de la mañana.
 */
@Global()
@Module({
  providers: [
    {
      provide: CHAIN_ADAPTER,
      inject: [PrismaService],
      useFactory: async (prisma: PrismaService): Promise<ChainAdapter> => {
        const modo = (process.env.CHAIN_ADAPTER ?? 'MOCK').toUpperCase();

        if (modo === 'ARBITRUM') {
          return new ArbitrumAdapter();
        }

        if (modo !== 'MOCK') {
          new Logger('ChainModule').warn(`CHAIN_ADAPTER="${modo}" no se reconoce. Usando MOCK.`);
        }

        const mock = new MockChainAdapter();

        // El mock vive en memoria y la base no: hay que continuar los contadores
        // donde quedaron o el proximo mint choca con un tokenId ya usado.
        const [maxToken, maxBatch] = await Promise.all([
          prisma.talentProfile.aggregate({ _max: { tokenId: true } }),
          prisma.batch.aggregate({ _max: { onChainBatchId: true } }),
        ]);

        mock.primeCounters(
          (maxToken._max.tokenId ?? 0n) + 1n,
          (maxBatch._max.onChainBatchId ?? 0n) + 1n,
        );

        return mock;
      },
    },
  ],
  exports: [CHAIN_ADAPTER],
})
export class ChainModule {}
