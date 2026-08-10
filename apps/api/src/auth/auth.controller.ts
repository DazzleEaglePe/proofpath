import { Body, Controller, Post } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService, type OrgLoginResponse } from './auth.service';

export class OrgLoginDto {
  @IsEmail({}, { message: 'Correo invalido' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('org/login')
  orgLogin(@Body() dto: OrgLoginDto): Promise<OrgLoginResponse> {
    return this.auth.orgLogin(dto.email, dto.password);
  }
}
