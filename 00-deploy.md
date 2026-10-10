# Guía de despliegue de Quartz

## Contexto
Quartz es un monorepo con dos paquetes que se despliegan por separado:
- `quartz-api`: Express + Mongoose en TypeScript (CommonJS). Hoy arranca con `ts-node src/app.ts` y no tiene paso de build.
- `quartz-web`: React + Vite. Es una SPA con `createBrowserRouter` y lee `VITE_API_BASE_URL`.

Servicios externos que ya usa el código: **MongoDB**, **Cloudflare R2** (imágenes) y **Resend vía SMTP** (invitaciones, con nodemailer en `src/services/mail.service.ts`).

Arquitectura elegida (ver también `02-r2-domain.md`):

| Pieza | Servicio |
|---|---|
| Dominio + DNS | `quartzedu.co` en Cloudflare |
| Web (`quartz-web`) | Vercel → `app.quartzedu.co` |
| API (`quartz-api`) | DigitalOcean App Platform (Basic, ~1 GB) → `api.quartzedu.co` |
| Base de datos | MongoDB Atlas |
| Imágenes | Cloudflare R2 → `cdn.quartzedu.co` |
| Correo | Resend (SMTP), remitente `@quartzedu.co` |

### Cuentas y servicios contratados
> Solo se anota el correo de la cuenta. **Nunca contraseñas, API keys ni códigos 2FA.**

| Servicio | Uso | Cuenta (correo) | Plan | Región | Estado |
|---|---|---|---|---|---|
| Cloudflare | Dominio `quartzedu.co`, DNS, R2 (`cdn.quartzedu.co`) | quartzsaas@gmail.com | Registrar + R2 gratis | Global | ✅ Configurado |
| Resend | Correo transaccional | Gmail personal | Free | `us-east-1` (N. Virginia) | ⏳ En curso |
| DigitalOcean | API (App Platform) | _pendiente_ | Basic ~1 GB | NYC | ⏳ Pendiente |
| MongoDB Atlas | Base de datos | _pendiente_ | M0 / M10 | AWS `us-east-1` | ⏳ Pendiente |
| Vercel | Web (`app.quartzedu.co`) | _pendiente_ | Hobby | Global (CDN) | ⏳ Pendiente |
| GitHub | Repo `legardajohan/quartz` | _pendiente_ | — | — | ✅ |

### Regiones (usuarios en Colombia)
- Ningún proveedor tiene centro de datos en Colombia. Desde Bogotá/Medellín el tráfico sale por Miami, así que **el este de EE. UU. es lo más cercano** (~60–80 ms). São Paulo queda peor por ruteo.
- **API y BD deben estar juntas**, porque cada request hace varias consultas a Mongo: DigitalOcean **NYC** + Atlas **AWS `us-east-1`** (~5–10 ms entre ellas).
- Resend: `us-east-1`. Solo afecta desde dónde sale el correo, no la latencia del usuario.
- Vercel y Cloudflare sirven desde su CDN global (Cloudflare tiene nodo en Bogotá); no hay región que elegir.

---

## Fase 0: arreglos en el código antes de desplegar (bloqueantes)
1. **La API no arranca en producción tal como está.** `start` usa `ts-node`, que es una devDependency, y los hosts instalan sin devDeps cuando `NODE_ENV=production`.
   - En `quartz-api/package.json` agregar `"build": "tsc"` y cambiar `"start": "node dist/app.js"`. `tsconfig.json` ya define `outDir: dist` y `rootDir: src`.
   - Compilar con `npx tsc` y validar que `dist/app.js` arranque en local.
2. **`JWT_SECRET` tiene `'dev_secret'` como valor de respaldo** en `src/middlewares/auth.middleware.ts:5` y `src/features/auth/auth.service.ts:12`. Hay que quitar ese respaldo y fallar al arrancar si falta, igual que el chequeo de Mongo en `src/app.ts:56`.
3. **Si falla la conexión a Mongo, el proceso queda vivo sin escuchar.** El `.catch` en `src/app.ts:71` necesita `process.exit(1)` para que App Platform reinicie el servicio.
4. **Health check:** agregar `GET /api/health → 200` en `app.ts` para usarlo en App Platform.
5. **SPA en Vercel:** crear `quartz-web/vercel.json` con un rewrite `/(.*) → /index.html`. Sin esto, recargar `/evaluacion/...` o abrir el enlace del correo `/activar-cuenta?token=...` devuelve 404.
6. **Había credenciales en claro en el repo.** `quartz-api/scripts/generate-hash.js` se eliminó en INF-11, pero sigue en el historial desde `30b1284`: hay que rotar esas contraseñas.
7. Seguir SDD: abrir un spec corto (por ejemplo `INF-11-production-readiness`) con estos cambios y verificar con `npx tsc --noEmit` en `quartz-api` y `npm run build && npm run lint` en `quartz-web`.

## Fase 1: release
- `main` va muy por detrás de `develop` y no hay tags. Todas las ramas `feat/*` ya están en `develop` (verificado el 2026-10-07). Tras mergear INF-11 por PR, correr `/sdd-release` para crear la versión, el `CHANGELOG`, el tag y el merge a `main`.
- Producción se despliega **solo desde `main`**. Opcionalmente, `develop` puede generar previews en Vercel.

## Fase 2: infraestructura
1. **MongoDB Atlas**
   - Crear un cluster (M0 para piloto, M2/M10 para producción con backups) y un usuario de BD con permisos `readWrite` sobre la base de Quartz. Región sugerida: AWS `us-east-1`, cerca de la región NYC de DigitalOcean.
   - Network Access: `0.0.0.0/0`, porque App Platform no tiene IP de salida fija salvo que se pague el add-on de IP dedicada. Compensarlo con un password fuerte.
   - Copiar el URI con los placeholders literales `<user>` y `<password>`: `app.ts:61` los reemplaza con `API_USER` y `API_PASSWORD`.
2. **Cloudflare R2** ✅ hecho
   - Bucket de producción y API token con Object Read & Write sobre ese bucket.
   - Acceso público por dominio propio `cdn.quartzedu.co` (no `r2.dev`, que tiene rate limit).
   - Logo del correo subido en `branding/quartz-wordmark-email.png`; `QUARTZ_LOGO_URL` en `src/services/email-layout.ts:5` ya apunta a `https://cdn.quartzedu.co/branding/quartz-wordmark-email.png`.
   - Variable: `R2_PUBLIC_URL=https://cdn.quartzedu.co`.
3. **Resend (correo)**
   1. Crear la cuenta, ir a **Domains → Add Domain** → `quartzedu.co` y elegir una región.
   2. Agregar los registros DNS en Cloudflare, con el botón de autoconfiguración de Cloudflare que ofrece Resend o a mano:
      - TXT de DKIM `resend._domainkey`.
      - MX y TXT de SPF en el subdominio `send`.
      - Todos con el proxy **desactivado** (nube gris).
   3. Agregar DMARC: TXT `_dmarc` con `v=DMARC1; p=none; rua=mailto:<tu-correo>`. Cuando todo funcione, endurecerlo a `p=quarantine`.
   4. Esperar a que el dominio aparezca como **Verified** y crear una API key con permiso *Sending access*, limitada a `quartzedu.co`.
   5. El plan gratis permite ~3.000 correos al mes y 100 al día. Confirmar los límites en Resend.

## Fase 3: desplegar la API en DigitalOcean App Platform
- **Create App** → GitHub `legardajohan/quartz`, branch `main`, **autodeploy** activado, **Source Directory `quartz-api`**, Node 20. Región: NYC.
- Build: `npm ci --include=dev && npm run build`. Run: `npm start`. HTTP port: el que inyecta `PORT`. Health check: HTTP `/api/health`.
- Plan: Basic, ~1 GB de RAM.
- Variables de entorno (marcar los secretos como **Encrypted**):

| Variable | Valor |
|---|---|
| `MONGODB_URI` | URI de Atlas con `<user>` y `<password>` literales |
| `API_USER`, `API_PASSWORD` | Credenciales del usuario de BD |
| `JWT_SECRET` | Valor aleatorio largo, por ejemplo `openssl rand -base64 48` |
| `WEB_ORIGIN` | `https://app.quartzedu.co`, sin `/` final. Se usa para CORS y para el enlace de activación |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Datos del bucket de R2 |
| `R2_PUBLIC_URL` | `https://cdn.quartzedu.co` |
| `SMTP_HOST` | `smtp.resend.com` |
| `SMTP_PORT`, `SMTP_SECURE` | `2465` y `true`. Se usa el puerto alterno de Resend porque DigitalOcean bloquea 25, 465 y 587 en algunos recursos |
| `SMTP_USER` | `resend` |
| `SMTP_PASS` | API key de Resend |
| `MAIL_FROM` | `Quartz <no-reply@quartzedu.co>` |
| `PORT` | Lo inyecta App Platform; no configurarlo |

- Dominio: **Settings → Domains** → `api.quartzedu.co`. En Cloudflare DNS crear el CNAME que indique DigitalOcean, con el proxy **desactivado** (nube gris).

## Fase 4: desplegar la web en Vercel
- Import project → **Root Directory `quartz-web`**, framework Vite, build `npm run build`, output `dist`.
- Variable: `VITE_API_BASE_URL=https://api.quartzedu.co/api`. Debe **incluir `/api`**, porque el cliente llama a rutas como `/auth/login`. Se inyecta al compilar, así que cualquier cambio requiere un redeploy.
- Dominio `app.quartzedu.co`, con su CNAME en Cloudflare (nube gris). Luego confirmar `WEB_ORIGIN=https://app.quartzedu.co` en App Platform y redeployar la API.

## Fase 5: datos iniciales
- **No existe endpoint para crear instituciones ni el primer Jefe de Área.** Hay que insertarlos a mano en Atlas (Data Explorer o `mongosh`):
  - un documento en `institutions`;
  - un usuario admin con su `institutionId`, rol de Jefe de Área y `password` como hash bcrypt generado en local desde `quartz-api/`: `node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 10))" '<password>'`.
  - Los campos exactos se toman de `institution.model.ts` y del modelo de usuarios.
- Los demás usuarios se crean desde la app: invitación o carga masiva.
- Los scripts `migrate-*.js` solo aplican si se migran datos existentes; una BD nueva no los necesita.

## Verificación de punta a punta
1. `curl https://api.quartzedu.co/api/health` → 200, y en los Runtime Logs de App Platform aparecen `MongoDB connected` y `Server running`.
2. Login con el admin desde `https://app.quartzedu.co`, sin errores de CORS en la consola.
3. Recargar una ruta profunda (`/gestion/usuarios`) → carga, lo que confirma el rewrite.
4. Subir el escudo de la institución o un avatar → la URL apunta a `cdn.quartzedu.co` y la imagen se ve.
5. Invitar a un docente → llega el correo con el logo y no cae en spam. En Gmail, "Mostrar original" debe indicar SPF, DKIM y DMARC en `PASS`. El enlace `/activar-cuenta` abre y la activación funciona.
6. Generar la Carta Comunicativa y la Lista de Chequeo en PDF, con el escudo visible.

## Después del lanzamiento (recomendado, no bloqueante)
- Backups de Atlas.
- Alertas de uptime sobre `/api/health`.
- Rate limit en `/api/auth/login`.
- `helmet` en la API.
- Endurecer DMARC a `p=quarantine`.
