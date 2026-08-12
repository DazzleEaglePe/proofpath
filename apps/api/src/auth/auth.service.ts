import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OrganizationRepository } from '../repositories/organization.repository';
import { verifyPassword } from './password';

export interface OrgLoginResponse {
  token: string;
  organization: { id: string; name: string; isTrusted: boolean; walletAddress: string };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly organizations: OrganizationRepository,
    private readonly jwt: JwtService,
  ) {}

  async orgLogin(email: string, password: string): Promise<OrgLoginResponse> {
    const org = await this.organizations.findByEmail(email);

    // Mismo error para correo inexistente y contraseña incorrecta: distinguirlos
    // le dice a un atacante que correos estan registrados.
    if (
      !org?.passwordHash ||
      !(await verifyPassword(password, org.passwordHash))
    ) {
      throw new UnauthorizedException({
        error: 'InvalidCredentials',
        message: 'Correo o contraseña incorrectos',
      });
    }

    return {
      token: await this.jwt.signAsync({ sub: org.id, aud: 'org' }),
      organization: {
        id: org.id,
        name: org.name,
        isTrusted: org.isTrusted,
        walletAddress: org.walletAddress,
      },
    };
  }
}
