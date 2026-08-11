import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  createHmac,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import { hashPassword, verifyPassword } from '../auth/password';
import { TalentRepository } from '../repositories/talent.repository';
import { AuthEmailService } from './auth-email.service';
import type { TalentRegisterDto } from './dto/talent-auth.dto';
import {
  OnboardingService,
  type OnboardingResponse,
} from './onboarding.service';

type AuthPurpose = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';

export interface AuthChallengeResponse {
  challengeId: string | null;
  expiresAt: string | null;
  message: string;
  developmentCode?: string;
}

export interface AuthMessageResponse {
  message: string;
}

export type TalentSessionResponse = OnboardingResponse;

@Injectable()
export class TalentAuthService {
  private readonly challengeTtlMs = 10 * 60 * 1000;
  private readonly resendCooldownMs = 60 * 1000;
  private readonly maxAttempts = 5;
  private readonly dummyPasswordHash = hashPassword(
    'ProofPath-dummy-password-never-used',
  );
  private readonly codeSecret =
    process.env.AUTH_CODE_SECRET ?? process.env.JWT_SECRET ?? '';

  constructor(
    private readonly talents: TalentRepository,
    private readonly onboarding: OnboardingService,
    private readonly emails: AuthEmailService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: TalentRegisterDto): Promise<AuthChallengeResponse> {
    const givenNames = this.cleanName(dto.givenNames);
    const familyNames = this.cleanName(dto.familyNames);
    const email = this.cleanEmail(dto.email);
    if (givenNames.length < 2 || familyNames.length < 2) {
      throw new BadRequestException({
        error: 'InvalidName',
        message: 'Ingresa tus nombres y apellidos',
      });
    }
    const existing = await this.talents.findByEmail(email);

    if (existing?.emailVerifiedAt) {
      throw new ConflictException({
        error: 'EmailAlreadyRegistered',
        message:
          'Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña.',
      });
    }

    const passwordHash = hashPassword(dto.password);
    const profile = existing
      ? await this.talents.updatePendingRegistration(existing.id, {
          givenNames,
          familyNames,
          passwordHash,
        })
      : await this.talents.createPendingRegistration({
          givenNames,
          familyNames,
          email,
          passwordHash,
        });

    return this.issueChallenge(profile.id, profile.email, 'EMAIL_VERIFICATION');
  }

  async verifyEmail(
    challengeId: string,
    code: string,
  ): Promise<TalentSessionResponse> {
    const challenge = await this.validateChallenge(
      challengeId,
      code,
      'EMAIL_VERIFICATION',
    );
    await this.talents.markEmailVerified(challenge.talentProfileId);
    return this.onboarding.activateVerifiedProfile(challenge.talentProfileId);
  }

  async login(
    emailRaw: string,
    password: string,
  ): Promise<TalentSessionResponse> {
    const profile = await this.talents.findByEmail(this.cleanEmail(emailRaw));
    const storedHash = profile?.passwordHash ?? this.dummyPasswordHash;
    const validPassword = verifyPassword(password, storedHash);

    if (
      !profile ||
      !profile.emailVerifiedAt ||
      !profile.passwordHash ||
      !validPassword
    ) {
      throw new UnauthorizedException({
        error: 'InvalidCredentials',
        message: 'Correo o contraseña incorrectos',
      });
    }

    if (!profile.walletAddress) {
      return this.onboarding.activateVerifiedProfile(profile.id);
    }

    return {
      token: await this.jwt.signAsync({ sub: profile.id, aud: 'talent' }),
      profile: {
        id: profile.id,
        fullName: profile.fullName,
        givenNames: profile.givenNames,
        familyNames: profile.familyNames,
        tokenId: profile.tokenId?.toString() ?? null,
        walletAddress: profile.walletAddress,
        profileCid: profile.profileCid,
      },
    };
  }

  async forgotPassword(emailRaw: string): Promise<AuthChallengeResponse> {
    const profile = await this.talents.findByEmail(this.cleanEmail(emailRaw));
    const generic: AuthChallengeResponse = {
      challengeId: randomUUID(),
      expiresAt: new Date(Date.now() + this.challengeTtlMs).toISOString(),
      message:
        'Si el correo está registrado, recibirás un código para recuperar tu cuenta.',
    };

    if (!profile?.emailVerifiedAt) return generic;

    const challenge = await this.issueChallenge(
      profile.id,
      profile.email,
      'PASSWORD_RESET',
    );
    return { ...challenge, message: generic.message };
  }

  async resetPassword(
    challengeId: string,
    code: string,
    newPassword: string,
  ): Promise<AuthMessageResponse> {
    const challenge = await this.validateChallenge(
      challengeId,
      code,
      'PASSWORD_RESET',
    );
    await this.talents.updatePassword(
      challenge.talentProfileId,
      hashPassword(newPassword),
    );
    return { message: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
  }

  private async issueChallenge(
    talentProfileId: string,
    email: string,
    purpose: AuthPurpose,
  ): Promise<AuthChallengeResponse> {
    const latest = await this.talents.latestAuthChallenge(
      talentProfileId,
      purpose,
    );
    if (
      latest &&
      Date.now() - latest.createdAt.getTime() < this.resendCooldownMs
    ) {
      throw new HttpException(
        {
          error: 'CodeRateLimited',
          message: 'Espera un minuto antes de solicitar otro código.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.talents.invalidateAuthChallenges(talentProfileId, purpose);

    const id = randomUUID();
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const expiresAt = new Date(Date.now() + this.challengeTtlMs);
    await this.talents.createAuthChallenge({
      id,
      talentProfileId,
      purpose,
      codeHash: this.hashCode(id, code),
      expiresAt,
    });
    try {
      await this.emails.sendCode(email, code, purpose);
    } catch (error) {
      await this.talents.invalidateAuthChallenges(talentProfileId, purpose);
      throw error;
    }

    return {
      challengeId: id,
      expiresAt: expiresAt.toISOString(),
      message:
        purpose === 'EMAIL_VERIFICATION'
          ? 'Te enviamos un código para verificar tu correo.'
          : 'Si el correo está registrado, recibirás un código para recuperar tu cuenta.',
      ...(this.emails.exposesDevelopmentCode ? { developmentCode: code } : {}),
    };
  }

  private async validateChallenge(
    challengeId: string,
    code: string,
    purpose: AuthPurpose,
  ) {
    const challenge = await this.talents.findAuthChallenge(challengeId);
    const invalid =
      !challenge ||
      challenge.purpose !== purpose ||
      challenge.consumedAt !== null ||
      challenge.expiresAt.getTime() <= Date.now() ||
      challenge.attempts >= this.maxAttempts;

    if (invalid || !challenge) throw this.invalidCode();

    const expected = Buffer.from(challenge.codeHash, 'hex');
    const received = Buffer.from(this.hashCode(challenge.id, code), 'hex');
    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      await this.talents.recordFailedAuthAttempt(challenge.id);
      throw this.invalidCode();
    }

    const consumed = await this.talents.consumeAuthChallenge(challenge.id);
    if (consumed.count !== 1) throw this.invalidCode();
    return challenge;
  }

  private hashCode(challengeId: string, code: string): string {
    return createHmac('sha256', this.codeSecret)
      .update(`${challengeId}:${code}`)
      .digest('hex');
  }

  private invalidCode(): BadRequestException {
    return new BadRequestException({
      error: 'InvalidOrExpiredCode',
      message: 'El código es inválido o ya venció. Solicita uno nuevo.',
    });
  }

  private cleanName(value: string): string {
    return value.trim().split(/\s+/).join(' ');
  }

  private cleanEmail(value: string): string {
    return value.trim().toLowerCase();
  }
}
