---
name: sdd-implement
description: Implementa un feature a partir de su spec SDD (specs/<feature>.spec.md), creando la rama feat/<feature> y el código en src/. No escribe tests ni docs. Úsala con /sdd-implement <feature>.
argument-hint: <feature>
disable-model-invocation: true
allowed-tools: Read, Edit(specs/**), Bash(git status *), Bash(git branch *), Bash(git checkout *), Bash(git add *)
---

# SDD · Fase 2 — Implementación

**Rol:** Sr Software Developer.
**Entrada:** `$ARGUMENTS` = nombre del feature. Lee `specs/<feature>.spec.md`.
**Salida:** código funcional en `src/features/<feature>/` del/los paquete(s) que aplique. **No** escribas tests ni documentación.

> **Reglas de código:** no se repiten aquí. Aplica las skills `quartz-feature-scaffold`, `typescript-strict-mode` y `clean-code-solid`, y las guías `quartz-api/CLAUDE.md` (backend) / `quartz-web/CLAUDE.md` (frontend). Recuerda: el backend es **CommonJS + funcional** y la **multi-tenancy** (`institutionId` desde el token) es obligatoria.
> **Reglas de negocio y datos:** consulta `docs/domain.md` (lógica de valoración, conceptos, `globalStatus`) y `docs/data-model.md` (colecciones y relaciones).

## Pasos
1. Lee `specs/<feature>.spec.md`. Si algún criterio EARS es ambiguo, **pregunta** antes de codear.
2. **Plan:** descompón el feature en pasos (sin detalles de código todavía) y compártelo.
3. **Git:** confirma que el árbol esté limpio y crea la rama `feat/<feature>`.
4. **Código:** implementa lo mínimo para cubrir los criterios, respetando el orden de `quartz-feature-scaffold`:
   - Backend: `types → model → validation → service → controller → routes → montar en app.ts`.
   - Frontend: `types → store → components → page → ruta en App.tsx`.
5. Marca en el spec los criterios cubiertos y cambia `status: implemented`.
6. **Verificación final:** ejecuta `npx tsc --noEmit` en cada paquete modificado y arranca el servidor en modo desarrollo; confirma que no hay errores de compilación ni de runtime en consola antes de dar el feature por completado.

## Checklist de salida
- [ ] Rama `feat/<feature>` creada.
- [ ] Código en `src/features/<feature>/` de los paquetes que apliquen, conforme a las skills y los `CLAUDE.md`.
- [ ] `specs/<feature>.spec.md` con `status: implemented` y criterios marcados.
- [ ] `npx tsc --noEmit` pasa sin errores en todos los paquetes modificados.
- [ ] El servidor arranca sin errores en consola (sin errores de compilación ni de runtime en `ts-node`/`nodemon`).
- [ ] Sin tests ni documentación (van en `/sdd-release`).
