# INF-11 — Plan técnico

## Archivos
### quartz-api
| Acción | Ruta | Cambio |
|---|---|---|
| tocar | `package.json` | `"build": "tsc"`, `"start": "node dist/app.js"`, `"main": "dist/app.js"`, `"engines": { "node": ">=20" }`. `dev` sin cambios |
| crear | `src/utils/jwtSecret.ts` | `export function getJwtSecret(): string` |
| tocar | `src/features/auth/auth.service.ts` | borrar `const JWT_SECRET` (l.21); `jwt.sign(..., getJwtSecret(), ...)` (l.105) |
| tocar | `src/middlewares/auth.middleware.ts` | borrar `const JWT_SECRET` (l.5); `jwt.verify(token, getJwtSecret())` (l.22) |
| tocar | `src/app.ts` | health check, fail-fast de `JWT_SECRET`, `process.exit(1)` en el `.catch` de Mongo (l.71) |
| borrar | `scripts/generate-hash.js` | `git rm` |

### quartz-web
| Acción | Ruta | Cambio |
|---|---|---|
| crear | `vercel.json` | `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }` |

### raíz
| Acción | Ruta | Cambio |
|---|---|---|
| tocar | `00-deploy.md` | Fase 0.6: archivo eliminado + rotar contraseñas. Fase 1: ramas ya en `develop`, solo `/sdd-release`. Fase 5: hash con `node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 10))" '<password>'` desde `quartz-api/` |

## Contratos
### `getJwtSecret`
- Firma: `export function getJwtSecret(): string`.
- Lee `process.env.JWT_SECRET` en cada llamada (lectura perezosa).
- Si está vacío o ausente: `throw new Error('JWT_SECRET no está definido')`.

### `app.ts`
- Chequeo junto al de Mongo (l.55-59): si `!process.env.JWT_SECRET` → `console.error(...)` + `process.exit(1)`.
- `.catch((err) => { console.error('MongoDB connection error:', err); process.exit(1); })`.
- Health montado antes de `app.use('/api/auth', ...)`.

### Endpoints
| Método | Ruta | Rol | Middlewares | Respuesta |
|---|---|---|---|---|
| GET | `/api/health` | público | ninguno | `200 { "status": "ok" }` |

## Notas
- **Hoisting de `dotenv`:** los `import` de `app.ts` se evalúan antes de `dotenv.config()` (l.20). Hoy `JWT_SECRET` se lee a nivel de módulo y vale `undefined` en ese momento, así que en local **siempre** se usa `'dev_secret'`. Por eso la lectura es perezosa, igual que `src/services/r2.service.ts` y `src/services/mail.service.ts`. Quitar solo el `|| 'dev_secret'` rompería el arranque.
- Efecto en local: los tokens firmados con `'dev_secret'` dejan de valer → volver a iniciar sesión. `.env` local debe tener `JWT_SECRET`.
- Health inline en `app.ts`: sin modelo ni service, no amerita el patrón de 6 archivos.
- `dist/` ya está en el `.gitignore` raíz.
- Render: build `npm ci --include=dev && npm run build` (ya documentado en `00-deploy.md`, Fase 3).

## Verificación
- `cd quartz-api && npx tsc --noEmit`
- `cd quartz-api && npm run build && npm start` → `curl http://localhost:4000/api/health` = 200.
- Sin `JWT_SECRET` → la API termina con código 1.
- `MONGODB_URI` inválida → la API termina con código 1.
- `npm run dev` + login desde `quartz-web` (puerto 5173) funciona.
- `grep -rn dev_secret quartz-api/src` sin resultados.
- `cd quartz-web && npm run build && npm run lint`
