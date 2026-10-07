# Guía de despliegue de Quartz

## Contexto
Quartz es un monorepo con dos paquetes que se despliegan por separado:
- `quartz-api`: Express + Mongoose en TypeScript (CommonJS). Hoy arranca con `ts-node src/app.ts` y no tiene paso de build.
- `quartz-web`: React + Vite. Es una SPA con `createBrowserRouter` y lee `VITE_API_BASE_URL`.

Servicios externos que ya usa el código: **MongoDB**, **Cloudflare R2** (imágenes) y **SMTP** (invitaciones).

La arquitectura ya decidida en `dev/deploy.md` y `dev/01-deploy-architecture.md` es:

| Pieza | Servicio |
|---|---|
| Web (`quartz-web`) | Vercel |
| API (`quartz-api`) | Render Starter (sin cold start). Alternativa: Railway |
| Base de datos | MongoDB Atlas |
| Imágenes | Cloudflare R2 |
| Correo | Proveedor SMTP transaccional |

---

## Fase 0: arreglos en el código antes de desplegar (bloqueantes)
1. **La API no arranca en producción tal como está.** `start` usa `ts-node`, que es una devDependency, y los hosts instalan sin devDeps cuando `NODE_ENV=production`.
   - En `quartz-api/package.json` agregar `"build": "tsc"` y cambiar `"start": "node dist/app.js"`. `tsconfig.json` ya define `outDir: dist` y `rootDir: src`.
   - Compilar con `npx tsc` y validar que `dist/app.js` arranque en local.
2. **`JWT_SECRET` tiene `'dev_secret'` como valor de respaldo** en `src/middlewares/auth.middleware.ts:5` y `src/features/auth/auth.service.ts:12`. Hay que quitar ese respaldo y fallar al arrancar si falta, igual que el chequeo de Mongo en `src/app.ts:56`.
3. **Si falla la conexión a Mongo, el proceso queda vivo sin escuchar.** El `.catch` en `src/app.ts:71` necesita `process.exit(1)` para que Render reinicie el servicio.
4. **Health check:** agregar `GET /api/health → 200` en `app.ts` para usarlo en Render.
5. **SPA en Vercel:** crear `quartz-web/vercel.json` con un rewrite `/(.*) → /index.html`. Sin esto, recargar `/evaluacion/...` o abrir el enlace del correo `/activar-cuenta?token=...` devuelve 404.
6. **Hay credenciales en claro en el repo.** `quartz-api/scripts/generate-hash.js` contiene contraseñas reales. Hay que cambiarlas, dejar el script leyendo la contraseña desde un argumento y considerar limpiar el historial.
7. Seguir SDD: abrir un spec corto (por ejemplo `INF-11-production-readiness`) con estos cambios y verificar con `npx tsc --noEmit` en `quartz-api` y `npm run build && npm run lint` en `quartz-web`.

## Fase 1: release
- `main` va muy por detrás de `develop` y no hay tags. Hay que mergear las ramas pendientes a `develop` por PR y luego correr `/sdd-release` para crear la versión, el `CHANGELOG`, el tag y el merge a `main`.
- Producción se despliega **solo desde `main`**. Opcionalmente, `develop` puede generar previews en Vercel.

## Fase 2: infraestructura
1. **MongoDB Atlas**
   - Crear un cluster (M0 para piloto, M2/M10 para producción con backups) y un usuario de BD con permisos `readWrite` sobre la base de Quartz.
   - Network Access: `0.0.0.0/0`, porque Render no tiene IP fija en Starter. Compensarlo con un password fuerte.
   - Copiar el URI con los placeholders literales `<user>` y `<password>`: `app.ts:61` los reemplaza con `API_USER` y `API_PASSWORD`.
2. **Cloudflare R2**
   - Crear el bucket de producción y un API token con Object Read & Write sobre ese bucket.
   - Activar acceso público, idealmente con un dominio propio (`cdn.tudominio.com`) en lugar de `r2.dev`, que tiene rate limit.
   - El logo del correo está fijo a una URL `r2.dev` en `src/services/invitation-email.template.ts:21`: confirmar que ese objeto exista en el bucket de producción o moverlo.
3. **SMTP**
   - Usar un proveedor transaccional (Resend, Brevo, SES o Gmail con app password para piloto).
   - Configurar SPF y DKIM en el dominio remitente.

## Fase 3: desplegar la API en Render
- New Web Service → repo `legardajohan/quartz`, branch `main`, **Root Directory `quartz-api`**, Node 20.
- Build: `npm ci --include=dev && npm run build`. Start: `npm start`. Health check: `/api/health`.
- Variables de entorno:

| Variable | Valor |
|---|---|
| `MONGODB_URI` | URI de Atlas con `<user>` y `<password>` literales |
| `API_USER`, `API_PASSWORD` | Credenciales del usuario de BD |
| `JWT_SECRET` | Valor aleatorio largo, por ejemplo `openssl rand -base64 48` |
| `WEB_ORIGIN` | URL exacta del frontend, sin `/` final. Se usa para CORS y para el enlace de activación |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` | Datos del bucket de R2 |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Datos del proveedor SMTP |
| `PORT` | Lo inyecta Render; no configurarlo |

- Opcional: un dominio propio `api.tudominio.com`.

## Fase 4: desplegar la web en Vercel
- Import project → **Root Directory `quartz-web`**, framework Vite, build `npm run build`, output `dist`.
- Variable: `VITE_API_BASE_URL=https://api.tudominio.com/api`. Debe **incluir `/api`**, porque el cliente llama a rutas como `/auth/login`. Se inyecta al compilar, así que cualquier cambio requiere un redeploy.
- Dominio `app.tudominio.com`. Luego actualizar `WEB_ORIGIN` en Render con esa URL y redeployar la API.

## Fase 5: datos iniciales
- **No existe endpoint para crear instituciones ni el primer Jefe de Área.** Hay que insertarlos a mano en Atlas (Data Explorer o `mongosh`):
  - un documento en `institutions`;
  - un usuario admin con su `institutionId`, rol de Jefe de Área y `password` como hash bcrypt generado en local.
  - Los campos exactos se toman de `institution.model.ts` y del modelo de usuarios.
- Los demás usuarios se crean desde la app: invitación o carga masiva.
- Los scripts `migrate-*.js` solo aplican si se migran datos existentes; una BD nueva no los necesita.

## Verificación de punta a punta
1. `curl https://api…/api/health` → 200, y en los logs de Render aparecen `MongoDB connected` y `Server running`.
2. Login con el admin desde el dominio de Vercel, sin errores de CORS en la consola.
3. Recargar una ruta profunda (`/gestion/usuarios`) → carga, lo que confirma el rewrite.
4. Subir el escudo de la institución o un avatar → la URL apunta a R2 y la imagen se ve.
5. Invitar a un docente → llega el correo, el enlace `/activar-cuenta` abre y la activación funciona.
6. Generar la Carta Comunicativa y la Lista de Chequeo en PDF, con el escudo visible.

## Después del lanzamiento (recomendado, no bloqueante)
- Backups de Atlas.
- Alertas de uptime sobre `/api/health`.
- Rate limit en `/api/auth/login`.
- `helmet` en la API.
