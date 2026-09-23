import { INVITATION_TTL_DAYS } from '../utils/activationToken';

export interface InvitationEmailInput {
  firstName: string;
  role: string;
  institutionName: string;
  shieldJpgUrl?: string;
  activationUrl: string;
  expiresAt: Date;
}

export interface InvitationEmail {
  subject: string;
  html: string;
  text: string;
}

const BRAND_PURPLE = '#7e22ce';

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
// consistente. El escudo va en JPG (`shieldJpgUrl`) porque Outlook no muestra WebP.
export function buildInvitationEmail(input: InvitationEmailInput): InvitationEmail {
  const firstName = escapeHtml(input.firstName);
  const role = escapeHtml(input.role);
  const institutionName = escapeHtml(input.institutionName);
  const activationUrl = escapeHtml(input.activationUrl);
  const expiration = formatExpiration(input.expiresAt);

  const shield = input.shieldJpgUrl
    ? `<img src="${escapeHtml(input.shieldJpgUrl)}" alt="Escudo de ${institutionName}" width="64" height="64" style="display:block;margin:0 auto 16px;width:64px;height:64px;object-fit:contain;border:0;" />`
    : '';

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Activa tu cuenta</title></head>
<body style="margin:0;padding:0;background-color:#f5f3ff;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f3ff;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;padding:40px 32px;">
        <tr><td align="center">
          ${shield}
          <p style="margin:0 0 24px;font-size:14px;font-weight:bold;color:${BRAND_PURPLE};letter-spacing:0.02em;">${institutionName}</p>
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#1f2937;">Hola, ${firstName}</h1>
          <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#4b5563;">Te dieron acceso a Quartz como <strong>${role}</strong>.</p>
          <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#4b5563;">Crea tu contraseña para activar la cuenta.</p>
          <table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" style="border-radius:999px;background-color:${BRAND_PURPLE};">
            <a href="${activationUrl}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;">Activar mi cuenta</a>
          </td></tr></table>
          <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#6b7280;">El enlace vence el <strong>${expiration}</strong> (${INVITATION_TTL_DAYS} días) y solo se puede usar una vez.</p>
          <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#9ca3af;word-break:break-all;">Si el botón no funciona, copia este enlace en tu navegador:<br />${activationUrl}</p>
        </td></tr>
      </table>
      <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">Si no esperabas este correo, puedes ignorarlo.</p>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    input.institutionName,
    '',
    `Hola, ${input.firstName}`,
    '',
    `Te dieron acceso a Quartz como ${input.role}. Crea tu contraseña para activar la cuenta:`,
    input.activationUrl,
    '',
    `El enlace vence el ${expiration} (${INVITATION_TTL_DAYS} días) y solo se puede usar una vez.`,
    '',
    'Si no esperabas este correo, puedes ignorarlo.',
  ].join('\n');

  return {
    subject: `Activa tu cuenta en Quartz — ${input.institutionName}`,
    html,
    text,
  };
}
