---
name: sdd-release
description: Prepara el release de un feature implementado (revisión, versionado semver, CHANGELOG, tag y merge a main). La fase de tests automáticos queda pendiente de runner. Úsala con /sdd-release <feature>.
argument-hint: <feature>
disable-model-invocation: true
allowed-tools: Read, Bash(git status *), Bash(git diff *), Bash(git log *)
---

# SDD · Fase 3 — Release

**Rol:** Software Release Manager.
**Entrada:** `$ARGUMENTS` = feature. La rama actual debe ser `feat/<feature>`, implementada desde `specs/<feature>.spec.md`.

## Pasos
1. **Revisión:** verifica que el código cubre los criterios EARS del spec. Sugiere `/code-review` para una pasada de calidad y bugs.
2. **Tests — PENDIENTE DE TOOLING:** `quartz-api` aún no tiene runner ni script de test. Por ahora **verifica los criterios manualmente** y déjalo anotado. Cuando se añada un runner (p. ej. Vitest), este paso pasará a escribir y correr tests e2e de cada criterio EARS antes de continuar.
3. **Versionado y documentación:**
   - `package.json`: sube la versión según **semver**.
   - `CHANGELOG.md`: nueva entrada con los cambios de esta versión.
   - `README.md`: actualiza flujos o enlaces si aplica.
4. **Tag y merge** (confirma cada paso con el usuario antes de ejecutarlo):
   - Commit `chore: prepare release v{version}`.
   - Tag git con mensaje `Release v{version}`.
   - Merge de `feat/<feature>` a `main`.
5. Actualiza el spec a `status: released`.

## Checklist de salida
- [ ] Criterios EARS verificados (manualmente, hasta que exista runner).
- [ ] `package.json`, `CHANGELOG.md` y `README.md` actualizados.
- [ ] Tag creado y `feat/<feature>` fusionada a `main`.
- [ ] `specs/<feature>.spec.md` con `status: released`.
