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

        // El mock vive en memoria y la base no. Hay que restaurar DOS cosas:
        // los contadores, o el proximo mint choca con un tokenId ya usado; y el
        // estado emitido, o toda credencial anterior deja de verificar tras un
        // reinicio. Lo segundo es lo que rompia la demo en el entorno desplegado.
        const [maxToken, maxBatch, batches, revocadas] = await Promise.all([
          prisma.talentProfile.aggregate({ _max: { tokenId: true } }),
          prisma.batch.aggregate({ _max: { onChainBatchId: true } }),
          prisma.batch.findMany({
            where: { onChainBatchId: { not: null } },
            select: {
              onChainBatchId: true,
              merkleRoot: true,
              size: true,
              schemaId: true,
              issuedAt: true,
            },
          }),
          prisma.credential.findMany({
            where: { status: 'REVOKED' },
            select: { credentialHash: true },
          }),
        ]);

        mock.primeCounters(
          (maxToken._max.tokenId ?? 0n) + 1n,
          (maxBatch._max.onChainBatchId ?? 0n) + 1n,
        );

        mock.primeState(
          batches.map((batch) => ({
            onChainBatchId: batch.onChainBatchId as bigint,
            merkleRoot: batch.merkleRoot,
            size: batch.size,
            schemaId: batch.schemaId,
            issuedAt: batch.issuedAt,
          })),
          revocadas.map((credential) => credential.credentialHash),
        );

        return mock;
      },
    },
  ],
  exports: [CHAIN_ADAPTER],
})
export class ChainModule {}
