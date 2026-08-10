import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

/**
 * Global para que los guards de cualquier modulo puedan inyectar `JwtService`
 * sin volver a registrar el modulo en cada uno.
 */
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => {
        if (!process.env.JWT_SECRET) {
          throw new Error('Falta JWT_SECRET en el .env. Generalo con: openssl rand -hex 32');
        }
        return {
          secret: process.env.JWT_SECRET,
          // Sin refresh en el MVP: una semana cubre el hackathon de sobra.
          signOptions: { expiresIn: '7d' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}
