# INF-12 — Plan técnico

## Archivos
### quartz-api
| Acción | Ruta |
|---|---|
| tocar | `src/app.ts` |
| tocar | `CLAUDE.md` (paso 7: `app.use('/<plural>', …)` dentro del router raíz) |

### quartz-web
| Acción | Ruta |
|---|---|
| tocar | `src/components/layouts/SidebarMenu.tsx` (línea 116) |
| tocar | `src/features/auth/components/PresentationPanel.tsx` |
| tocar | `src/assets/images/login-illustration.svg` (recolorear acento) |
| borrar | `src/assets/images/login-bg.jpg` |
| tocar | `docs/known-issues.md` |
| tocar | `.env` (`VITE_API_BASE_URL="http://localhost:4000"`) |

### Raíz
| Acción | Ruta |
|---|---|
| tocar | `.claude/skills/quartz-feature-scaffold/SKILL.md:21` |

## Contratos
### Endpoints
Mismas rutas y middlewares; cambia solo el prefijo de montaje.

| Antes | Después |
|---|---|
| `GET /api/health` | `GET /health` |
| `/api/<recurso>` | `/<recurso>` |

`src/app.ts`:
- Crear `const router = express.Router()` con `router.get('/health', …)` y los 12 `router.use('/<plural>', <feature>Routes)`.
- Montar con `app.use('/', router)`. Sin alias `/api`: se descartó en implementación a favor de un corte directo coordinado con Vercel.
- `app.use(errorHandler)` sigue después del mount.

### Frontend
**`SidebarMenu.tsx`**
- `` const bgPattern = `url("${starryBackground}")`; `` y un comentario breve: Vite incrusta el SVG (<4 KB) como data URI con comillas simples y espacios.

**`PresentationPanel.tsx`**
- Se eliminan la capa `backgroundImage` (y su `style`) y el overlay `bg-black/50`.
- El contenedor pasa de `/80` a `bg-gradient-to-br from-purple-700 to-purple-900`.
- Encima del logo arcoíris va `<img src={loginIllustration} alt="" aria-hidden="true" width height className="w-full max-w-xs" />`. El layout pasa de `justify-end` a `justify-center`.

**`login-illustration.svg`**
- Reemplazar `fill="#6c63ff"` por un tono de la paleta. El tono se elige en la pasada de diseño.
- Ajustar los rellenos `#3f3d56`/`#2f2e41` si se pierden sobre el morado oscuro.

## Notas
- Basta la doble montura del router: Express resuelve `/api/auth` contra el mount `/api` y `/auth` contra `/`. No hay choque, porque ningún feature se llama `api`.
- La ilustración va como `<img>` y no como `background`: no la incrusta un `url()` frágil, puede llevar `width`/`height` y no se recorta con `bg-cover`.
- Antes de tocar `PresentationPanel.tsx` se invocan las skills `emil-design-eng`, `impeccable` y `frontend-design` (`quartz-web/CLAUDE.md`).
- `00-deploy.md` está borrado en el working tree. Si se restaura, actualizar `VITE_API_BASE_URL`, el health check y los `curl`.

## Verificación
- `cd quartz-api && npx tsc --noEmit`. Con `npm run dev`, `curl localhost:4000/health` y `curl localhost:4000/api/health` devuelven 200.
- `cd quartz-web && npm run build && npm run lint`.
- En `dist/assets/*.js`, buscar `url("data:image/svg+xml`.
- Prueba visual manual, a cargo del usuario: sidebar morado en `npm run preview` y login con la ilustración.
