export const BRAND_PURPLE = '#620DD1'; // purple-800 — mismo token que quartz-web/tailwind.config.js

// Logo fijo de marca (no depende de la institución): subido una sola vez a R2 desde
// quartz-web/public/quartz-name.svg. Se reutiliza en todo correo transaccional de Quartz.
export const QUARTZ_LOGO_URL = 'https://pub-cef9daf4a53d4316a260fbc39622e206.r2.dev/branding/quartz-wordmark-email.png';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Todos los campos llegan ya escapados por el llamador (pueden contener <strong>).
export interface TransactionalEmailLayout {
  title: string;
  preheader: string;
  heading: string;
  paragraphsHtml: string[];
  ctaLabel: string;
  ctaUrl: string;
  footnoteHtml: string;
  disclaimer: string;
}

function renderParagraphs(paragraphs: string[]): string {
  return paragraphs
    .map((paragraph, index) => {
      const marginBottom = index === paragraphs.length - 1 ? 28 : 8;
      return `<p style="margin:0 0 ${marginBottom}px;font-size:15px;line-height:1.6;color:#4b5563;">${paragraph}</p>`;
    })
    .join('\n          ');
}

// HTML con tablas y estilos inline: es lo único que Outlook y Gmail renderizan de forma
// consistente. El preheader oculto (primer <div>) controla el texto de vista previa que
// muestran Gmail/Outlook/Apple Mail junto al asunto en la bandeja de entrada.
export function renderTransactionalEmail(layout: TransactionalEmailLayout): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${layout.title}</title></head>
<body style="margin:0;padding:0;background-color:#f5f3ff;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${layout.preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f3ff;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;padding:40px 32px;">
        <tr><td align="center">
          <img src="${QUARTZ_LOGO_URL}" alt="Quartz" width="190" height="22" style="display:block;margin:0 auto 32px;width:190px;height:22px;border:0;" />
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#1f2937;">${layout.heading}</h1>
          ${renderParagraphs(layout.paragraphsHtml)}
          <table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" style="border-radius:999px;background-color:${BRAND_PURPLE};">
            <a href="${layout.ctaUrl}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;">${layout.ctaLabel}</a>
          </td></tr></table>
          <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#6b7280;">${layout.footnoteHtml}</p>
          <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#6b7280;word-break:break-all;">Si el botón no funciona, copia este enlace en tu navegador:<br />${layout.ctaUrl}</p>
        </td></tr>
      </table>
      <p style="margin:24px 0 0;font-size:12px;color:#6b7280;">${layout.disclaimer}</p>
    </td></tr>
  </table>
</body>
</html>`;
}
