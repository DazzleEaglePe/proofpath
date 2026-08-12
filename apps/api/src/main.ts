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
  app.getHttpAdapter().getInstance().disable('x-powered-by');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const developmentOrigins = ['http://localhost:3000'];
  const configuredOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = configuredOrigins.length > 0
    ? configuredOrigins
    : process.env.NODE_ENV === 'production'
      ? []
      : developmentOrigins;

  if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
    throw new Error('CORS_ORIGINS es obligatorio en producción');
  }

  // El JWT viaja en Authorization, no en cookies. Solo los orígenes declarados
  // pueden llamar la API desde un navegador; clientes nativos no envían Origin.
  app.enableCors({ origin: allowedOrigins, credentials: false });

  const port = process.env.PORT ?? 3001;
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);
  console.log(`ProofPath API escuchando en http://${host}:${port}`);
}

void bootstrap();
