import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class IssueBatchDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'Hay que indicar al menos una experiencia' })
  // El pitch habla de 200 voluntarios en una sola tx; 500 deja margen sin abrir
  // la puerta a un payload que haga timeout en vivo.
  @ArrayMaxSize(500, { message: 'Un batch no puede superar las 500 credenciales' })
  @IsString({ each: true })
  experienceIds!: string[];
}
