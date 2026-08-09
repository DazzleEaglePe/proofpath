import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Prisma devuelve `BigInt` para los uint256 (`tokenId`, `onChainBatchId`) y
 * `JSON.stringify` no sabe serializarlo: lanza TypeError en tiempo de respuesta.
 *
 * La convencion de 06-API-SPEC.md §1 es mandarlos como string, asi que se define
 * una sola vez aqui para toda la API. Hacerlo por endpoint garantiza olvidarse en
 * alguno, y el error aparece recien cuando ese endpoint devuelve un perfil con
 * TalentPass acuñado — o sea, en la demo.
 */
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function (this: bigint) {
  return this.toString();
};

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // El front corre en otro puerto durante todo el desarrollo.
  app.enableCors({ origin: true, credentials: true });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`ProofPath API escuchando en http://localhost:${port}`);
}

void bootstrap();
