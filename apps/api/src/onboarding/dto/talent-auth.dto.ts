import {
  IsEmail,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class TalentRegisterDto {
  @IsString()
  @MinLength(2, { message: 'Ingresa tus nombres' })
  @MaxLength(80)
  givenNames!: string;

  @IsString()
  @MinLength(2, { message: 'Ingresa tus apellidos' })
  @MaxLength(80)
  familyNames!: string;

  @IsEmail({}, { message: 'Correo invalido' })
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(12, { message: 'La contraseña debe tener al menos 12 caracteres' })
  @MaxLength(128)
  password!: string;
}

export class TalentVerifyEmailDto {
  @IsUUID('4')
  @IsString()
  challengeId!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'El código debe tener 6 dígitos' })
  code!: string;
}

export class TalentLoginDto {
  @IsEmail({}, { message: 'Correo invalido' })
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}

export class TalentForgotPasswordDto {
  @IsEmail({}, { message: 'Correo invalido' })
  email!: string;
}

export class TalentResetPasswordDto extends TalentVerifyEmailDto {
  @IsString()
  @MinLength(12, { message: 'La contraseña debe tener al menos 12 caracteres' })
  @MaxLength(128)
  newPassword!: string;
}
