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

- Archivo nuevo: `quartz-web/src/lib/materialTheme.ts` — `customTheme` para `ThemeProvider`
  (único punto de verdad, en vez de tocar los ~9 formularios uno por uno).
- `quartz-web/src/main.tsx` — `<ThemeProvider value={materialTheme}>`.
- Solo se tocó `fontSize` en el tamaño `md` (el único usado en la app): `text-sm` → `text-xs`
  en el texto escrito/label en reposo de `Input`, `Select` y `Textarea`. No se tocaron alturas,
  paddings ni `lineHeight` (riesgo de descentrar el label sin poder verificarlo visualmente;
  la verificación visual queda para el usuario, según `quartz-web/CLAUDE.md`).
- Valores de origen confirmados contra el paquete publicado `@material-tailwind/react@2.1.10`
  (no se pudo leer `node_modules` localmente por permisos del sandbox).

## Notas
- Con 4 reglas + 1 extra, la rejilla de 2 columnas deja la última fila con 1 elemento; es aceptable (orden de lectura por filas, reglas primero).
- Mantener `transition-colors duration-200` (feedback de estado, sin animación nueva).
- Regla de `quartz-web/CLAUDE.md`: invocar `emil-design-eng`, `impeccable` y `frontend-design` antes de editar.
- Revisar `known-issues.md` del web solo si se añade `Button`/`IconButton` (no es el caso).

## Verificación
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev`: cero errores en consola.
- Manual: `/activar-cuenta?token=…` y Mi cuenta → Cambiar contraseña; marcar reglas al escribir; ancho 320 px y ≥ 640 px; lector de pantalla anuncia estados.
