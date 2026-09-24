import { INVITATION_TTL_DAYS } from '../utils/activationToken';

export interface InvitationEmailInput {
  firstName: string;
  role: string;
  institutionName: string;
  activationUrl: string;
  expiresAt: Date;
}

export interface InvitationEmail {
  subject: string;
  html: string;
  text: string;
}

const BRAND_PURPLE = '#620DD1'; // purple-800 — mismo token que quartz-web/tailwind.config.js

// Logo fijo de marca (no depende de la institución): subido una sola vez a R2 desde
// quartz-web/public/quartz-name.svg. Se reutiliza en todo correo transaccional de Quartz.
const QUARTZ_LOGO_URL = 'https://pub-cef9daf4a53d4316a260fbc39622e206.r2.dev/branding/quartz-wordmark-email.png';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatExpiration(date: Date): string {
  return date.toLocaleDateString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'long' });
}

// HTML con tablas y estilos inline: es lo único que Outlook y Gmail renderizan de forma
// consistente. El preheader oculto (primer <div>) controla el texto de vista previa que
// muestran Gmail/Outlook/Apple Mail junto al asunto en la bandeja de entrada.
export function buildInvitationEmail(input: InvitationEmailInput): InvitationEmail {
  const firstName = escapeHtml(input.firstName);
  const role = escapeHtml(input.role);
  const institutionName = escapeHtml(input.institutionName);
  const activationUrl = escapeHtml(input.activationUrl);
  const expiration = formatExpiration(input.expiresAt);
  const preheader = `Activa tu cuenta como ${role} en menos de un minuto.`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Bienvenido a Quartz</title></head>
<body style="margin:0;padding:0;background-color:#f5f3ff;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f3ff;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;padding:40px 32px;">
        <tr><td align="center">
          <img src="${QUARTZ_LOGO_URL}" alt="Quartz" width="190" height="22" style="display:block;margin:0 auto 32px;width:190px;height:22px;border:0;" />
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#1f2937;">Bienvenido a Quartz, ${firstName}</h1>
          <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#4b5563;">Te invitaron a unirte a <strong>${institutionName}</strong> como <strong>${role}</strong>.</p>
          <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#4b5563;">Crea tu contraseña para activar la cuenta y empezar a usar Quartz.</p>
          <table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" style="border-radius:999px;background-color:${BRAND_PURPLE};">
            <a href="${activationUrl}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;">Activar mi cuenta</a>
          </td></tr></table>
          <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#6b7280;">El enlace vence el <strong>${expiration}</strong> (${INVITATION_TTL_DAYS} días) y solo se puede usar una vez.</p>
          <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#6b7280;word-break:break-all;">Si el botón no funciona, copia este enlace en tu navegador:<br />${activationUrl}</p>
        </td></tr>
      </table>
      <p style="margin:24px 0 0;font-size:12px;color:#6b7280;">Este es un mensaje automático, no respondas a este correo. Si no esperabas esta invitación, puedes ignorarlo.</p>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `Bienvenido a Quartz, ${input.firstName}`,
    '',
    `Te invitaron a unirte a ${input.institutionName} como ${input.role}.`,
    'Crea tu contraseña para activar la cuenta y empezar a usar Quartz:',
    input.activationUrl,
    '',
    `El enlace vence el ${expiration} (${INVITATION_TTL_DAYS} días) y solo se puede usar una vez.`,
    '',
    'Este es un mensaje automático, no respondas a este correo. Si no esperabas esta invitación, puedes ignorarlo.',
  ].join('\n');

  return {
    subject: `Te invitaron a unirte a ${input.institutionName} en Quartz`,
    html,
    text,
  };
}
