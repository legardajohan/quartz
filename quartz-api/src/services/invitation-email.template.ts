import { INVITATION_TTL_DAYS } from '../utils/activationToken';
import { escapeHtml, renderTransactionalEmail } from './email-layout';

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

function formatExpiration(date: Date): string {
  return date.toLocaleDateString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'long' });
}

const DISCLAIMER =
  'Este es un mensaje automático, no respondas a este correo. Si no esperabas esta invitación, puedes ignorarlo.';

export function buildInvitationEmail(input: InvitationEmailInput): InvitationEmail {
  const firstName = escapeHtml(input.firstName);
  const role = escapeHtml(input.role);
  const institutionName = escapeHtml(input.institutionName);
  const activationUrl = escapeHtml(input.activationUrl);
  const expiration = formatExpiration(input.expiresAt);

  const html = renderTransactionalEmail({
    title: 'Bienvenido a Quartz',
    preheader: `Activa tu cuenta como ${role} en menos de un minuto.`,
    heading: `Bienvenido a QUARTZ, ${firstName}`,
    paragraphsHtml: [
      `Te invitaron a unirte a <strong>${institutionName}</strong> como <strong>${role}</strong>.`,
      'Crea tu contraseña para activar la cuenta y empezar a usar nuestra plataforma.',
    ],
    ctaLabel: 'Activar mi cuenta',
    ctaUrl: activationUrl,
    footnoteHtml: `El enlace vence el <strong>${expiration}</strong> (${INVITATION_TTL_DAYS} días) y solo se puede usar una vez.`,
    disclaimer: DISCLAIMER,
  });

  const text = [
    `Bienvenido a QUARTZ, ${input.firstName}`,
    '',
    `Te invitaron a unirte a ${input.institutionName} como ${input.role}.`,
    'Crea tu contraseña para activar la cuenta y empezar a usar nuestra plataforma:',
    input.activationUrl,
    '',
    `El enlace vence el ${expiration} (${INVITATION_TTL_DAYS} días) y solo se puede usar una vez.`,
    '',
    DISCLAIMER,
  ].join('\n');

  return {
    subject: `Te invitaron a unirte a ${input.institutionName} en Quartz`,
    html,
    text,
  };
}
