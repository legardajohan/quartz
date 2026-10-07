import { escapeHtml, renderTransactionalEmail } from './email-layout';

export interface PasswordResetEmailInput {
  firstName: string;
  institutionName: string;
  resetUrl: string;
  expiresAt: Date;
}

export interface PasswordResetEmail {
  subject: string;
  html: string;
  text: string;
}

function formatExpirationTime(date: Date): string {
  return date.toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', timeStyle: 'short' });
}

const DISCLAIMER =
  'Este es un mensaje automático, no respondas a este correo. Si no pediste este cambio, ignora este correo; tu contraseña actual sigue funcionando.';

export function buildPasswordResetEmail(input: PasswordResetEmailInput): PasswordResetEmail {
  const firstName = escapeHtml(input.firstName);
  const institutionName = escapeHtml(input.institutionName);
  const resetUrl = escapeHtml(input.resetUrl);
  const expirationTime = formatExpirationTime(input.expiresAt);

  const html = renderTransactionalEmail({
    title: 'Restablece tu contraseña',
    preheader: 'Crea una contraseña nueva para tu cuenta de Quartz.',
    heading: `Hola, ${firstName}`,
    paragraphsHtml: [
      `Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>${institutionName}</strong>.`,
      'Pulsa el botón para crear una contraseña nueva.',
    ],
    ctaLabel: 'Restablecer contraseña',
    ctaUrl: resetUrl,
    footnoteHtml: `El enlace vence en <strong>1 hora</strong> (a las ${expirationTime}) y solo se puede usar una vez.`,
    disclaimer: DISCLAIMER,
  });

  const text = [
    `Hola, ${input.firstName}`,
    '',
    `Recibimos una solicitud para restablecer la contraseña de tu cuenta en ${input.institutionName}.`,
    'Abre este enlace para crear una contraseña nueva:',
    input.resetUrl,
    '',
    `El enlace vence en 1 hora (a las ${expirationTime}) y solo se puede usar una vez.`,
    '',
    DISCLAIMER,
  ].join('\n');

  return {
    subject: 'Restablece tu contraseña de Quartz',
    html,
    text,
  };
}
