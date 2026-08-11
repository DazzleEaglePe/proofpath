import { Injectable } from '@nestjs/common';
import type { EducationStatus, OpportunityModality } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TalentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.talentProfile.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  findById(id: string) {
    return this.prisma.talentProfile.findUnique({ where: { id } });
  }

  create(data: {
    fullName: string;
    email: string;
    walletAddress: string;
    encryptedPrivateKey: string;
  }) {
    return this.prisma.talentProfile.create({
      data: {
        fullName: data.fullName,
        email: data.email.toLowerCase(),
        emailVerifiedAt: new Date(),
        walletAddress: data.walletAddress.toLowerCase(),
        encryptedPrivateKey: data.encryptedPrivateKey,
      },
    });
  }

  createPendingRegistration(data: {
    givenNames: string;
    familyNames: string;
    email: string;
    passwordHash: string;
  }) {
    return this.prisma.talentProfile.create({
      data: {
        givenNames: data.givenNames,
        familyNames: data.familyNames,
        fullName: `${data.givenNames} ${data.familyNames}`,
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
      },
    });
  }

  updatePendingRegistration(
    id: string,
    data: { givenNames: string; familyNames: string; passwordHash: string },
  ) {
    return this.prisma.talentProfile.update({
      where: { id },
      data: {
        givenNames: data.givenNames,
        familyNames: data.familyNames,
        fullName: `${data.givenNames} ${data.familyNames}`,
        passwordHash: data.passwordHash,
      },
    });
  }

  markEmailVerified(id: string) {
    return this.prisma.talentProfile.update({
      where: { id },
      data: { emailVerifiedAt: new Date() },
    });
  }

  updatePassword(id: string, passwordHash: string) {
    return this.prisma.talentProfile.update({
      where: { id },
      data: { passwordHash, emailVerifiedAt: new Date() },
    });
  }

  updateDiscoveryProfile(
    id: string,
    data: {
      headline?: string | null;
      educationStatus?: EducationStatus;
      fieldOfStudy?: string | null;
      institutionName?: string | null;
      academicCycle?: number;
      city?: string | null;
      weeklyAvailabilityHours?: number;
      preferredModalities?: OpportunityModality[];
      causeInterests?: string[];
      roleInterests?: string[];
    },
  ) {
    return this.prisma.talentProfile.update({ where: { id }, data });
  }

  setWallet(id: string, walletAddress: string, encryptedPrivateKey: string) {
    return this.prisma.talentProfile.update({
      where: { id },
      data: {
        walletAddress: walletAddress.toLowerCase(),
        encryptedPrivateKey,
      },
    });
  }

  latestAuthChallenge(
    talentProfileId: string,
    purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET',
  ) {
    return this.prisma.talentAuthChallenge.findFirst({
      where: { talentProfileId, purpose, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  invalidateAuthChallenges(
    talentProfileId: string,
    purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET',
  ) {
    return this.prisma.talentAuthChallenge.updateMany({
      where: { talentProfileId, purpose, consumedAt: null },
      data: { consumedAt: new Date() },
    });
  }

  createAuthChallenge(data: {
    id: string;
    talentProfileId: string;
    purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
    codeHash: string;
    expiresAt: Date;
  }) {
    return this.prisma.talentAuthChallenge.create({ data });
  }

  findAuthChallenge(id: string) {
    return this.prisma.talentAuthChallenge.findUnique({
      where: { id },
      include: { talentProfile: true },
    });
  }

  recordFailedAuthAttempt(id: string) {
    return this.prisma.talentAuthChallenge.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  }

  consumeAuthChallenge(id: string) {
    return this.prisma.talentAuthChallenge.updateMany({
      where: { id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
  }

  setTokenId(id: string, tokenId: bigint) {
    return this.prisma.talentProfile.update({
      where: { id },
      data: { tokenId },
    });
  }

  /** Perfil propio con sus credenciales emitidas, para GET /me/talentpass. */
  findWithIssuedCredentials(id: string) {
    return this.prisma.talentProfile.findUnique({
      where: { id },
      include: {
        credentials: {
          where: { status: 'ISSUED' },
          include: {
            experience: {
              include: {
                program: true,
                skillClaims: {
                  where: { confirmed: true },
                  orderBy: { name: 'asc' },
                },
              },
            },
          },
        },
      },
    });
  }
}
