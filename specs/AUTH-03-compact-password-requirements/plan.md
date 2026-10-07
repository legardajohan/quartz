# AUTH-03 — Plan técnico

## Archivos
### quartz-web
| Acción | Ruta |
|---|---|
| tocar | `src/components/common/PasswordRequirements.tsx` |

Sin cambios en `src/utils/passwordPolicy.ts`, `ActivateAccountForm.tsx` ni `ChangePasswordForm.tsx` (consumen el componente tal cual; props `password` y `extra` iguales).

## Contratos
Sin cambios de API ni de tipos: `PasswordRequirementProps { met, label }` y `PasswordRequirementsProps { password, extra? }` se mantienen.

### Estilo (Tailwind, sin `style={{}}`)
| Elemento | Hoy | Nuevo |
|---|---|---|
| `<ul>` | `space-y-1.5` | `grid grid-cols-1 gap-x-4 gap-y-0.5 sm:grid-cols-2` |
| `<li>` | `gap-2 text-sm` | `gap-1.5 text-xs` |
| Icono | `h-3.5 w-3.5` | `h-3 w-3` (pendiente conserva `scale-75`) |

## Adición fuera del plan original (solicitada por el usuario durante la implementación)
El usuario pidió además revisar el tamaño de texto de los `Input`/`Select`/`Textarea` de Material
Tailwind en toda la app (percibidos como grandes frente al resto de la UI compactada en AUTH-03).
No hay spec propio para esto; se implementó en la misma rama a petición explícita.

- Primer intento: `quartz-web/src/lib/materialTheme.ts` — `customTheme` para `ThemeProvider`,
  bajando `fontSize` de `md` (único tamaño usado en la app) de `text-sm` a `text-xs` en
  `Input`/`Select`/`Textarea`. **Revertido**: el usuario probó la app y reportó que el texto
  quedó "muy pequeño". Se eliminó `materialTheme.ts` y se devolvió `main.tsx` a
  `<ThemeProvider>` sin `value`, es decir, texto `text-sm` (14px, el default de la librería)
  en todos los `Input`/`Select`/`Textarea` de la app — el tamaño que ya tenían antes de esta
  spec. El problema real de "inputs grandes" resultó ser el `Input`/`Button` propios de
  `/login` (ver más abajo), no el default de Material Tailwind.
- Primer intento: ajustar solo tipografía de `quartz-web/src/components/ui/Input.tsx` (usado solo
  por `/login`). Insuficiente — el usuario reportó que `/login` seguía "raro": ese `Input` y el
  `Button` de `components/ui/` **no son** de Material Tailwind (son `<input>`/`<label>`/`<button>`
  a mano), con proporciones completamente distintas al resto de la app (`h-12`, `text-xl`,
  `rounded-3xl`, sin `uppercase`/`font-bold`) — el tema de `ThemeProvider` no los alcanza y nunca
  los alcanzaría por mucho que se ajustara solo el `fontSize`.
- Solución definitiva: `LoginPanel.tsx` reescrito para usar `Input`/`Button` **de Material
  Tailwind** (mismo patrón que `ActivateAccountForm.tsx`/`PasswordField.tsx`: `color="purple"`,
  ícono de ojo inline igual que `PasswordField`, `Button variant="gradient" color="purple"
  fullWidth loading`). Encabezado (`text-4xl`/barra rosa/`text-lg`) alineado al de
  `ActivateAccountForm.tsx` para que ambas pantallas del flujo de auth luzcan consistentes.
- `components/ui/Input.tsx` quedó sin consumidores tras el cambio → eliminado, junto con
  `components/icons/EyeIcon.tsx`/`EyeSlashIcon.tsx` (solo los usaba `LoginPanel.tsx`) y sus
  exports en los barrels (`components/ui/index.tsx`, `components/icons/index.tsx`).
  `components/ui/Button.tsx` **no** se tocó ni se eliminó: `ActivateAccountForm.tsx` lo sigue
  usando y no estaba en el alcance pedido (solo `/login`); queda con la misma desproporción
  (`text-xl`, `h-12`, `rounded-3xl`) por si se decide alinearlo después.
- `LoginPage.tsx`: con el formulario ya compacto, el `min-h-[600px]` original de la tarjeta
  (`flex flex-col md:flex-row ...`) quedaba muy por encima de lo que el contenido necesita
  (~450px) y estiraba también el panel izquierdo (`PresentationPanel`, `flex-1`) a esa misma
  altura en todos los tamaños de pantalla — incluido móvil, donde no había prefijo `md:` y el
  panel de imagen se forzaba a 600px incluso apilado. Cambiado a `md:min-h-[480px]
  md:max-h-[560px]` (sin restricción en móvil, donde el contenido manda). El fondo del panel
  (`bg-cover bg-center`) ya recorta/ajusta automáticamente a cualquier alto de contenedor, así
  que no requirió cambios propios.

## Notas
- Con 4 reglas + 1 extra, la rejilla de 2 columnas deja la última fila con 1 elemento; es aceptable (orden de lectura por filas, reglas primero).
- Mantener `transition-colors duration-200` (feedback de estado, sin animación nueva).
- Regla de `quartz-web/CLAUDE.md`: invocar `emil-design-eng`, `impeccable` y `frontend-design` antes de editar.
- Revisar `known-issues.md` del web solo si se añade `Button`/`IconButton` (no es el caso).

## Verificación
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev`: cero errores en consola.
- Manual: `/activar-cuenta?token=…` y Mi cuenta → Cambiar contraseña; marcar reglas al escribir; ancho 320 px y ≥ 640 px; lector de pantalla anuncia estados.
