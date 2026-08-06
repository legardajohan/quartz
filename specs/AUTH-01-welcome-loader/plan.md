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
