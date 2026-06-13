---
name: sdd-spec
description: Genera una especificación SDD (problema + solución + criterios EARS) a partir de un requerimiento, sin escribir código ni tests. Úsala con /sdd-spec <feature> — <descripción>.
argument-hint: <feature> — <descripción del requerimiento>
disable-model-invocation: true
allowed-tools: Read, Write(specs/**)
---

# SDD · Fase 1 — Especificación

**Rol:** Analista de Software.
**Entrada:** `$ARGUMENTS` = nombre del feature (kebab-case, singular del dominio) + descripción del requerimiento.
**Salida:** un único archivo `specs/<feature>.spec.md`. **No** escribas código ni tests.

> Alinea problema, solución y criterios con las reglas invariantes de `docs/domain.md` y el modelo de `docs/data-model.md`. No las redefinas: refiérete a ellas.

## Pasos
1. Si la descripción no alcanza, **pregunta** el contexto que falte antes de escribir.
2. Define el problema con hasta **3 historias de usuario**.
3. Describe la **solución** a alto nivel (enfoque, sin detalles técnicos).
4. Redacta hasta **9 criterios de aceptación en formato EARS** (`Cuando/Si/Mientras/Dado <condición>, el sistema <respuesta>`).
5. Escribe `specs/<feature>.spec.md` con esta plantilla:

```markdown
---
feature: <feature>
status: draft        # draft | approved | implemented | released
created: <YYYY-MM-DD>
---

# Spec — <Feature>

## Problema
- Como <rol>, quiero <funcionalidad> para <beneficio>.

## Solución (visión general)
- <enfoque sencillo para resolver el problema, sin detalles técnicos>

## Criterios de aceptación (EARS)
- [ ] Cuando <evento>, el sistema <respuesta>.

## Trazabilidad
- Backend:  quartz-api/src/features/<feature>/
- Frontend: quartz-web/src/features/<feature>/
- Branch:   feat/<feature>
```

## Checklist de salida
- [ ] Existe `specs/<feature>.spec.md` con frontmatter, Problema, Solución, Criterios EARS y Trazabilidad.
- [ ] Sin código ni tests.
