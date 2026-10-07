# AUTH-03 — Tasks

## Preparación
- [x] Rama `feat/AUTH-03-compact-password-requirements` (base: `feat/USR-06-bulk-import-fixes`, a pedido explícito del usuario, no `develop`)

## Frontend (`quartz-web`)
- [x] Invocar skills `emil-design-eng`, `impeccable`, `frontend-design`
- [x] `components/common/PasswordRequirements.tsx` — `ul` en rejilla (1 col móvil / 2 col ≥ `sm`), `li` `text-xs gap-1.5`, icono `h-3 w-3`; conservar `aria-live`, `sr-only` y colores

## Adición fuera del plan (a pedido del usuario)
- [x] ~~`src/lib/materialTheme.ts` — `customTheme` para Input/Select/Textarea (`fontSize` `text-xs`)~~
      revertido: el usuario lo probó y pidió aumentar el tamaño de nuevo → archivo eliminado,
      `main.tsx` vuelve a `<ThemeProvider>` sin `value` (texto `text-sm`, el default)
- [x] `features/auth/components/LoginPanel.tsx` reescrito con `Input`/`Button` de Material
      Tailwind (el `Input`/`Button` propios de `components/ui/` no eran alcanzables por el tema
      y tenían proporciones muy distintas: `h-12`, `text-xl`, `rounded-3xl`); encabezado alineado
      con `ActivateAccountForm.tsx`
- [x] Eliminados `components/ui/Input.tsx`, `components/icons/EyeIcon.tsx`,
      `components/icons/EyeSlashIcon.tsx` (sin consumidores tras el cambio) y sus exports en
      los barrels

## Verificación final
- [x] `npm run build && npm run lint` sin errores nuevos (`quartz-web`)
- [x] Web arranca sin errores de compilación ni runtime
- [ ] Recorrido manual de `plan.md` → Verificación (activación y cambio de contraseña, 320 px y ≥ 640 px) — pendiente de que el usuario lo confirme visualmente

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
