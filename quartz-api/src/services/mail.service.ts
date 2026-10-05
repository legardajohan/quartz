import nodemailer, { Transporter } from 'nodemailer';

interface MailConfig {
  transporter: Transporter;
  from: string;
}

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

let config: MailConfig | null = null;

// Lectura perezosa de `process.env` (mismo motivo que `r2.service.ts`): `dotenv.config()`
// corre después de resolver los `import` de `app.ts`.
function getConfig(): MailConfig {
  if (config) {
    return config;
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_FROM) {
    throw new Error(
      'Faltan variables de entorno para el correo (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM)'
    );
  }

  config = {
    transporter: nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: SMTP_SECURE === 'true',
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    }),
    from: MAIL_FROM,
  };

  return config;
}

export async function sendMail(message: MailMessage): Promise<void> {
  const { transporter, from } = getConfig();
  await transporter.sendMail({ from, ...message });
}
