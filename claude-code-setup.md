# Quartz — Configuración

Referencia de cómo está configurado **Claude Code CLI** para el monorepo `quartz` (backend `quartz-api` + frontend `quartz-web`).

---

## 0. Mapa de archivos

| Archivo | Ámbito | Versionado | Propósito |
|---|---|---|---|
| `CLAUDE.md` (raíz) | Proyecto | ✅ | Contexto que Claude carga en cada sesión: producto, dominio de negocio, reglas transversales. |
| `quartz-api/CLAUDE.md` | Backend | ✅ | Reglas técnicas del backend. Se carga al trabajar dentro del paquete. |
| `quartz-web/CLAUDE.md` | Frontend | ✅ | Reglas técnicas del frontend. Se carga al trabajar dentro del paquete. |
| `.claude/settings.json` | Proyecto (equipo) | ✅ | Permisos, variables de entorno, hooks, MCP habilitados. |
| `.claude/settings.local.json` | Personal | ❌ | Overrides y secretos locales (cadenas de conexión, tokens). |
| `.mcp.json` (raíz) | Proyecto | ✅ | Servidores MCP compartidos por el equipo. |
| `.claude/skills/<skill>/SKILL.md` | Proyecto | ✅ | Skills que Claude invoca automáticamente según el contexto. |
| `docs/domain.md` · `docs/data-model.md` | Referencia | ✅ | Lógica de negocio y modelo de datos. Se consultan **bajo demanda** (no se auto-cargan), referenciados desde `CLAUDE.md` y los comandos SDD. |

Precedencia de permisos (menor → mayor): `settings.json` (proyecto) → `settings.local.json` (personal). La regla más específica gana.

---

## 1. Jerarquía de `CLAUDE.md`

Claude carga **siempre** el `CLAUDE.md` de la raíz y, además, el del paquete en el que trabajas (`quartz-api/` o `quartz-web/`). Cada paquete aporta solo sus reglas técnicas, sin ruido del otro.

- La **fuente de verdad** de cada conjunto de reglas es el propio `CLAUDE.md` (ver tabla §0). Este documento no las reproduce.
- El `CLAUDE.md` raíz es autocontenido: el dominio de negocio vive inline, sin imports `@` a archivos externos.

---

## 2. `.claude/settings.json`

Permite sin fricción los comandos seguros y frecuentes del flujo MERN (dev server, build, lint, typecheck, git de solo lectura) y bloquea lo destructivo o sensible (secretos, borrados, reescritura de historia).

```jsonc
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "includeCoAuthoredBy": true,
  "enableAllProjectMcpServers": true,
  "permissions": {
    "allow": [
      "Bash(npm run dev:*)", "Bash(npm run start:*)",
      "Bash(npx tsc:*)", "Bash(npx ts-node:*)",
      "Bash(npm run build:*)", "Bash(npm run lint:*)", "Bash(npm run preview:*)",
      "Bash(npm install:*)", "Bash(npm ci:*)", "Bash(npm ls:*)",
      "Bash(git status:*)", "Bash(git diff:*)", "Bash(git log:*)",
      "Bash(git show:*)", "Bash(git branch:*)", "Bash(git add:*)",
      "Read(quartz-api/src/**)", "Read(quartz-web/src/**)",
      "Edit(quartz-api/src/**)", "Edit(quartz-web/src/**)"
    ],
    "ask": [
      "Bash(git push:*)", "Bash(git commit:*)", "Bash(npm publish:*)"
    ],
    "deny": [
      "Read(./**/.env)", "Read(./**/.env.*)", "Read(./**/*.pem)", "Read(./**/*.key)",
      "Bash(rm -rf:*)", "Bash(git reset --hard:*)", "Bash(git clean -fd:*)",
      "Edit(**/node_modules/**)", "Edit(**/dist/**)", "Read(**/node_modules/**)",
      "Read(dev/design/**)", "Edit(dev/design/**)"
    ]
  },
  "env": { "NODE_ENV": "development" }
}
```

- `enableAllProjectMcpServers: true` aprueba los servidores de `.mcp.json` sin habilitarlos uno a uno.
- `Bash(cmd:*)` usa *prefix matching*: `npm run dev:*` cubre `npm run dev`, `npm run dev --host`, etc.
- `Read`/`Edit` aceptan globs estilo `.gitignore`; se acotan a `src/**` para no editar config crítica sin pedir permiso.
- `dev/design/**` queda fuera de alcance por decisión de negocio (bloqueado en `deny`).

### 2.1 `.claude/settings.local.json` (personal, no versionar)

Overrides y secretos por máquina. Ejemplo:

```jsonc
{
  "permissions": { "allow": ["Bash(git push:*)"] },
  "env": {
    "MDB_MCP_CONNECTION_STRING": "mongodb+srv://<user>:<pass>@<cluster>/quartz"
  }
}
```

> `.claude/settings.local.json` está incluido en `.gitignore`, de modo que la config personal y los secretos nunca se commitean.

### 2.2 Hooks (opt-in, no activos)

Los hooks ejecutan comandos en eventos del ciclo de vida (p. ej. lint/typecheck tras una edición). No se activan por ahora: el backend no tiene aún script de lint ni tests, y correr `build`/`lint` en cada edición es lento y ruidoso en Windows. Plantilla para cuando exista tooling estable:

```jsonc
"hooks": {
  "PostToolUse": [
    { "matcher": "Edit|Write",
      "hooks": [{ "type": "command", "command": "cd quartz-web && npm run lint --silent" }] }
  ]
}
```

---

## 3. MCP

`.mcp.json` existe pero está **vacío** (`{ "mcpServers": {} }`). Sin servidores activos. Tres ámbitos según dónde configurarlos:

| Ámbito | Ubicación | Versionado | Uso |
|---|---|---|---|
| **Project** | `.mcp.json` (raíz) | ✅ | Servidores que todo el equipo comparte (ej. Mongo del proyecto). |
| **Local** | `~/.claude.json`, entrada de este proyecto | ❌ | Solo para ti en esta máquina y este repo. |
| **User** | `~/.claude.json` global | ❌ | En todos tus proyectos (ej. Context7). |

Agregar (recomendado vía CLI):

```bash
claude mcp add --scope project <nombre> -- npx -y <paquete-mcp>
claude mcp add --scope local   <nombre> -- npx -y <paquete-mcp>
claude mcp add --scope user    <nombre> -- npx -y <paquete-mcp>
claude mcp list                 # estado
claude mcp get <nombre>
claude mcp remove <nombre>
```

Candidatos para este stack (referencia, no activados):

```jsonc
{
  "mcpServers": {
    "mongodb":    { "command": "npx", "args": ["-y", "mongodb-mcp-server"],
                    "env": { "MDB_MCP_CONNECTION_STRING": "${MDB_MCP_CONNECTION_STRING}", "MDB_MCP_READ_ONLY": "true" } },
    "context7":   { "command": "npx", "args": ["-y", "@upstash/context7-mcp"] },
    "playwright": { "command": "npx", "args": ["-y", "@playwright/mcp@latest"] }
  }
}
```

- Secretos: nunca en `.mcp.json` versionado; usa `${VAR}` y define la variable en `settings.local.json` (`env`) o en el shell.
- MCP de Mongo: arráncalo con `MDB_MCP_READ_ONLY=true` salvo necesidad consciente.

---

## 4. Skills

Viven en `.claude/skills/<nombre>/SKILL.md`. Cada skill define en su `description` (frontmatter) **cuándo** Claude la activa; esa es la fuente de verdad de su disparo y este documento no la reproduce. Índice:

| Skill | Propósito |
|---|---|
| `typescript-strict-mode` | Tipado estricto en `.ts`/`.tsx`. |
| `clean-code-solid` | Clean Code / SOLID en el patrón funcional. |
| `quartz-feature-scaffold` | Andamia un feature (vertical slice back + front). |

**Ubicación — por qué en la raíz:** Claude descubre las skills de proyecto desde la **raíz del repo** (donde está `.git`), no desde subcarpetas. Por eso `.claude/skills/` (raíz) está disponible trabajes donde trabajes dentro del monorepo, incluso lanzando Claude desde `quartz-api/` o `quartz-web/`. Un `<paquete>/.claude/skills/` anidado **no** se cargaría automáticamente. Las skills son transversales; si alguna fuera exclusiva de un paquete, se acota por su `description` (p. ej. "úsala en backend"), no por la ubicación.

### 4.1 Comandos SDD (Spec-Driven Development)

Pipeline de 3 comandos **user-invoked** (`disable-model-invocation: true`; solo se disparan al escribirlos). Reciben el feature por `$ARGUMENTS` y **no reproducen** reglas de código: delegan en las skills y los `CLAUDE.md`.

| Comando | Rol | Hace |
|---|---|---|
| `/sdd-spec <feature> — <req>` | Analista | Genera `specs/<feature>.spec.md` (problema + solución + criterios EARS). Sin código. |
| `/sdd-implement <feature>` | Sr Dev | Crea `feat/<feature>` e implementa en `src/features/` según las skills. Sin tests. |
| `/sdd-release <feature>` | Release Mgr | Versiona (semver), `CHANGELOG`/`README`, tag y merge a `main`. Tests automáticos: pendientes de runner. |

Los **specs** se versionan en `specs/` (un `<feature>.spec.md` por feature). Convención y plantilla: ver [`specs/README.md`](specs/README.md).

---

## 5. Puesta en marcha

1. Abre Claude Code en la raíz; verifica que cargan los `CLAUDE.md` (raíz + por paquete) y las 3 skills.
2. Prueba un prompt tipo *"crea el feature `concept` siguiendo el estándar"* → debe activar `quartz-feature-scaffold` + `typescript-strict-mode`.
3. Cuando necesites un MCP, agrégalo con `claude mcp add --scope project …` (§3).
