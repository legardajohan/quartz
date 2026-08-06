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
- Overlay `fixed inset-0` a pantalla completa sobre fondo siempre claro: logo (`public/quartz-name.svg`) con animación de entrada, aura difusa, barrido de brillo (sheen) único, tagline y barra de progreso indeterminada.
- El logo lleva siempre el relleno de degradado arcoíris animado (clase compartida `.quartz-rainbow-fill`, `components/common/rainbow-fill.css`) — no es una variante de tema, es el único estado visual (ver Addendum 2026-08-06 en `plan.md`).
- Fade-out automático tras una duración fija configurable (default 2200ms).
- Variante para `prefers-reduced-motion: reduce` (sin animaciones, contenido visible de inmediato).
- Disparo automático tras cada login exitoso (`useAuthStore.login()`), sin acción del usuario.
- Componente adicional `components/common/PoweredByBrand.tsx`: mismo logo con el mismo efecto arcoíris permanente, a tamaño reducido, montado en el pie del menú lateral (`SidebarMenu.tsx`) con la leyenda "Powered by".
- `PresentationPanel.tsx` (panel del login): el logo + nombre de Quartz se reemplazan por el lockup `public/quartz-name-v.svg` con el mismo relleno arcoíris permanente (ver Addendum 2026-08-06 (2) en `plan.md`).
- `SidebarMenu.tsx`, parte superior: esquema de branding White Label — escudo de la institución inquilina (o ícono por defecto si no lo ha subido) + nombre en dos líneas ("Institución Educativa" / nombre real), en vez del logo de Quartz. Nuevo endpoint `GET /institutions/me/branding` (`Jefe de Área` y `Docente`) — ver Addendum 2026-08-06 (2) en `plan.md`.

**Fuera:**
- Toggle de tema manual o infraestructura general de modo claro/oscuro (Quartz no la tiene hoy; ver `useAuthStore.ts`/`tailwind.config.ts`). El splash y la marca del sidebar ya no dependen de `prefers-color-scheme` (ver Addendum 2026-08-06 en `plan.md`).
- Mostrar el splash en otros eventos de sesión (logout, refresh de token, recarga de página con sesión persistida).
- Contenido o copy configurable más allá de `tagline` (sin CMS, sin i18n).
- Tests automatizados (no hay runner de tests en el proyecto todavía).

## Criterios de aceptación (EARS)
- [x] Cuando `useAuthStore.login()` autentica correctamente, el sistema activa `showWelcomeLoader` y el overlay se monta a pantalla completa (`z-index` por encima de cualquier contenido de la app). (`useAuthStore.ts` rama de éxito de `login()`; `#quartz-loader-wrapper` con `z-index: 9999`)
- [x] Cuando el overlay lleva montado `durationMs` (default 2200ms), el sistema inicia el fade-out y, al terminar la transición, desmonta el overlay (`dismissWelcomeLoader`). (`WelcomeLoader.tsx`: `setTimeout(..., durationMs + FADE_OUT_MS)`, `FADE_OUT_MS=320` alineado con `quartzWelcome-fadeOut` en el CSS)
- [x] Cuando el login falla, el sistema no activa `showWelcomeLoader` (el flag permanece `false`). (rama `catch` de `login()` no lo toca; nunca se activó)
- [x] Si el usuario recarga la página con una sesión ya persistida (`token`/`sessionData` rehidratados desde `localStorage`), el sistema NO vuelve a mostrar el overlay (`showWelcomeLoader` no se persiste, arranca en `false`). (`partialize` de `useAuthStore.ts` solo persiste `token`/`sessionData`)
- [x] Cuando el usuario cierra sesión (`logout()`), el sistema deja `showWelcomeLoader` en `false`. (`logout()` lo incluye en su `set`)
- [x] Si el sistema operativo del usuario tiene `prefers-reduced-motion: reduce`, el overlay se muestra sin animaciones (contenido con opacidad final desde el primer frame) y el fade-out sigue ocurriendo tras `durationMs`. (`@media (prefers-reduced-motion: reduce)` en `WelcomeLoader.css`; el fade-out del wrapper se conserva por ser solo `opacity`)
- [x] ~~Si el sistema operativo del usuario tiene `prefers-color-scheme: dark`, el logo se renderiza con el relleno de degradado animado...~~ — **Retirado en el Addendum 2026-08-06**: el relleno arcoíris ya no es una variante de `prefers-color-scheme`, es el único estado visual del logo, siempre, sobre fondo siempre claro.
- [x] El overlay se navega en paralelo (no bloquea) la redirección existente a `/dashboard` en `LoginPage.tsx`: el dashboard se monta detrás del overlay mientras este permanece visible. (`AppRoot` en `App.tsx` monta el overlay junto al `<Outlet/>`, sin tocar `LoginPage.tsx`)
- [x] Cuando el menú lateral (`SidebarMenu.tsx`) está montado, el sistema muestra en su pie la leyenda "Powered by" y el logo de Quartz con el relleno arcoíris animado, sin bloquear el scroll del menú de navegación. (`PoweredByBrand.tsx`/`.css`; `List` con `flex-1 overflow-y-auto`)
- [x] **Aislamiento:** no aplica — feature puramente de UI/animación, sin lectura ni escritura de datos de tenant, sin llamadas a backend.
- [x] `npx tsc --noEmit` no aplica (no toca `quartz-api`). `npm run build && npm run lint` en verde en `quartz-web`. (build verde; lint con los mismos 10 errores/7 warnings preexistentes en la base, confirmado con `git stash` — cero regresiones)

> Nota: los criterios anteriores están verificados por lectura de código + build/lint en verde y arranque limpio de ambos servidores. La prueba manual end-to-end en navegador (ver el splash renderizado, alternar `prefers-color-scheme`/`prefers-reduced-motion`, recarga con sesión persistida) queda pendiente — el usuario la ejecuta directamente. Ver `tasks.md` § Verificación final.

- [x] Cuando el `PresentationPanel` del login se monta, el sistema muestra el lockup `quartz-name-v.svg` con el relleno arcoíris animado, sin el logo/nombre de Quartz anteriores. (`PresentationPanel.tsx`/`.css`)
- [x] Cuando `SidebarMenu` se monta, el sistema obtiene el branding de la institución del inquilino del token (`GET /institutions/me/branding`, `Jefe de Área` y `Docente`) y muestra su escudo (o el ícono por defecto si no ha subido uno) y su nombre en dos líneas. Si la imagen del escudo falla al cargar, cae al ícono por defecto. (`InstitutionBrand.tsx`, `institution.service.ts#getInstitutionBranding`)
- [x] **Aislamiento (branding):** `getInstitutionBranding` filtra por `institutionId` del token; ninguna institución ve el escudo/nombre de otro inquilino. (`institution.service.ts`)

## Dependencias
- `quartz-web/src/features/auth/useAuthStore.ts` y `types/store.ts` (extensión del estado de sesión).
- `quartz-web/src/App.tsx` (`AppRoot`, punto de montaje).
- Asset existente: `quartz-web/public/quartz-name.svg`.
- Ninguna dependencia de otros specs.

## Trazabilidad
- Frontend: quartz-web/src/features/auth/
- Branch:   feat/AUTH-01-welcome-loader
