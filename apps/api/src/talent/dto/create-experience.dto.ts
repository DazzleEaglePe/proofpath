import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

const TIPOS_EVIDENCIA = ['REPOSITORY', 'DEPLOYED_DEMO', 'DOCUMENT', 'IMAGE', 'LINK'] as const;

export class EvidenceDto {
  @IsIn(TIPOS_EVIDENCIA)
  type!: (typeof TIPOS_EVIDENCIA)[number];

  @IsUrl({ require_protocol: true }, { message: 'La evidencia debe ser una URL completa' })
  url!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  label!: string;
}

export class CreateExperienceDto {
  @IsString()
  programId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  role!: string;

  // Es el insumo de la IA: demasiado corto y no hay nada que extraer.
  @IsString()
  @MinLength(20, { message: 'Contá con un poco más de detalle qué hiciste' })
  @MaxLength(5000)
  contributions!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  hoursCommitted?: number;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => EvidenceDto)
  evidences!: EvidenceDto[];
}
