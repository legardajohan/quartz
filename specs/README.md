# Specs — Spec-Driven Development

Cada feature de negocio tiene **una** especificación: `specs/<feature>.spec.md`. Es la **fuente de verdad del diseño**, se versiona en git y se revisa en PR **antes** de implementar.

## Flujo (comandos de Claude Code)
1. `/sdd-spec <feature> — <requerimiento>` → genera el spec (problema, solución, criterios EARS).
2. `/sdd-implement <feature>` → crea `feat/<feature>` e implementa en `quartz-api/src/features/` y/o `quartz-web/src/features/`.
3. `/sdd-release <feature>` → versiona (semver), actualiza `CHANGELOG`/`README`, etiqueta y fusiona a `main`.

## Convención del archivo
- **Nombre:** `<feature>.spec.md` (kebab-case, singular del dominio).
- **Frontmatter de tracking:** `feature`, `status` (`draft → approved → implemented → released`), `created`.
- **Secciones:** Problema (≤3 historias) · Solución · Criterios de aceptación (EARS) · Trazabilidad (rutas back/front + rama).

La plantilla canónica vive en el comando `/sdd-spec` (no se duplica aquí). Trazabilidad: spec ↔ rama `feat/<feature>` ↔ PR ↔ tests.

> Las **reglas invariantes** de negocio y datos no van en el spec: se referencian desde [`docs/domain.md`](../docs/domain.md) y [`docs/data-model.md`](../docs/data-model.md). El spec solo lleva lo **propio del feature**.
