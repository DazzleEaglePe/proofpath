import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const EDUCATION_STATUSES = [
  'STUDENT',
  'GRADUATE',
  'PROFESSIONAL',
  'OTHER',
] as const;

export const OPPORTUNITY_MODALITIES = ['REMOTE', 'HYBRID', 'ONSITE'] as const;

export type EducationStatusInput = (typeof EDUCATION_STATUSES)[number];
export type OpportunityModalityInput = (typeof OPPORTUNITY_MODALITIES)[number];

export class UpdateDiscoveryProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  headline?: string;

  @IsOptional()
  @IsIn(EDUCATION_STATUSES)
  educationStatus?: EducationStatusInput;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  fieldOfStudy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  institutionName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  academicCycle?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  weeklyAvailabilityHours?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsIn(OPPORTUNITY_MODALITIES, { each: true })
  preferredModalities?: OpportunityModalityInput[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  causeInterests?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  roleInterests?: string[];
}
