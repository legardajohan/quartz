# Specs — Spec-Driven Development

Cada feature se planea **antes** de implementarse. El spec es la **fuente de verdad del diseño**: se versiona en git y se revisa en PR.

## Flujo (comandos de Claude Code)
1. `/sdd-spec <ID>-<slug> — <requerimiento>` → crea `specs/<ID>-<slug>/` con la tríada **spec** (QUÉ) + **plan** (CÓMO) + **tasks** (checklist). Sin código.
2. `/sdd-implement <ID>-<slug>` → crea `feat/<ID>-<slug>` desde `develop` y ejecuta las tasks en `quartz-api/` y/o `quartz-web/`. PR → `develop`.
3. `/sdd-release [<ID>-<slug> ...]` → **release consolidado desde `develop`**: revisa lo acumulado, versiona (semver), actualiza `CHANGELOG.md`, etiqueta y fusiona `develop` → `main`.

## Estructura
```
specs/<ID>-<slug>/
├── spec.md    # Objetivo · Alcance · Criterios EARS · Dependencias · Trazabilidad
├── plan.md    # Archivos exactos · Contratos (tipos, modelo, Zod, endpoints) · Verificación
└── tasks.md   # Checklist ordenado (backend → frontend → verificación)
```

**ID:** `<AREA>-<NN>-<slug>` · `NN` consecutivo de 2 dígitos por área.

| Área | Dominio |
|---|---|
| `AUTH` | autenticación, sesión, roles |
| `USR` | usuarios |
| `LRN` | aprendizajes esperados (`learning`) |
| `CHK` | plantillas de lista de chequeo |
| `VAL` | valoración de estudiantes |
| `RPT` | informes / PDF |
| `ACAD` | periodos, materias/dimensiones, colegios y sedes |
| `INF` | transversal: middlewares, `apiClient`, layout, router |

## Tracking
`status` en el frontmatter de `spec.md`: `draft → approved → implemented → released`.
Trazabilidad: spec ↔ rama `feat/<ID>-<slug>` ↔ PR ↔ release.

## Reglas
- Las plantillas canónicas viven en el comando `/sdd-spec`; **no se duplican aquí**.
- Las **reglas invariantes** de negocio y datos **no van en el spec**: se referencian desde [`docs/domain.md`](../docs/domain.md), [`docs/data-model.md`](../docs/data-model.md) y [`docs/data-base.md`](../docs/data-base.md). El spec solo lleva lo **propio del feature**.
- Todo spec de backend lleva criterio de **aislamiento multi-tenant** (`institutionId` desde el token).
- **Tests:** pendientes de runner. Hoy la verificación es `npx tsc --noEmit` (api), `npm run build && npm run lint` (web) y arranque limpio del servidor.

## Specs legacy (formato anterior)
`checklist-template` · `concepts` · `reports` · `valuation-observations` viven como archivo único `<feature>.spec.md`. Ya están implementados y **se conservan tal cual**; el formato de tríada aplica a los features nuevos.
