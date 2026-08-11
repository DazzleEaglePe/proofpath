-- Perfil progresivo del talento y metadatos necesarios para Explorar.
-- Todo permanece off-chain: son preferencias y PII de recomendación.
CREATE TYPE "EducationStatus" AS ENUM (
  'STUDENT',
  'GRADUATE',
  'PROFESSIONAL',
  'OTHER'
);

CREATE TYPE "OpportunityModality" AS ENUM ('REMOTE', 'HYBRID', 'ONSITE');

ALTER TABLE "TalentProfile"
  ADD COLUMN "educationStatus" "EducationStatus",
  ADD COLUMN "fieldOfStudy" TEXT,
  ADD COLUMN "institutionName" TEXT,
  ADD COLUMN "academicCycle" INTEGER,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "weeklyAvailabilityHours" INTEGER,
  ADD COLUMN "preferredModalities" "OpportunityModality"[] NOT NULL DEFAULT ARRAY[]::"OpportunityModality"[],
  ADD COLUMN "causeInterests" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "roleInterests" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "Program"
  ADD COLUMN "cause" TEXT,
  ADD COLUMN "modality" "OpportunityModality" NOT NULL DEFAULT 'HYBRID',
  ADD COLUMN "location" TEXT,
  ADD COLUMN "weeklyHours" INTEGER,
  ADD COLUMN "applicationDeadline" TIMESTAMP(3),
  ADD COLUMN "requiredSkills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  -- Los registros legacy no declararon una convocatoria: no se publican por accidente.
  ADD COLUMN "isAcceptingApplications" BOOLEAN NOT NULL DEFAULT false;

-- A partir de esta migración, todo programa nuevo nace abierto salvo que la ONG indique
-- lo contrario. El seed marca explícitamente el programa histórico como cerrado.
ALTER TABLE "Program"
  ALTER COLUMN "isAcceptingApplications" SET DEFAULT true;
