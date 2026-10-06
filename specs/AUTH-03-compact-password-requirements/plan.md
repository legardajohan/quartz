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

## Notas
- Con 4 reglas + 1 extra, la rejilla de 2 columnas deja la última fila con 1 elemento; es aceptable (orden de lectura por filas, reglas primero).
- Mantener `transition-colors duration-200` (feedback de estado, sin animación nueva).
- Regla de `quartz-web/CLAUDE.md`: invocar `emil-design-eng`, `impeccable` y `frontend-design` antes de editar.
- Revisar `known-issues.md` del web solo si se añade `Button`/`IconButton` (no es el caso).

## Verificación
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev`: cero errores en consola.
- Manual: `/activar-cuenta?token=…` y Mi cuenta → Cambiar contraseña; marcar reglas al escribir; ancho 320 px y ≥ 640 px; lector de pantalla anuncia estados.
