-- CreateEnum
CREATE TYPE "ExperienceStatus" AS ENUM ('DRAFT', 'AI_ANALYZED', 'ORG_CONFIRMED', 'ISSUED');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('REPOSITORY', 'DEPLOYED_DEMO', 'DOCUMENT', 'IMAGE', 'LINK');

-- CreateEnum
CREATE TYPE "SkillType" AS ENUM ('HARD', 'HUMAN');

-- CreateEnum
CREATE TYPE "SkillSource" AS ENUM ('AI_SUGGESTED', 'ORG_ADDED');

-- CreateEnum
CREATE TYPE "CredentialStatus" AS ENUM ('PENDING', 'ISSUED', 'REVOKED');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "walletAddress" TEXT NOT NULL,
    "isTrusted" BOOLEAN NOT NULL DEFAULT false,
    "contactEmail" TEXT NOT NULL,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentProfile" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "headline" TEXT,
    "walletAddress" TEXT,
    "tokenId" BIGINT,
    "profileCid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "encryptedPrivateKey" TEXT,

    CONSTRAINT "TalentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experience" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "talentProfileId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "contributions" TEXT NOT NULL,
    "hoursCommitted" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "ExperienceStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "type" "EvidenceType" NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillClaim" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SkillType" NOT NULL,
    "source" "SkillSource" NOT NULL,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "onChainBatchId" BIGINT,
    "merkleRoot" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "schemaId" TEXT NOT NULL DEFAULT 'proofpath.experience.v1',
    "txHash" TEXT,
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "talentProfileId" TEXT NOT NULL,
    "batchId" TEXT,
    "vcJson" JSONB NOT NULL,
    "vcCid" TEXT,
    "credentialHash" TEXT NOT NULL,
    "merkleProof" TEXT[],
    "subjectTokenId" BIGINT NOT NULL,
    "status" "CredentialStatus" NOT NULL DEFAULT 'PENDING',
    "issuedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_walletAddress_key" ON "Organization"("walletAddress");

-- CreateIndex
CREATE INDEX "Organization_walletAddress_idx" ON "Organization"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "TalentProfile_email_key" ON "TalentProfile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TalentProfile_walletAddress_key" ON "TalentProfile"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "TalentProfile_tokenId_key" ON "TalentProfile"("tokenId");

-- CreateIndex
CREATE INDEX "TalentProfile_tokenId_idx" ON "TalentProfile"("tokenId");

-- CreateIndex
CREATE INDEX "Program_organizationId_idx" ON "Program"("organizationId");

-- CreateIndex
CREATE INDEX "Experience_programId_idx" ON "Experience"("programId");

-- CreateIndex
CREATE INDEX "Experience_talentProfileId_idx" ON "Experience"("talentProfileId");

-- CreateIndex
CREATE INDEX "Evidence_experienceId_idx" ON "Evidence"("experienceId");

-- CreateIndex
CREATE INDEX "SkillClaim_experienceId_idx" ON "SkillClaim"("experienceId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillClaim_experienceId_name_key" ON "SkillClaim"("experienceId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_onChainBatchId_key" ON "Batch"("onChainBatchId");

-- CreateIndex
CREATE INDEX "Batch_organizationId_idx" ON "Batch"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_experienceId_key" ON "Credential"("experienceId");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_credentialHash_key" ON "Credential"("credentialHash");

-- CreateIndex
CREATE INDEX "Credential_credentialHash_idx" ON "Credential"("credentialHash");

-- CreateIndex
CREATE INDEX "Credential_talentProfileId_idx" ON "Credential"("talentProfileId");

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_talentProfileId_fkey" FOREIGN KEY ("talentProfileId") REFERENCES "TalentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillClaim" ADD CONSTRAINT "SkillClaim_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_talentProfileId_fkey" FOREIGN KEY ("talentProfileId") REFERENCES "TalentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
