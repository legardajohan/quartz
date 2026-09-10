# Incidentes conocidos — quartz-web

Registro puntual de bugs no obvios encontrados en el frontend, para no repetirlos en
futuras implementaciones. No es un changelog: solo entran aquí defectos cuya causa no
se deduce mirando el código a simple vista.

---

## Material Tailwind: el ripple de `Button`/`IconButton` rompe `position` con estilos inline

**Fecha:** 2026-09 · **Componentes afectados:** `Dashboard.tsx`, `SidebarMenu.tsx`
**Síntoma:** al hacer clic por primera vez en un botón, este "saltaba" unos píxeles o
dejaba de comportarse como flotante; el contenido de la página (el header con el nombre
de la institución y el usuario) se corría hacia abajo. Pasaba una sola vez por botón —
después del primer clic quedaba "estable" (mal, pero estable).

**Causa raíz:** `@material-tailwind/react` usa la librería `material-ripple-effects`
para el efecto de onda al hacer clic en `Button`/`IconButton` (activo por defecto,
`ripple: true`). Su función `create()` corre en cada `mousedown` y hace esto, **sin
revertirlo nunca**:

```js
// node_modules/material-ripple-effects/index.js
create(event, color) {
  const element = event.currentTarget;
  element.style.position = 'relative';   // <- inline, permanente
  element.style.overflow = 'hidden';      // <- inline, permanente
  ...
}
```

Un estilo puesto así (`element.style.x = ...`, vía DOM API) es **inline** y gana
siempre sobre cualquier clase de Tailwind (`fixed`, `absolute`, `sticky`, ...), sin
importar especificidad. Si el botón dependía de esa clase de posición para su propio
layout (no solo como contenedor del ripple), la rompe para siempre en cuanto el usuario
lo toca por primera vez.

En este proyecto rompía:
- El botón "Abrir menú" (`fixed top-4 left-4` en `Dashboard.tsx`): perdía `fixed`, pasaba
  a ocupar espacio real en el flujo del documento y empujaba el header hacia abajo.
- El botón de colapsar sidebar (`absolute top-1/2 right-0...` en `SidebarMenu.tsx`):
  perdía `absolute`, pasaba a ser un item más de la fila flex y la ensanchaba.

**Fix aplicado:** `ripple={false}` en esos dos `IconButton` puntuales.

**Regla general para el resto del proyecto:** cualquier `Button`/`IconButton` de
Material Tailwind cuyas clases de Tailwind incluyan `fixed`, `absolute` o `sticky`
para su **propio** posicionamiento (no solo `relative` como contenedor de otra cosa)
**debe** llevar `ripple={false}`. Si el botón es un elemento normal de flujo (la
mayoría: botones dentro de formularios, tablas, listas), el ripple es inofensivo y
puede dejarse activo.

**Cómo se diagnosticó:** los síntomas visuales (desalineaciones que aparecían "solo a
veces", sin errores de consola) llevaron por dos iteraciones a intentar arreglos de CSS
(alturas fijas, `will-change-transform`) que no atacaban la causa real. Se confirmó
inspeccionando en vivo con DevTools (`getAttribute('style')` sobre el botón después de
un clic) hasta encontrar el `style="position: relative; overflow: hidden;"` inyectado.
Moraleja: ante un salto de layout "solo la primera vez que se interactúa con un
elemento, nunca más después", sospechar de una librería que muta el DOM directamente
por fuera de React (ripples, tooltips, medidores de texto), no solo de las clases CSS
declaradas.
