import { ServiceUnavailableException } from '@nestjs/common';
import { AuthEmailService } from './auth-email.service';

describe('AuthEmailService', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      RESEND_API_KEY: 're_test_key',
      AUTH_EMAIL_FROM: 'ProofPath <acceso@proofpath.ecabot.site>',
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(''),
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('envía la verificación con identidad ProofPath y texto alternativo', async () => {
    const service = new AuthEmailService();

    await service.sendCode(
      'talento@example.com',
      '057404',
      'EMAIL_VERIFICATION',
    );

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [, options] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(String(options.body)) as Record<string, string>;

    expect(body.subject).toBe('Verifica tu cuenta de ProofPath');
    expect(body.from).toBe('ProofPath <acceso@proofpath.ecabot.site>');
    expect(body.text).toContain('Código: 057404');
    expect(body.html).toContain('Tu experiencia está a un paso de contar.');
    expect(body.html).toContain('ACTIVA TU TALENTPASS');
    expect(body.html).toContain('aria-label="Código 057404"');
    expect(body.html).toContain('#b8ff3d');
  });

  it('diferencia el mensaje de recuperación', async () => {
    const service = new AuthEmailService();

    await service.sendCode(
      'talento@example.com',
      '923180',
      'PASSWORD_RESET',
    );

    const [, options] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(String(options.body)) as Record<string, string>;

    expect(body.subject).toBe('Recupera tu cuenta de ProofPath');
    expect(body.text).toContain('Código: 923180');
    expect(body.html).toContain('Vuelve a tu TalentPass.');
    expect(body.html).toContain('RECUPERA TU ACCESO');
  });

  it('falla de forma segura si producción no tiene proveedor', async () => {
    delete process.env.RESEND_API_KEY;
    const service = new AuthEmailService();

    await expect(
      service.sendCode(
        'talento@example.com',
        '123456',
        'EMAIL_VERIFICATION',
      ),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
