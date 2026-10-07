# AUTH-01 — Tasks

## Frontend (`quartz-web`)
- [x] `features/auth/types/store.ts` — `AuthState` gana `showWelcomeLoader: boolean` y `dismissWelcomeLoader: () => void`.
- [x] `features/auth/useAuthStore.ts` — estado inicial `showWelcomeLoader: false`; `login()` lo pone en `true` en la rama de éxito; `logout()` lo resetea a `false`; nueva acción `dismissWelcomeLoader`. `partialize` sin cambios (flag no persistido).
- [x] `features/auth/components/WelcomeLoader.tsx` — componente presentacional (`WelcomeLoaderProps: { tagline?, durationMs?, onComplete? }`), `setTimeout` + cleanup para `onComplete`, estructura JSX del overlay (logo + aura + fill + sheen + tagline + progreso) apuntando a `/quartz-name.svg`.
- [x] `features/auth/components/WelcomeLoader.css` — port del ejemplo con las sustituciones de `plan.md` § Contratos (namespacing `quartz-*`, `aspect-ratio` real del logo, `mask-image: url("/quartz-name.svg")` sin incrustar datos, `@media (prefers-color-scheme: dark)` en vez de `.dark`, `.quartz-rainbow-fill` recreado, `@media (prefers-reduced-motion: reduce)`).
- [x] `App.tsx` — `AppRoot` lee `showWelcomeLoader`/`dismissWelcomeLoader` de `useAuthStore` y monta `<WelcomeLoader onComplete={dismissWelcomeLoader} />` junto al `<Outlet/>` cuando el flag es `true`.
- [x] Pulido con skills **`emil-design-eng`**, **`impeccable`** y plugin **`frontend-design`** antes de dar por cerrado el componente (obligatorio por `quartz-web/CLAUDE.md` para toda UI nueva). Encontró y corrigió 2 issues reales: (1) `onComplete` desmontaba el overlay en el instante en que el fade-out CSS apenas empezaba (ahora espera `durationMs + FADE_OUT_MS`); (2) `prefers-reduced-motion` suprimía también el fade-out del wrapper (solo `opacity`, sin `transform`) — se conserva porque no induce mareo.

## Verificación final
- [x] `cd quartz-web && npm run build && npm run lint` en verde (lint: mismos 10 errores/7 warnings preexistentes en la base, confirmado con `git stash` — cero regresiones).
- [x] `npm run dev`: servidor arranca sin errores de compilación ni runtime (backend `quartz-api` en :4000 con `MongoDB connected` + `Server running`; frontend `quartz-web` en :5173, Vite listo).
- [ ] Login manual en navegador: overlay aparece, anima entrada del logo + tagline + barra de progreso, hace fade-out tras ~2.2s dejando ver el dashboard ya montado detrás. — **Pendiente, el usuario lo prueba directamente.**
- [ ] Emulando `prefers-reduced-motion: reduce` en DevTools: overlay sin animaciones, sigue desapareciendo tras `durationMs`. — **Pendiente de prueba manual.**
- [ ] Recarga de página con sesión persistida (F5 en `/dashboard`): el overlay NO reaparece. — **Pendiente de prueba manual.**
- [ ] Login fallido (credenciales incorrectas): el overlay NO aparece. — **Pendiente de prueba manual.**
- [ ] Logout: `showWelcomeLoader` queda en `false` (siguiente login sí vuelve a mostrarlo). — **Pendiente de prueba manual.**

## Definición de "hecho"
Todos los criterios EARS de `spec.md` cubiertos y marcados · `status: implemented`.

## Addendum 2026-08-06 — fondo siempre claro + marca "Powered by" en el sidebar
- [x] `components/common/rainbow-fill.css` — puerto 1:1 del `rainbow-fill.css` real compartido por el usuario (`quartz-rainbow`, 8s linear infinite, incondicional — ya no depende de `.dark`).
- [x] `features/auth/components/WelcomeLoader.tsx` — se quita el `<img>` nativo (el arcoíris es el único estado); importa el `rainbow-fill.css` compartido.
- [x] `features/auth/components/WelcomeLoader.css` — `.boot-overlay__fill`/`__aura` a opacidad fija (1 / 0.75); se elimina el bloque `@media (prefers-color-scheme: dark)` y la clase local `.quartz-rainbow-fill` recreada.
- [x] `components/common/PoweredByBrand.tsx` + `.css` (nuevo) — logo con el mismo efecto arcoíris permanente, a tamaño reducido, con la leyenda "Powered by".
- [x] `components/layouts/SidebarMenu.tsx` — `Card` en `flex flex-col`, `List` con `flex-1 overflow-y-auto thin-scrollbar`, `<PoweredByBrand />` montado en el pie tras un separador (`border-t border-white/10`).
- [x] `cd quartz-web && npm run build && npm run lint` — verdes, mismos 10 errores/7 warnings preexistentes (sin regresiones).
- [ ] Confirmación visual del usuario en navegador: splash con fondo claro + arcoíris en movimiento; sidebar con "Powered by" + logo animado en el pie. — **Pendiente, sin herramienta de navegador con sesión autenticada en este entorno.**

## Addendum 2026-08-06 (2) — logo del login + branding White Label del sidebar
- [x] `institution.types.ts` — `IInstitutionBrandingDTO { name, shieldUrl? }`.
- [x] `institution.service.ts` — `getInstitutionBranding(institutionId)`, scoped, `.select('name shieldUrl').lean()`, `AppError(404)` si no existe.
- [x] `institution.controller.ts` — `getMyInstitutionBrandingController` (sin `try/catch`, `institutionId` del token).
- [x] `institution.routes.ts` — `GET /me/branding` con `authorize([JEFE_DE_AREA, DOCENTE])`.
- [x] `institution/types/api.ts` y `types/store.ts` (web) — `InstitutionBrandingDto`, `InstitutionState.branding`/`fetchBranding`.
- [x] `useInstitutionStore.ts` — `fetchBranding()` (falla en silencio); `uploadShield()` sincroniza `branding` con el nuevo `shieldUrl`.
- [x] `components/common/InstitutionBrand.tsx` (nuevo) — escudo circular o `BuildingLibraryIcon` por defecto (con fallback en `onError`), nombre en dos líneas, sin `font-space`.
- [x] `SidebarMenu.tsx` — reemplaza el logo/nombre de Quartz por `<InstitutionBrand />`; quita imports `aqWhite`/`appName` sin uso.
- [x] `PresentationPanel.tsx`/`.css` (nuevo) — reemplaza el logo/nombre de Quartz por el lockup `quartz-name-v.svg` con `.quartz-rainbow-fill`.
- [x] `cd quartz-api && npx tsc --noEmit` — verde.
- [x] `cd quartz-web && npm run build && npm run lint` — verdes, mismos 10 errores/7 warnings preexistentes (sin regresiones).
- [ ] Confirmación visual del usuario en navegador: login con el nuevo lockup; sidebar con escudo/nombre real de la institución (o ícono por defecto); verificar como `Docente` que no da 403. — **Pendiente, sin herramienta de navegador con sesión autenticada en este entorno.**
