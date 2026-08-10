import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { JwtPayload, RequestConUsuario } from './jwt.guard';

/**
 * Inyecta el sujeto del token ya verificado.
 *
 * Es lo que hace imposible el bug del export de llave: el id sale del token
 * firmado, no de un parametro de la URL que el llamador controla.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const req = ctx.switchToHttp().getRequest<RequestConUsuario>();
    if (!req.user) {
      throw new Error('CurrentUser usado sin JwtAuthGuard en la ruta');
    }
    return req.user;
  },
);
