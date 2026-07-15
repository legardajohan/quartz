---
name: sdd-spec
description: Planea un feature de Quartz — genera la tríada spec.md (QUÉ) + plan.md (CÓMO) + tasks.md (checklist) en specs/<ID>-<slug>/, sin escribir código. Úsala con /sdd-spec <ID>-<slug> — <descripción del requerimiento>.
argument-hint: <ID>-<slug> — <descripción del requerimiento>
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Write(specs/**)
---

# SDD · Fase 1 — Planeación (spec + plan + tasks)

**Rol:** Analista / Arquitecto. Solo planeas. **Cero código, cero tests.**

- **Entrada:** `$ARGUMENTS` = `<ID>-<slug>` (ej. `VAL-02-observations`) + descripción.
- **Salida:** `spec.md`, `plan.md`, `tasks.md` en `specs/<ID>-<slug>/`.
- **Contexto:** `docs/domain.md` (reglas invariantes), `docs/data-model.md` (colecciones), `docs/data-base.md` (campos pendientes y decisiones embebido vs. referencia), `CLAUDE.md` raíz, `quartz-api/CLAUDE.md` (patrón de 6 archivos), `quartz-web/CLAUDE.md` (feature front).
- **No redefinas reglas de negocio ni de datos:** refiérete a ellas por archivo y sección.

## Estilo de escritura (crítico)
Específico y detallado, **puntual y sin relleno**:
- Rutas de archivo **exactas**, nombres reales de campos, funciones y endpoints.
- Tablas para endpoints y contratos. Bullets cortos. Una idea por línea.
- Prohibido: adjetivos de venta, justificaciones largas, repetir lo que ya dicen `CLAUDE.md` o `docs/`.
- Si algo es obvio por convención del proyecto, se omite.

## ID del feature
`<AREA>-<NN>-<slug>` · `NN` = consecutivo de 2 dígitos por área (mira `specs/` para el siguiente).

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

## Pasos
1. ¿Falta contexto? **Pregunta antes de escribir.**
2. Escribe `spec.md` (QUÉ). Criterios en **EARS**, verificables, sin ambigüedad.
3. Escribe `plan.md` (CÓMO). Rutas exactas + contratos.
4. Escribe `tasks.md` (checklist ejecutable en orden).
5. **Coherencia:** cada criterio del `spec` se resuelve en `plan` y se ejecuta en `tasks`.
6. **Detente.** Resumen breve (objetivo + decisiones clave + criterios) y espera aprobación. Implementar va por `/sdd-implement`.

## Plantilla — `spec.md`
```markdown
---
id: <ID>-<slug>
feature: <slug>
status: draft        # draft | approved | implemented | released
created: <YYYY-MM-DD>
---

# <ID> — <Título> (spec)

## Objetivo
<1-2 frases: qué resuelve y para quién>

## Alcance
**Incluye:** <bullets>
**Fuera:** <bullets — lo que explícitamente no se hace>

## Criterios de aceptación (EARS)
- [ ] Cuando <evento>, el sistema <respuesta>.
- [ ] Si <condición>, el sistema <respuesta>.
- [ ] **Aislamiento:** toda lectura/escritura del feature filtra y fuerza `institutionId` del token; ninguna operación lo acepta de `body`/`params`.
- [ ] `npx tsc --noEmit` en verde en cada paquete tocado (+ `npm run build && npm run lint` si toca `quartz-web`).

## Dependencias
- <specs previos, features o datos que deben existir; "ninguna" si aplica>

## Trazabilidad
- Backend:  quartz-api/src/features/<feature>/
- Frontend: quartz-web/src/features/<feature>/
- Branch:   feat/<ID>-<slug>
```

## Plantilla — `plan.md`
```markdown
# <ID> — Plan técnico

## Archivos
### quartz-api
| Acción | Ruta |
|---|---|
| crear | `src/features/<feature>/<feature>.types.ts` |
| tocar | `src/app.ts` |

### quartz-web
| Acción | Ruta |
|---|---|
| crear | `src/features/<feature>/use<Feature>Store.ts` |

## Contratos
### Tipos / DTOs
<firmas exactas: `interface I<X>`, `Safe<X>`, enums>

### Modelo Mongoose
<campos nuevos, tipo, required, default · `institutionId` required + indexado · índices compuestos>

### Zod
<esquema por endpoint: `{ body, params, query }`>

### Endpoints
| Método | Ruta | Rol | Middlewares |
|---|---|---|---|
| POST | `/api/<plural>` | Jefe de Área | `authenticateJWT → requireTenant → authorize([...]) → validate(schema)` |

### Frontend
<store: estado + acciones `apiClient` · componentes · página · ruta en `App.tsx`>

## Notas
<decisiones de diseño y trade-offs — solo lo no obvio>

## Verificación
- `cd quartz-api && npx tsc --noEmit`
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev` en los paquetes tocados: cero errores en consola.
```

## Plantilla — `tasks.md`
```markdown
# <ID> — Tasks

## Backend (`quartz-api`)
- [ ] `<feature>.types.ts` — <qué>
- [ ] `<feature>.model.ts` — <qué> (+ `institutionId` required/indexado)
- [ ] `<feature>.validation.ts` — <qué>
- [ ] `<feature>.service.ts` — <qué> (filtro `institutionId`, `.lean()`, `AppError`)
- [ ] `<feature>.controller.ts` — <qué> (sin `try/catch`)
- [ ] `<feature>.routes.ts` — <qué> (+ `asyncHandler`)
- [ ] Montar en `app.ts`: `app.use('/api/<plural>', <feature>Routes)`

## Frontend (`quartz-web`)
- [ ] `types/` → 2. `use<Feature>Store.ts` → 3. `components/` → 4. `pages/<Feature>Page.tsx` → 5. ruta en `App.tsx`

## Verificación final
- [ ] `npx tsc --noEmit` en verde (paquetes tocados)
- [ ] `npm run build && npm run lint` en verde (si toca web)
- [ ] Servidor arranca sin errores de compilación ni runtime
- [ ] Repaso de aislamiento: ninguna query sin `institutionId` del token

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
```

## Antes de cerrar
- [ ] Existen los tres archivos en `specs/<ID>-<slug>/`.
- [ ] `spec.md` con frontmatter y `status: draft`.
- [ ] Criterios EARS verificables + criterio de aislamiento + criterio de typecheck.
- [ ] `plan` y `tasks` cubren **todos** los criterios del `spec`.
- [ ] Rutas exactas, sin relleno, sin duplicar `docs/` ni `CLAUDE.md`.
- [ ] Cero código.
