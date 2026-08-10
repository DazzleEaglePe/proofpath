import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ManualSkillDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name!: string;

  // Solo HARD o HUMAN. Nunca "SOFT": son competencias humanas (00-CONTEXT §8).
  @IsIn(['HARD', 'HUMAN'])
  type!: 'HARD' | 'HUMAN';
}

export class UpdateSkillsDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  confirm?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  discard?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ManualSkillDto)
  add?: ManualSkillDto[];
}
