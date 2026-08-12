import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

type AuthEmailPurpose = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';

interface AuthEmailContent {
  subject: string;
  preheader: string;
  eyebrow: string;
  title: string;
  description: string;
  text: string;
  html: string;
}

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
    const content = this.buildEmail(code, purpose);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: content.subject,
        text: content.text,
        html: content.html,
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

  private buildEmail(
    code: string,
    purpose: AuthEmailPurpose,
  ): AuthEmailContent {
    const isVerification = purpose === 'EMAIL_VERIFICATION';
    const subject = isVerification
      ? 'Verifica tu cuenta de ProofPath'
      : 'Recupera tu cuenta de ProofPath';
    const preheader = isVerification
      ? `${code} es tu código para activar tu TalentPass.`
      : `${code} es tu código para recuperar el acceso a tu TalentPass.`;
    const eyebrow = isVerification ? 'ACTIVA TU TALENTPASS' : 'RECUPERA TU ACCESO';
    const title = isVerification
      ? 'Tu experiencia está a un paso de contar.'
      : 'Vuelve a tu TalentPass.';
    const description = isVerification
      ? 'Confirma tu correo para comenzar a reunir experiencias, evidencia y competencias en un solo lugar.'
      : 'Usa este código para crear una nueva contraseña y volver a tu historia profesional.';

    return {
      subject,
      preheader,
      eyebrow,
      title,
      description,
      text: `${subject}\n\n${description}\n\nCódigo: ${code}\n\nCaduca en 10 minutos. Si no solicitaste este código, ignora este mensaje.\n\nProofPath — Tu experiencia sí cuenta.`,
      html: this.emailHtml({
        subject,
        preheader,
        eyebrow,
        title,
        description,
        code,
      }),
    };
  }

  private emailHtml(input: {
    subject: string;
    preheader: string;
    eyebrow: string;
    title: string;
    description: string;
    code: string;
  }): string {
    const digits = input.code
      .split('')
      .map(
        (digit) => `
          <td width="48" height="58" align="center" valign="middle" bgcolor="#171c18"
            style="width:48px;height:58px;border:1px solid #303831;border-radius:12px;color:#f5f7f3;font-family:Arial,Helvetica,sans-serif;font-size:28px;line-height:58px;font-weight:700;">
            ${digit}
          </td>`,
      )
      .join('<td width="6" style="width:6px;font-size:0;line-height:0;">&nbsp;</td>');

    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${input.subject}</title>
</head>
<body bgcolor="#080b09" style="margin:0;padding:0;background:#080b09;color:#f5f7f3;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${input.preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#080b09" style="width:100%;background:#080b09;">
    <tr>
      <td align="center" style="padding:24px 14px 36px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;">
          <tr>
            <td style="padding:8px 8px 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td width="34" height="34" align="center" bgcolor="#b8ff3d" style="width:34px;height:34px;border-radius:11px;color:#0b1205;font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:800;line-height:34px;">×</td>
                  <td style="padding-left:11px;color:#f5f7f3;font-family:Arial,Helvetica,sans-serif;font-size:19px;font-weight:700;letter-spacing:-0.4px;">ProofPath</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td bgcolor="#111512" style="border:1px solid #293029;border-radius:28px;padding:42px 38px;background:#111512;">
              <p style="margin:0 0 18px;color:#b8ff3d;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;font-weight:800;letter-spacing:2px;">${input.eyebrow}</p>
              <h1 style="margin:0;max-width:470px;color:#f5f7f3;font-family:Arial,Helvetica,sans-serif;font-size:38px;line-height:43px;font-weight:700;letter-spacing:-1.5px;">${input.title}</h1>
              <p style="margin:20px 0 0;max-width:475px;color:#a9b1a7;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:25px;">${input.description}</p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:34px;border-top:1px solid #293029;">
                <tr>
                  <td style="padding-top:28px;">
                    <p style="margin:0 0 12px;color:#7f897d;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;font-weight:700;letter-spacing:1.4px;">TU CÓDIGO DE 6 DÍGITOS</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" aria-label="Código ${input.code}">
                      <tr>${digits}</tr>
                    </table>
                    <p style="margin:16px 0 0;color:#a9b1a7;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;">Caduca en <strong style="color:#f5f7f3;">10 minutos</strong>. No compartas este código con nadie.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 8px 0;color:#707970;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:19px;">
              <p style="margin:0 0 8px;">Si no solicitaste este código, puedes ignorar este mensaje de forma segura.</p>
              <p style="margin:0;color:#949d92;">ProofPath · <span style="color:#b8ff3d;">Tu experiencia sí cuenta.</span></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
