# AUTH-01 — Plan técnico

## Archivos
### quartz-web
| Acción | Ruta |
|---|---|
| crear | `src/features/auth/components/WelcomeLoader.tsx` |
| crear | `src/features/auth/components/WelcomeLoader.css` |
| tocar | `src/features/auth/types/store.ts` |
| tocar | `src/features/auth/useAuthStore.ts` |
| tocar | `src/App.tsx` |

## Contratos

### Tipos — `src/features/auth/types/store.ts`
`AuthState` gana:
```typescript
export interface AuthState {
  // ...campos existentes sin cambios (token, sessionData, isLoading, error)
  showWelcomeLoader: boolean;

  // ...acciones existentes sin cambios (login, logout, clearError, refreshUser, setSubjects, setPeriods, setEnabledReports)
  dismissWelcomeLoader: () => void;
}
```

### Store — `src/features/auth/useAuthStore.ts`
- Estado inicial: `showWelcomeLoader: false`.
- `login()`, rama de éxito (dentro del `try`, junto al `set({ token, sessionData, isLoading: false, error: null })`): añadir `showWelcomeLoader: true` al mismo `set`.
- `login()`, rama de error (`catch`): sin cambios (no toca `showWelcomeLoader`; permanece `false` porque nunca se activó).
- `logout()`: añadir `showWelcomeLoader: false` al `set` existente.
- Nueva acción `dismissWelcomeLoader: () => set({ showWelcomeLoader: false })`.
- `partialize` (persistencia): sin cambios — sigue devolviendo solo `{ token, sessionData }`. `showWelcomeLoader` es efímero por diseño (así se cumple el criterio de "no reaparece tras recargar con sesión persistida").

### Componente — `src/features/auth/components/WelcomeLoader.tsx`
Presentacional puro, sin `apiClient`. Named export (sigue el patrón de `LoginPanel.tsx`/`PresentationPanel.tsx`, ninguno de los cuales es `pages/`).
```typescript
export interface WelcomeLoaderProps {
  tagline?: string;
  durationMs?: number;
  onComplete?: () => void;
}

export function WelcomeLoader({
  tagline = 'Preparando tu espacio…',
  durationMs = 2200,
  onComplete,
}: WelcomeLoaderProps): React.ReactElement;
```
- `useEffect` con `setTimeout(() => onComplete?.(), durationMs + FADE_OUT_MS)` + cleanup, donde `FADE_OUT_MS = 320` (constante local, debe coincidir con la duración de `quartzWelcome-fadeOut` en el CSS). Ajuste respecto al ejemplo original: ahí el timer usaba solo `durationMs`, lo que desmontaba el componente en el instante en que el fade-out apenas empezaba a reproducirse (hallado en la revisión con `emil-design-eng`) — aquí se espera a que la transición de salida termine antes de desmontar.
- `width` y `accentColor` del ejemplo **no** se exponen como props: se fijan como constantes/CSS del propio componente (un solo consumidor, sin necesidad de configurarlos desde fuera — evita sobre-diseño).
- Estructura JSX (misma jerarquía que el ejemplo, adaptada):
```jsx
<div id="quartz-loader-wrapper" style={{ '--quartz-welcome-duration': `${durationMs}ms` }}>
  <div className="boot-overlay">
    <div className="boot-overlay__logo" role="img" aria-label="Quartz">
      <div className="boot-overlay__aura quartz-rainbow-fill" aria-hidden="true" />
      <img className="boot-overlay__art" src="/quartz-name.svg" alt="" draggable={false} />
      <div className="boot-overlay__fill quartz-rainbow-fill" aria-hidden="true" />
      <div className="boot-overlay__sheen" />
    </div>
    <p className="boot-overlay__tagline">{tagline}</p>
    <div className="boot-overlay__progress"><span /></div>
  </div>
</div>
```
- El `style` inline solo transporta `--quartz-welcome-duration` (custom property dependiente de una prop en runtime) — misma excepción puntual que `LoginPage.tsx:43-48`, no un patrón nuevo de uso libre de `style={{}}`.

### Estilos — `src/features/auth/components/WelcomeLoader.css`
Port 1:1 de la lógica del ejemplo (`SofiAppWelcomeLoader.css` + `rainbow-fill.css` fusionados en un solo archivo, ya que solo hay un consumidor), con estos cambios obligatorios respecto al original:

| Original (`sofia-*`) | Quartz | Motivo |
|---|---|---|
| `#sofiapp-loader-wrapper` | `#quartz-loader-wrapper` | Namespacing del feature |
| `.boot-overlay*` | igual (sin prefijo de producto) | Ya es genérico |
| `--sofia-welcome-width: clamp(200px, 26vw, 340px)` | `--quartz-welcome-width: clamp(220px, 30vw, 420px)` | `quartz-name.svg` es más ancho/plano (ratio 8.56:1 vs 3.82:1); un ancho mayor evita que el wordmark se vea diminuto en alto |
| `aspect-ratio: 769.21 / 201.38` | `aspect-ratio: 551.23 / 64.38` | Proporción real de `quartz-name.svg` (viewBox) |
| `--sofia-welcome-tint: 88, 45, 203` | `--quartz-welcome-tint: 40, 45, 104` | RGB de `#282d68`, color de trazo dominante del logo real (en vez del morado de marca de Sofia) |
| `--sofia-lockup-mask: url("data:image/svg+xml,...")` (SVG incrustado en base64/URL-encoded) | `--quartz-lockup-mask: url("/quartz-name.svg")` | El asset ya vive en `public/`; no hace falta incrustarlo — simplificación real respecto al ejemplo (el ejemplo lo incrustaba porque su componente vivía en un subárbol DOM sin acceso al pipeline de assets) |
| Selector `.dark #sofiapp-loader-wrapper { ... }` (y variantes `.dark .boot-overlay__*`) | `@media (prefers-color-scheme: dark) { #quartz-loader-wrapper { ... } }` (mismo bloque interno, sin cambiar reglas) | Quartz no tiene clase `.dark` ni theme store (decisión confirmada con el usuario) — se activa por preferencia del SO, cero infraestructura nueva |
| Import separado `rainbow-fill.css` con clase `.sofia-rainbow-fill` | Clase `.quartz-rainbow-fill` definida al final del mismo archivo | Un solo consumidor; no se justifica un segundo archivo |
| `animation-delay: var(--sofia-welcome-duration, 2200ms)` en el wrapper (fade-out) | `animation-delay: var(--quartz-welcome-duration, 2200ms)` | Ídem, variable renombrada |
| Resto de keyframes (`*-logoIn`, `*-singleSweep`, `*-tagIn`, `*-progressSlide`, `*-fadeOut`) | Mismos nombres con prefijo `quartzWelcome-` en vez de `sofiaWelcome-` | Evitar colisión de nombres globales de `@keyframes` (CSS no tiene scope de módulo) |
| Bloque `@media (prefers-reduced-motion: reduce)` | Igual, sin cambios de lógica | Ya es un estándar de accesibilidad, no específico de Sofia |

`.quartz-rainbow-fill` (recreación — el `rainbow-fill.css` original no fue compartido, solo referenciado):
```css
.quartz-rainbow-fill {
  background: linear-gradient(120deg, rgb(88, 45, 203), rgb(40, 45, 104), rgb(37, 99, 235), rgb(88, 45, 203));
  background-size: 300% 300%;
  animation: quartzWelcome-rainbowShift 3.2s ease-in-out infinite;
}
@keyframes quartzWelcome-rainbowShift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@media (prefers-reduced-motion: reduce) {
  .quartz-rainbow-fill { animation: none; background-position: 50% 50%; }
}
```
Nota: esta parte es la única sin una referencia exacta; en implementación se ajusta a ojo contra el resultado visual real del `mask-image` (que ninguno de los dos hemos visto renderizado) — ver `tasks.md` para el paso de verificación manual dedicado.

### Integración — `src/App.tsx`
`AppRoot`, sin cambiar su forma general:
```tsx
const AppRoot = () => {
  const showWelcomeLoader = useAuthStore((s) => s.showWelcomeLoader);
  const dismissWelcomeLoader = useAuthStore((s) => s.dismissWelcomeLoader);

  return (
    <>
      <Outlet />
      {showWelcomeLoader && <WelcomeLoader onComplete={dismissWelcomeLoader} />}
      <Toaster ... /> {/* sin cambios */}
    </>
  );
};
```
Import nuevo: `import { useAuthStore } from './features/auth/useAuthStore';` y `import { WelcomeLoader } from './features/auth/components/WelcomeLoader';`.

## Notas
1. **Por qué `useAuthStore` y no un store de UI nuevo.** No existe precedente de store global de UI en el proyecto; `useAuthStore` ya es "la fuente de verdad de sesión" (`quartz-web/CLAUDE.md`) y el disparo del splash está 1:1 acoplado al evento de login exitoso — extenderlo ahí es más simple que introducir un patrón nuevo para un único flag booleano.
2. **Por qué no retrasar la navegación.** `LoginPage.tsx` no se toca: su `useEffect` sigue navegando a `/dashboard` en cuanto `token` existe. El overlay vive en `AppRoot`, que persiste a través del cambio de ruta, así que el dashboard se monta detrás mientras el splash sigue visible — igual que el comportamiento documentado en los comentarios del ejemplo original ("en producción el destino real ya está montado detrás").
3. **`quartz-name.svg` no es monocromático.** Sus `path` ya traen degradado propio (`#242a5a` → `#9f2c87`) vía `<linearGradient>` interno. En modo claro se ve tal cual (como el ejemplo, que también muestra "colores nativos del SVG" en claro). El `mask-image` para el modo oscuro usa solo el canal alfa del render del SVG (la forma), ignorando sus colores internos — por eso funciona igual de bien aunque el original fuera monocromático y este no.
4. **Duración y tagline por defecto.** Se mantiene `2200ms` del ejemplo. Tagline default en español acorde al resto de la app: `"Preparando tu espacio…"` (ajustable vía prop si se pide otro copy en revisión).

## Verificación
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev` en `quartz-web`: cero errores en consola.
- Login manual en navegador: aparece el overlay, se ve el logo con la animación de entrada, tagline y barra de progreso, y hace fade-out solo tras ~2.2s dejando ver el dashboard ya cargado detrás.
- Alternar el SO a modo oscuro (o emular `prefers-color-scheme: dark` en DevTools) y repetir el login: el logo debe verse con el relleno de degradado animado en vez de sus colores nativos.
- Emular `prefers-reduced-motion: reduce` en DevTools y repetir el login: el overlay aparece sin animaciones y sigue desapareciendo tras `durationMs`.
- Recargar la página con sesión ya iniciada (F5 en `/dashboard`): el overlay NO debe reaparecer.

## Addendum 2026-08-06 — fondo siempre claro + marca "Powered by" en el sidebar

Ajuste post-implementación pedido directamente por el usuario, mismo feature (aún `implemented`, no `released`), misma rama. El usuario compartió el contenido real de `rainbow-fill.css` (antes solo referenciado, no compartido — ver Nota original arriba) y pidió: (1) que el `WelcomeLoader` deje de alternar entre logo nativo (claro) y relleno arcoíris (oscuro), y en su lugar muestre **siempre** el relleno arcoíris sobre fondo **siempre claro**; (2) un componente nuevo, solo el logo con el mismo efecto arcoíris permanente, para el pie del menú lateral ("Powered by" + logo).

### Archivos (adicionales a los ya listados)
| Acción | Ruta |
|---|---|
| crear | `src/components/common/rainbow-fill.css` |
| crear | `src/components/common/PoweredByBrand.tsx` |
| crear | `src/components/common/PoweredByBrand.css` |
| tocar | `src/features/auth/components/WelcomeLoader.tsx` |
| tocar | `src/features/auth/components/WelcomeLoader.css` |
| tocar | `src/components/layouts/SidebarMenu.tsx` |

### Cambios

**1. `components/common/rainbow-fill.css` (nuevo, compartido).** Puerto 1:1 del `rainbow-fill.css` real que compartió el usuario: `linear-gradient(90deg, #ff1f5a, #b81fff, #5a3bff, #0a9bff, #16c46a, #ffc21a, #ff7a1a, #ff1f5a)`, `background-size: 200% 100%`, `@keyframes quartz-rainbow` (`0%→100%` de `background-position: 0% 50%` a `200% 50%`), `8s linear infinite`. Única diferencia respecto al original: el original solo animaba bajo `.dark` (Quartz no tiene esa clase); aquí la animación es **incondicional**, porque el efecto pasa a ser el estado permanente de la marca, no una variante de tema. `@media (prefers-reduced-motion: reduce)` se conserva (`animation: none`). Reemplaza la recreación aproximada (`quartzWelcome-rainbowShift`) documentada en la Nota original de este plan — se elimina.

**2. `WelcomeLoader.tsx`/`.css`.**
- Se quita el `<img className="boot-overlay__art" src="/quartz-name.svg" />` (nunca sería visible: el relleno arcoíris está siempre encima) y su regla CSS.
- `.boot-overlay__fill` pasa a `opacity: 1` fijo (antes `0`, solo `1` bajo `.dark`); `.boot-overlay__aura` pasa a `opacity: 0.75` fijo (antes `0`).
- Se elimina el bloque `@media (prefers-color-scheme: dark)` completo (fondo oscuro, `tagline`/`progress` oscuros) — el fondo del wrapper (`radial-gradient` claro) y los colores de `tagline`/`progress` quedan como único estado, siempre.
- Se elimina la clase local `.quartz-rainbow-fill` y su `@keyframes`; el componente ahora importa `../../../components/common/rainbow-fill.css`.
- El criterio EARS de `spec.md` sobre `prefers-color-scheme: dark` queda **obsoleto** (ver spec.md, marcado como retirado).

**3. `components/common/PoweredByBrand.tsx` + `.css` (nuevo).** Componente presentacional, sin `apiClient`, named export:
```tsx
export function PoweredByBrand(): React.ReactElement {
  return (
    <div id="quartz-brandmark">
      <p className="quartz-brandmark__caption">Powered by</p>
      <div className="quartz-brandmark__logo" role="img" aria-label="Quartz">
        <div className="quartz-brandmark__aura quartz-rainbow-fill" aria-hidden="true" />
        <div className="quartz-brandmark__fill quartz-rainbow-fill" aria-hidden="true" />
      </div>
    </div>
  );
}
```
Mismo mecanismo de máscara que `WelcomeLoader` (`mask-image: url("/quartz-name.svg")`), a tamaño reducido (`width: 104px`, `aspect-ratio: 551.23 / 64.38`), sin `<img>` nativo (el efecto arcoíris es el único estado, igual que en el loader). Caption `"Powered by"` en gris lavanda translúcido (`rgba(216, 196, 255, 0.55)`), pensado para el fondo morado oscuro del sidebar. Importa el mismo `rainbow-fill.css` compartido — el bundler lo deduplica por ruta de módulo, no se duplica CSS en el build final.

**4. `components/layouts/SidebarMenu.tsx`.** El `<Card>` pasa a `flex flex-col`; el `<List>` de navegación gana `flex-1 overflow-y-auto thin-scrollbar` (para que crezca y haga scroll si el menú no cabe, sin empujar el pie); se agrega `<PoweredByBrand />` tras el `</List>`, envuelto en un `<div className="border-t border-white/10">` como separador sutil. `PoweredByBrand` persiste montado mientras dure la sesión (vive dentro de `Dashboard`, que no se remonta entre rutas anidadas).

### Verificación adicional
- `cd quartz-web && npm run build` y `npm run lint` — verdes, mismos 10 errores/7 warnings preexistentes en la base (sin regresiones).
- Pendiente de confirmación visual del usuario en navegador: login muestra el splash con fondo claro y el logo con el arcoíris en movimiento; el sidebar muestra "Powered by" + logo animado en el pie, con scroll independiente del menú si la lista de opciones crece.

## Addendum 2026-08-06 (2) — logo del login + branding White Label del sidebar

Pedido directo del usuario, mismo feature/rama. Dos cambios: (1) el panel de presentación del login deja de mostrar el logo/nombre de Quartz y en su lugar muestra `quartz-name-v.svg` con el mismo relleno arcoíris; (2) la parte superior del sidebar deja de mostrar la marca de Quartz y pasa a mostrar el **branding de la institución inquilina** (escudo o ícono por defecto + nombre), esquema SaaS White Label.

### Archivos
| Acción | Ruta |
|---|---|
| tocar | `quartz-api/src/features/institution/institution.types.ts` |
| tocar | `quartz-api/src/features/institution/institution.service.ts` |
| tocar | `quartz-api/src/features/institution/institution.controller.ts` |
| tocar | `quartz-api/src/features/institution/institution.routes.ts` |
| tocar | `quartz-web/src/features/institution/types/api.ts` |
| tocar | `quartz-web/src/features/institution/types/store.ts` |
| tocar | `quartz-web/src/features/institution/useInstitutionStore.ts` |
| crear | `quartz-web/src/components/common/InstitutionBrand.tsx` |
| tocar | `quartz-web/src/components/layouts/SidebarMenu.tsx` |
| tocar | `quartz-web/src/features/auth/components/PresentationPanel.tsx` |
| crear | `quartz-web/src/features/auth/components/PresentationPanel.css` |

### Backend — `GET /institutions/me/branding` (nuevo)
`GET /institutions/me` (`institution.routes.ts`) ya existe pero está restringido a `Jefe de Área` y devuelve el DTO administrativo completo (email, teléfono, rector, DANE, settings). El sidebar lo necesita para **todos** los roles autenticados del inquilino (`Docente` incluido) pero solo necesita `name`/`shieldUrl` — ampliar `/me` habría expuesto datos administrativos de más a `Docente`. Se agrega un endpoint de solo lectura, mínimo, en su lugar:

```typescript
// institution.types.ts
export interface IInstitutionBrandingDTO { name: string; shieldUrl?: string; }

// institution.service.ts
export const getInstitutionBranding = async (institutionId: string): Promise<IInstitutionBrandingDTO> => {
  const institution = await Institution.findById(institutionId).select('name shieldUrl').lean();
  if (!institution) throw new AppError('Institución no encontrada.', 404);
  return { name: institution.name, shieldUrl: institution.shieldUrl };
};
```

| Método | Ruta | Rol | Middlewares |
|---|---|---|---|
| GET | `/api/institutions/me/branding` | Jefe de Área, Docente | `authenticateJWT → requireTenant → authorize([JEFE_DE_AREA, DOCENTE]) → asyncHandler` |

Controller sin `try/catch`, `institutionId` del token — mismo patrón que el resto del feature.

### Frontend — `useInstitutionStore`
- `types/api.ts` — `InstitutionBrandingDto { name: string; shieldUrl?: string }`.
- `types/store.ts` — `InstitutionState` gana `branding: InstitutionBrandingDto | null` y `fetchBranding: () => Promise<void>`.
- `useInstitutionStore.ts` — `fetchBranding()` llama `GET /institutions/me/branding` (falla en silencio: si no hay branding disponible, el sidebar cae al ícono por defecto, no rompe la UI). `uploadShield()` ahora también actualiza `branding` con el `shieldUrl` nuevo, para que un `Jefe de Área` vea su propio escudo reflejado de inmediato en su sidebar tras subirlo, sin depender de un refetch.

### `components/common/InstitutionBrand.tsx` (nuevo)
Presentacional, hace su propio fetch (`useEffect` → `fetchBranding()` al montar). Escudo en círculo (`h-11 w-11 rounded-full overflow-hidden`, `ring-1 ring-white/20`) o `BuildingLibraryIcon` (heroicons) si no hay `shieldUrl`; si la imagen del escudo falla al cargar (`onError`), cae al mismo ícono. Nombre en dos líneas: caption fija `"Institución Educativa"` (10px, uppercase, `text-purple-300/70`) + `branding.name` (texto real de la institución, p. ej. "Agropecuaria La Planada"; `"Cargando…"` mientras `branding` es `null`). **Sin `font-space`** (esa fuente es exclusiva de la marca Quartz): usa el sans-serif por defecto de Tailwind, igual que el resto del texto de la app.

### `SidebarMenu.tsx`
Se retira el `<img src={aqWhite}>` + `<h1 className="font-space">{appName}</h1>`; el header pasa a `<InstitutionBrand />` + el `IconButton` de colapsar (ahora `shrink-0`, sigue con `ml-auto`). Se retiran los imports `aqWhite` y `appName` (sin uso).

### `PresentationPanel.tsx`/`.css`
Se retira el `<div>` con `backgroundImage: aqWhite` y el `<h1 className="font-space">{appName}</h1>`; se agrega `.presentation-brand__logo` (mismo mecanismo de máscara + `.quartz-rainbow-fill` que `WelcomeLoader`/`PoweredByBrand`), apuntando a `/quartz-name-v.svg` (`aspect-ratio: 461.97 / 164.34`, proporción real de ese SVG — es un lockup más vertical que `quartz-name.svg`). El texto "Evaluando con sentido" se conserva sin cambios.

### Verificación adicional
- `cd quartz-api && npx tsc --noEmit` — verde.
- `cd quartz-web && npm run build && npm run lint` — verdes, mismos 10 errores/7 warnings preexistentes (sin regresiones).
- Pendiente de confirmación visual del usuario en navegador: login con el nuevo lockup animado; sidebar mostrando el escudo real de la institución actual (o el ícono por defecto) + su nombre; como `Docente`, el sidebar debe mostrar el mismo branding sin 403.
