---
name: sdd-release
description: Prepara y ejecuta el release consolidado de Quartz (todo lo mergeado a develop desde la última release — revisión vs. criterios, semver, CHANGELOG, tag y merge develop → main). Úsala con /sdd-release [<ID>-<slug> ...].
argument-hint: "[<ID>-<slug> ...] (opcional, informativo)"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash(git status *), Bash(git diff *), Bash(git log *), Bash(git branch *), Bash(git checkout *), Bash(git add *), Bash(git commit *), Bash(git tag *), Bash(git merge *), Bash(npx tsc *), Bash(npm run *)
---

# SDD · Fase 3 — Release

**Rol:** Software Release Manager.

**Entrada:** `$ARGUMENTS` = lista **opcional** de `<ID>-<slug>` a destacar. Si no la dan, descubre tú los features del release.

**Rama actual: `develop`.** Este skill libera lo **acumulado en `develop`**, no un `feat/<ID>` suelto (eso ya se fusionó a `develop` vía PR). Si estás en otra rama, detente.

## Pasos
1. **Alcance del release:** identifica los `specs/*/spec.md` con `status: implemented` que ya estén en `develop` (contrasta con `git log main..develop`). Lista los IDs incluidos y confírmalos con el usuario.
2. **Revisión:** por cada spec incluido, verifica que el código cubre sus criterios EARS y el criterio de **aislamiento** (`institutionId` del token en toda operación). Sugiere `/code-review` si no se hizo antes.
3. **Verificación (sin runner de tests — PENDIENTE DE TOOLING):**
   - `cd quartz-api && npx tsc --noEmit`
   - `cd quartz-web && npm run build && npm run lint`
   - Arranca los paquetes tocados: cero errores en consola.
   - Los criterios EARS se verifican **manualmente**; déjalo anotado en el resumen. Cuando exista runner (p. ej. Vitest), este paso pasará a correr tests e2e por criterio antes de continuar.
   - **No liberes en rojo.**
4. **Versión y documentación:**
   - **Versión de producto** `vX.Y.Z` por **semver** sobre el conjunto del release (feat → minor · fix → patch · breaking → major). No hay `package.json` raíz: vive en el **tag** y en el encabezado del `CHANGELOG.md`.
   - **`CHANGELOG.md` (raíz, créalo si no existe):** una entrada por release, con **todos** los features incluidos (uno por spec, con su ID).
   - **`package.json` de cada paquete tocado:** sube su versión por semver según sus propios cambios (`quartz-api` y/o `quartz-web`).
   - `README.md` y `docs/`: actualiza solo si cambian flujos o contratos.
5. **Tag y merge** — **confirma cada paso con el usuario antes de ejecutarlo**:
   - Commit en `develop`: `chore: prepare release v{version}` (mensaje en **inglés**).
   - Tag: `v{version}` con mensaje `Release v{version}`.
   - Merge `develop` → `main`.
6. Cambia `status: implemented` → `status: released` en el `spec.md` de **cada** feature incluido.

## Plantilla — entrada de `CHANGELOG.md`
```markdown
## v0.2.0 — 2026-07-14
Paquetes: quartz-api 0.2.0 · quartz-web 0.1.0

### Features
- **VAL-02** Observaciones de valoración — <una línea>.
- **RPT-01** Lista de Chequeo en PDF — <una línea>.

### Fixes
- **CHK-03** <una línea>.
```

## Antes de cerrar
- [ ] Rama actual verificada como `develop`.
- [ ] IDs incluidos en el release listados y confirmados.
- [ ] Criterios EARS de cada spec verificados (manualmente, hasta que exista runner) + aislamiento revisado.
- [ ] `npx tsc --noEmit` en verde; `build && lint` de web en verde.
- [ ] `CHANGELOG.md` raíz con **todos** los features del release; `package.json` de cada paquete tocado versionado.
- [ ] Tag `v{version}` creado y `develop` fusionada a `main`.
- [ ] `spec.md` de cada feature incluido con `status: released`.
