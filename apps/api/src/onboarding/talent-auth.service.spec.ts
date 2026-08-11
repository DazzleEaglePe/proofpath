/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await, @typescript-eslint/unbound-method -- Los dobles de Prisma/Jest conservan firmas generadas que no usan this ni await. */
import { UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { hashPassword } from '../auth/password';
import type { TalentRepository } from '../repositories/talent.repository';
import type { AuthEmailService } from './auth-email.service';
import type {
  OnboardingService,
  OnboardingResponse,
} from './onboarding.service';
import { TalentAuthService } from './talent-auth.service';

describe('TalentAuthService', () => {
  const profile = {
    id: 'talent_1',
    givenNames: 'Ana María',
    familyNames: 'Torres Vega',
    fullName: 'Ana María Torres Vega',
    email: 'ana@example.com',
    passwordHash: hashPassword('una-clave-segura'),
    emailVerifiedAt: null,
    walletAddress: null,
    encryptedPrivateKey: null,
    tokenId: null,
    profileCid: null,
    headline: null,
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const session: OnboardingResponse = {
    token: 'talent.jwt',
    profile: {
      id: profile.id,
      fullName: profile.fullName,
      givenNames: profile.givenNames,
      familyNames: profile.familyNames,
      tokenId: null,
      walletAddress: '0x123',
      profileCid: null,
    },
  };

  function escenario() {
    let challenge: Record<string, unknown> | null = null;
    const talents = {
      findByEmail: jest.fn(),
      createPendingRegistration: jest.fn(async (data) => ({
        ...profile,
        ...data,
      })),
      updatePendingRegistration: jest.fn(),
      latestAuthChallenge: jest.fn(async () => null),
      invalidateAuthChallenges: jest.fn(async () => ({ count: 0 })),
      createAuthChallenge: jest.fn(async (data) => {
        challenge = {
          ...data,
          attempts: 0,
          consumedAt: null,
          createdAt: new Date(),
        };
        return challenge;
      }),
      findAuthChallenge: jest.fn(async () => challenge),
      recordFailedAuthAttempt: jest.fn(),
      consumeAuthChallenge: jest.fn(async () => ({ count: 1 })),
      markEmailVerified: jest.fn(),
      updatePassword: jest.fn(),
    } as unknown as TalentRepository;
    const onboarding = {
      activateVerifiedProfile: jest.fn(async () => session),
    } as unknown as OnboardingService;
    const emails = {
      exposesDevelopmentCode: true,
      sendCode: jest.fn(),
    } as unknown as AuthEmailService;
    const jwt = {
      signAsync: jest.fn(async () => 'talent.jwt'),
    } as unknown as JwtService;

    return {
      service: new TalentAuthService(talents, onboarding, emails, jwt),
      talents,
      onboarding,
      emails,
    };
  }

  it('registra nombres estructurados y emite un código, sin guardar el código en claro', async () => {
    const { service, talents, emails } = escenario();
    jest.mocked(talents.findByEmail).mockResolvedValue(null);

    const result = await service.register({
      givenNames: '  Ana   María ',
      familyNames: ' Torres   Vega ',
      email: ' ANA@EXAMPLE.COM ',
      password: 'una-clave-segura',
    });

    expect(talents.createPendingRegistration).toHaveBeenCalledWith(
      expect.objectContaining({
        givenNames: 'Ana María',
        familyNames: 'Torres Vega',
        email: 'ana@example.com',
      }),
    );
    expect(result.developmentCode).toMatch(/^\d{6}$/);
    expect(emails.sendCode).toHaveBeenCalledWith(
      'ana@example.com',
      result.developmentCode,
      'EMAIL_VERIFICATION',
    );
    expect(talents.createAuthChallenge).toHaveBeenCalledWith(
      expect.objectContaining({
        codeHash: expect.not.stringContaining(result.developmentCode!),
      }),
    );
  });

  it('verifica el código una sola vez y activa el TalentPass', async () => {
    const { service, talents, onboarding } = escenario();
    jest.mocked(talents.findByEmail).mockResolvedValue(null);
    const registration = await service.register({
      givenNames: 'Ana María',
      familyNames: 'Torres Vega',
      email: profile.email,
      password: 'una-clave-segura',
    });

    const result = await service.verifyEmail(
      registration.challengeId!,
      registration.developmentCode!,
    );

    expect(talents.consumeAuthChallenge).toHaveBeenCalledWith(
      registration.challengeId,
    );
    expect(talents.markEmailVerified).toHaveBeenCalledWith(profile.id);
    expect(onboarding.activateVerifiedProfile).toHaveBeenCalledWith(profile.id);
    expect(result).toEqual(session);
  });

  it('permite iniciar sesión con contraseña a un talento verificado', async () => {
    const { service, talents } = escenario();
    jest.mocked(talents.findByEmail).mockResolvedValue({
      ...profile,
      emailVerifiedAt: new Date(),
    });

    const result = await service.login(profile.email, 'una-clave-segura');

    expect(result.token).toBe('talent.jwt');
    expect(result.profile.givenNames).toBe('Ana María');
  });

  it('rechaza una contraseña incorrecta y no revela si el correo existe al recuperar', async () => {
    const { service, talents, emails } = escenario();
    jest
      .mocked(talents.findByEmail)
      .mockResolvedValueOnce({ ...profile, emailVerifiedAt: new Date() })
      .mockResolvedValueOnce(null);

    await expect(
      service.login(profile.email, 'incorrecta'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    const recovery = await service.forgotPassword('nadie@example.com');

    expect(recovery.challengeId).toMatch(/^[0-9a-f-]{36}$/);
    expect(recovery.message).toContain('Si el correo está registrado');
    expect(emails.sendCode).not.toHaveBeenCalled();
  });
});
