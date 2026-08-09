import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

// El .env vive en la raiz del monorepo, no en apps/api. Prisma 7 ya no lo carga
// solo, asi que hay que apuntarlo a mano.
loadEnv({ path: path.resolve(__dirname, '..', '..', '.env') });

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  migrations: {
    path: path.join(__dirname, 'prisma', 'migrations'),
  },
  datasource: {
    url: process.env.DATABASE_URL as string,
  },
});
