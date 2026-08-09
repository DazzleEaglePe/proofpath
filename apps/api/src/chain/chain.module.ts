import { Global, Logger, Module } from '@nestjs/common';
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
      useFactory: (): ChainAdapter => {
        const modo = (process.env.CHAIN_ADAPTER ?? 'MOCK').toUpperCase();

        if (modo === 'ARBITRUM') {
          return new ArbitrumAdapter();
        }

        if (modo !== 'MOCK') {
          new Logger('ChainModule').warn(`CHAIN_ADAPTER="${modo}" no se reconoce. Usando MOCK.`);
        }
        return new MockChainAdapter();
      },
    },
  ],
  exports: [CHAIN_ADAPTER],
})
export class ChainModule {}
