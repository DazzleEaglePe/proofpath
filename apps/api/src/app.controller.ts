import { Controller, Get, Inject } from '@nestjs/common';
import { CHAIN_ADAPTER, type ChainAdapter } from './chain/chain-adapter';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    @Inject(CHAIN_ADAPTER) private readonly chain: ChainAdapter,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Estado del backend. `chainAdapter` es lo que importa mirar antes de salir a
   * escena: dice si se esta hablando con Arbitrum o corriendo en modo mock.
   */
  @Get('health')
  async health(): Promise<{
    status: 'ok' | 'degraded';
    database: 'ok' | 'down';
    chainAdapter: 'arbitrum' | 'mock';
    relayer: string;
  }> {
    let database: 'ok' | 'down' = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'down';
    }

    return {
      status: database === 'ok' ? 'ok' : 'degraded',
      database,
      chainAdapter: this.chain.name,
      relayer: this.chain.relayerAddress(),
    };
  }
}
