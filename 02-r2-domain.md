# Cloudflare R2, dominio y backend

> Fecha: 2026-10-08 · Decisión: dominio y DNS en **Cloudflare**, API en **DigitalOcean App Platform**

## Decisión
| Pieza | Dónde | Por qué |
|---|---|---|
| Dominio + DNS | **Cloudflare Registrar** | Vende al costo (sin margen). R2 exige el DNS en Cloudflare para usar `cdn.tudominio.com` |
| Imágenes | Cloudflare R2 (ya configurado) | Sin cobro de egreso, 10 GB gratis |
| API `quartz-api` | **DigitalOcean App Platform Basic 1 GB (~USD 12/mes)** | Corre Express + Mongoose tal cual, con HTTPS y reinicio automático |
| Web | Vercel | Gratis |

DigitalOcean no vende dominios, solo aloja DNS. Con el dominio en Cloudflare, solo se apunta `api.tudominio.com` a DigitalOcean con un CNAME.

## Por qué no desplegar la API en Cloudflare
- Workers no corre Express + Mongoose sin reescribir y el driver de MongoDB no tiene soporte oficial allí.
- Cloudflare Containers permitiría correr Node, pero se cobra por uso y es más nuevo; no vale el riesgo para el lanzamiento.
- Con DigitalOcean no se cambia código.

## Pasos
1. Comprar el dominio en Cloudflare (Dashboard → Domain Registration). Se añade solo como zona DNS.
2. R2 → bucket → Settings → **Custom Domains** → `cdn.tudominio.com`. Cloudflare crea el DNS solo.
3. Activar el acceso público del bucket y subir `branding/quartz-wordmark-email.png`.
4. Cambiar `QUARTZ_LOGO_URL` en `quartz-api/src/services/email-layout.ts:5` a `https://cdn.tudominio.com/branding/quartz-wordmark-email.png`.
5. Variable de entorno: `R2_PUBLIC_URL=https://cdn.tudominio.com`.
6. En DigitalOcean App Platform → Settings → Domains → agregar `api.tudominio.com`. Luego en Cloudflare DNS crear el CNAME que indique DigitalOcean, con el proxy **desactivado** (nube gris).
7. En Vercel, `app.tudominio.com` con su CNAME. Actualizar `WEB_ORIGIN` y `VITE_API_BASE_URL`.

## Verificación
- `https://cdn.tudominio.com/branding/quartz-wordmark-email.png` muestra la imagen.
- `https://api.tudominio.com/api/health` responde 200.
- Una invitación por correo muestra el logo.

## Costo
| Concepto | Costo aprox. |
|---|---|
| Dominio `.com` en Cloudflare | ~USD 10/año |
| R2 | 0 (hasta 10 GB) |
| API en DigitalOcean | USD 12/mes |

Los precios son de referencia: confirmar en Cloudflare y DigitalOcean antes de pagar.
