---
id: AUTH-03-compact-password-requirements
feature: compact-password-requirements
status: implemented        # draft | approved | implemented | released
created: 2026-10-06
---

# AUTH-03 — Checklist de contraseña compacto (spec)

## Objetivo
Reducir el alto del checklist de requisitos de contraseña (activación de cuenta y cambio de contraseña) sin cambiar la política ni su comportamiento.

## Alcance
**Incluye:**
- Rediseño visual del componente compartido `PasswordRequirements` (más pequeño y en rejilla).
- Aplica a `ActivateAccountForm` y `ChangePasswordForm`.

**Fuera:**
- Cambiar `PASSWORD_RULES`, `strongPasswordSchema` o los textos de las reglas.
- Cambios de backend.

## Criterios de aceptación (EARS)
- [x] El checklist usa texto `text-xs`, iconos `h-3 w-3` y separación vertical reducida (`gap-y-0.5`).
- [x] En ≥ `sm` las reglas se muestran en 2 columnas; en móvil, en 1 columna.
- [x] Los requisitos extra de cada formulario ("Las dos contraseñas coinciden", "Distinta de la contraseña actual") se muestran con el mismo estilo compacto.
- [x] El bloque ocupa aproximadamente la mitad del alto actual con los 5 requisitos de la pantalla de activación.
- [x] Los estados cumplido/pendiente conservan color (verde-700 / gris-600, contraste ≥ 4.5:1), icono `Check`/`Circle` y el texto `sr-only` "(cumplido)"/"(pendiente)".
- [x] El contenedor conserva `aria-live="polite"`.
- [x] A 320 px de ancho no hay desbordamiento horizontal.
- [x] `npm run build && npm run lint` sin errores nuevos en `quartz-web`.
- [x] **Aislamiento:** no aplica (cambio puramente visual, sin acceso a datos).

## Dependencias
- USR-04 (política de contraseña y formulario de activación), USR-03 (cambio de contraseña).

## Trazabilidad
- Frontend: `quartz-web/src/components/common/PasswordRequirements.tsx`
- Branch:   `feat/AUTH-03-compact-password-requirements`
