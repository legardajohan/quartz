# AUTH-03 — Tasks

## Preparación
- [ ] Rama `feat/AUTH-03-compact-password-requirements` (base según estado de `develop`)

## Frontend (`quartz-web`)
- [ ] Invocar skills `emil-design-eng`, `impeccable`, `frontend-design`
- [ ] `components/common/PasswordRequirements.tsx` — `ul` en rejilla (1 col móvil / 2 col ≥ `sm`), `li` `text-xs gap-1.5`, icono `h-3 w-3`; conservar `aria-live`, `sr-only` y colores

## Verificación final
- [ ] `npm run build && npm run lint` sin errores nuevos (`quartz-web`)
- [ ] Web arranca sin errores de compilación ni runtime
- [ ] Recorrido manual de `plan.md` → Verificación (activación y cambio de contraseña, 320 px y ≥ 640 px)

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
