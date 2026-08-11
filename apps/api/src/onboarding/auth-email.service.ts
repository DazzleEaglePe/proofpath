import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

type AuthEmailPurpose = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';

@Injectable()
export class AuthEmailService {
  private readonly logger = new Logger(AuthEmailService.name);

  get exposesDevelopmentCode(): boolean {
    return !process.env.RESEND_API_KEY && process.env.NODE_ENV !== 'production';
  }

  async sendCode(
    email: string,
    code: string,
    purpose: AuthEmailPurpose,
  ): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException({
          error: 'EmailProviderUnavailable',
          message: 'El servicio de correo no está configurado',
        });
      }

      this.logger.warn(
        `[DESARROLLO] Código ${code} para ${email} (${purpose})`,
      );
      return;
    }

    const configuredFrom = process.env.AUTH_EMAIL_FROM;
    if (!configuredFrom && process.env.NODE_ENV === 'production') {
      throw new ServiceUnavailableException({
        error: 'EmailSenderUnavailable',
        message: 'El remitente de correo no está configurado',
      });
    }
    const from = configuredFrom ?? 'ProofPath <onboarding@resend.dev>';
    const esVerificacion = purpose === 'EMAIL_VERIFICATION';
    const subject = esVerificacion
      ? 'Verifica tu cuenta de ProofPath'
      : 'Recupera tu cuenta de ProofPath';
    const action = esVerificacion
      ? 'verificar tu correo'
      : 'recuperar tu cuenta';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#111">
            <h1 style="font-size:24px">${subject}</h1>
            <p>Usa este código para ${action}. Caduca en 10 minutos.</p>
            <p style="font-size:34px;font-weight:700;letter-spacing:8px">${code}</p>
            <p style="color:#666">Si no solicitaste este código, puedes ignorar este mensaje.</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      this.logger.error(
        `Resend rechazó el correo (${response.status}): ${await response.text()}`,
      );
      throw new ServiceUnavailableException({
        error: 'EmailDeliveryFailed',
        message: 'No pudimos enviar el código. Inténtalo nuevamente.',
      });
    }
  }
}
