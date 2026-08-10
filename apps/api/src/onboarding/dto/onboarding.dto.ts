import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

/** Dos campos. Nada mas. Ver 04-IOS-APP.md §2.1. */
export class OnboardingDto {
  @IsString()
  @MinLength(2, { message: 'El nombre es demasiado corto' })
  @MaxLength(120)
  fullName!: string;

  @IsEmail({}, { message: 'Correo invalido' })
  email!: string;
}
