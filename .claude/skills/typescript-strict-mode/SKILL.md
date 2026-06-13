---
name: typescript-strict-mode
description: Aplica tipado estricto de TypeScript en código nuevo o editado de quartz-api y quartz-web.
---

# TypeScript Strict Mode — Quartz

Estándar de tipado para que el código sea seguro y legible por humanos y por la IA. Aplica a `quartz-api` y `quartz-web`.

## When to apply

Para crear/modificar archivos '**/*.ts, **/*.tsx, **/*.js'.

## Reglas

1. **Prohibido `any` en código nuevo.** Usa `unknown` + *narrowing*. En `catch`, tipa el acceso al error (p. ej. `(err as { response?: { data?: { message?: string } } })`) en lugar de `error: any`.
2. **Tipo de retorno explícito** en toda función exportada (services, controllers, acciones de store, hooks). No depender de inferencia.
3. **DTOs nombrados** para entradas/salidas públicas: `Create<X>DTO`, `Update<X>DTO`, `I<X>Response`. Nada de objetos anónimos inline en firmas exportadas.
4. **Zod = fuente del tipo de entrada.** Define el schema y deriva: `type LoginInput = z.infer<typeof loginSchema>`. Validación y tipo nunca divergen.
5. **Deriva, no dupliques:** `Omit`, `Pick`, `Partial`, `Required` (ej. `SafeUser = Omit<IUser, 'passwordHash'> & { _id: ... }`).
6. **Enums/uniones centralizados** en `*.types.ts` (`UserRole`, `GradeLevel`). Sin strings mágicos repartidos.
7. **Respeta `noUnusedLocals`/`noUnusedParameters`** (activos en `quartz-web/tsconfig.app.json`): elimina imports y variables sin uso o prefija con `_`.
8. **Mongoose:** documentos tipados con `I<X>Document extends I<X>, Document`. Lecturas de solo lectura usan `.lean()` y devuelven `I<X>` (no el Document).

## Procedimiento

1. Antes de escribir, localiza/define los tipos en `*.types.ts` (backend) o `types/` (frontend).
2. Tras editar, ejecuta el typecheck correspondiente:
   - Backend: `cd quartz-api && npx tsc --noEmit`
   - Frontend: `cd quartz-web && npm run build`
3. Corrige cualquier error de tipo antes de dar por terminada la tarea.

## Anti-ejemplos → corrección

```ts
// ❌ Evitar
export const getUser = async (id) => { ... }                 // sin tipos
function save(data: any) { ... }                             // any
const role = user['role'];                                   // acceso no tipado

// ✅ Correcto
export async function getUser(id: string): Promise<IUserResponse | null> { ... }
function save(data: CreateUserDTO): Promise<IUser> { ... }
const role: UserRole = user.role;
```
