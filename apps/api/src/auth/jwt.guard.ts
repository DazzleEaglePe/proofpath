import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  mixin,
  type Type,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export type Audience = 'talent' | 'org';

export interface JwtPayload {
  /** id del TalentProfile o de la Organization, segun la audiencia. */
  sub: string;
  aud: Audience;
}

export interface RequestConUsuario extends Request {
  user?: JwtPayload;
}

/**
 * Guard parametrizado por audiencia.
 *
 * Un token de talento no debe poder emitir credenciales, y un token de
 * organizacion no debe poder exportar la llave privada de nadie. Separar las
 * audiencias en el propio token hace que ese error sea imposible de cometer
 * olvidandose de una comprobacion en un controller.
 */
export function JwtAuthGuard(audiencia: Audience): Type<CanActivate> {
  @Injectable()
  class Guard implements CanActivate {
    constructor(readonly jwt: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const req = context.switchToHttp().getRequest<RequestConUsuario>();
      const header = req.headers.authorization;

      if (!header?.startsWith('Bearer ')) {
        throw new UnauthorizedException({
          error: 'MissingToken',
          message: 'Falta el header Authorization: Bearer <token>',
        });
      }

      let payload: JwtPayload;
      try {
        payload = await this.jwt.verifyAsync<JwtPayload>(header.slice(7));
      } catch {
        throw new UnauthorizedException({
          error: 'InvalidToken',
          message: 'El token es invalido o expiro',
        });
      }

      if (payload.aud !== audiencia) {
        throw new UnauthorizedException({
          error: 'WrongAudience',
          message: `Este endpoint requiere un token de tipo "${audiencia}"`,
        });
      }

      req.user = payload;
      return true;
    }
  }

  return mixin(Guard);
}
