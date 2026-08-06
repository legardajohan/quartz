---
id: AUTH-01-welcome-loader
feature: welcome-loader
status: implemented  # draft | approved | implemented | released
created: 2026-08-05
---

# AUTH-01 — Welcome Loader: boot-splash post-login (spec)

## Objetivo
Mostrar un overlay de bienvenida a pantalla completa ("boot splash") inmediatamente después de un login exitoso, con el logotipo de Quartz, antes de que el usuario perciba el dashboard. Porta fielmente el diseño de referencia (`SofiAppWelcomeLoader`) provisto por el usuario, adaptado al logo y a la arquitectura de Quartz.

## Alcance
**Incluye:**
- Overlay `fixed inset-0` a pantalla completa: logo (`public/quartz-name.svg`) con animación de entrada, aura difusa, barrido de brillo (sheen) único, tagline y barra de progreso indeterminada.
- Fade-out automático tras una duración fija configurable (default 2200ms).
- Variante para `prefers-reduced-motion: reduce` (sin animaciones, contenido visible de inmediato).
- Variante para `prefers-color-scheme: dark` (relleno de logo con degradado animado púrpura→azul vía `mask-image`), activada por preferencia del sistema operativo — sin infraestructura de theming nueva.
- Disparo automático tras cada login exitoso (`useAuthStore.login()`), sin acción del usuario.

**Fuera:**
- Toggle de tema manual o infraestructura general de modo oscuro (Quartz no la tiene hoy; ver `useAuthStore.ts`/`tailwind.config.ts`).
- Mostrar el splash en otros eventos de sesión (logout, refresh de token, recarga de página con sesión persistida).
- Contenido o copy configurable más allá de `tagline` (sin CMS, sin i18n).
- Tests automatizados (no hay runner de tests en el proyecto todavía).
- Recrear pixel-perfect `rainbow-fill.css` del ejemplo: su contenido no fue compartido por el usuario; se recrea una animación de gradiente púrpura→azul equivalente (ver `plan.md` § Notas) y queda sujeta a ajuste visual en implementación.

## Criterios de aceptación (EARS)
- [x] Cuando `useAuthStore.login()` autentica correctamente, el sistema activa `showWelcomeLoader` y el overlay se monta a pantalla completa (`z-index` por encima de cualquier contenido de la app). (`useAuthStore.ts` rama de éxito de `login()`; `#quartz-loader-wrapper` con `z-index: 9999`)
- [x] Cuando el overlay lleva montado `durationMs` (default 2200ms), el sistema inicia el fade-out y, al terminar la transición, desmonta el overlay (`dismissWelcomeLoader`). (`WelcomeLoader.tsx`: `setTimeout(..., durationMs + FADE_OUT_MS)`, `FADE_OUT_MS=320` alineado con `quartzWelcome-fadeOut` en el CSS)
- [x] Cuando el login falla, el sistema no activa `showWelcomeLoader` (el flag permanece `false`). (rama `catch` de `login()` no lo toca; nunca se activó)
- [x] Si el usuario recarga la página con una sesión ya persistida (`token`/`sessionData` rehidratados desde `localStorage`), el sistema NO vuelve a mostrar el overlay (`showWelcomeLoader` no se persiste, arranca en `false`). (`partialize` de `useAuthStore.ts` solo persiste `token`/`sessionData`)
- [x] Cuando el usuario cierra sesión (`logout()`), el sistema deja `showWelcomeLoader` en `false`. (`logout()` lo incluye en su `set`)
- [x] Si el sistema operativo del usuario tiene `prefers-reduced-motion: reduce`, el overlay se muestra sin animaciones (contenido con opacidad final desde el primer frame) y el fade-out sigue ocurriendo tras `durationMs`. (`@media (prefers-reduced-motion: reduce)` en `WelcomeLoader.css`; el fade-out del wrapper se conserva por ser solo `opacity`)
- [x] Si el sistema operativo del usuario tiene `prefers-color-scheme: dark`, el logo se renderiza con el relleno de degradado animado (vía `mask-image` sobre `quartz-name.svg`) en vez de sus colores nativos. (`@media (prefers-color-scheme: dark)` en `WelcomeLoader.css`)
- [x] El overlay se navega en paralelo (no bloquea) la redirección existente a `/dashboard` en `LoginPage.tsx`: el dashboard se monta detrás del overlay mientras este permanece visible. (`AppRoot` en `App.tsx` monta el overlay junto al `<Outlet/>`, sin tocar `LoginPage.tsx`)
- [x] **Aislamiento:** no aplica — feature puramente de UI/animación, sin lectura ni escritura de datos de tenant, sin llamadas a backend.
- [x] `npx tsc --noEmit` no aplica (no toca `quartz-api`). `npm run build && npm run lint` en verde en `quartz-web`. (build verde; lint con los mismos 10 errores/7 warnings preexistentes en la base, confirmado con `git stash` — cero regresiones)

> Nota: los criterios anteriores están verificados por lectura de código + build/lint en verde y arranque limpio de ambos servidores. La prueba manual end-to-end en navegador (ver el splash renderizado, alternar `prefers-color-scheme`/`prefers-reduced-motion`, recarga con sesión persistida) queda pendiente — el usuario la ejecuta directamente. Ver `tasks.md` § Verificación final.

## Dependencias
- `quartz-web/src/features/auth/useAuthStore.ts` y `types/store.ts` (extensión del estado de sesión).
- `quartz-web/src/App.tsx` (`AppRoot`, punto de montaje).
- Asset existente: `quartz-web/public/quartz-name.svg`.
- Ninguna dependencia de otros specs.

## Trazabilidad
- Frontend: quartz-web/src/features/auth/
- Branch:   feat/AUTH-01-welcome-loader
