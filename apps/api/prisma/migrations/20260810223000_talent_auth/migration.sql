-- Datos de identidad estructurados y autenticacion de estudiantes.
CREATE TYPE "TalentAuthPurpose" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

ALTER TABLE "TalentProfile"
  ADD COLUMN "givenNames" TEXT,
  ADD COLUMN "familyNames" TEXT,
  ADD COLUMN "passwordHash" TEXT,
  ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

-- Los perfiles existentes ya demostraron acceso durante el onboarding legacy.
UPDATE "TalentProfile" SET "emailVerifiedAt" = CURRENT_TIMESTAMP;

CREATE TABLE "TalentAuthChallenge" (
  "id" TEXT NOT NULL,
  "talentProfileId" TEXT NOT NULL,
  "purpose" "TalentAuthPurpose" NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TalentAuthChallenge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TalentAuthChallenge_talentProfileId_purpose_createdAt_idx"
  ON "TalentAuthChallenge"("talentProfileId", "purpose", "createdAt");
CREATE INDEX "TalentAuthChallenge_expiresAt_idx" ON "TalentAuthChallenge"("expiresAt");

ALTER TABLE "TalentAuthChallenge"
  ADD CONSTRAINT "TalentAuthChallenge_talentProfileId_fkey"
  FOREIGN KEY ("talentProfileId") REFERENCES "TalentProfile"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
