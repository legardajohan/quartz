---
name: quartz-feature-scaffold
description: Andamia un feature nuevo (vertical slice) en quartz-api y/o quartz-web siguiendo exactamente las convenciones del proyecto. Úsala cuando se pida "crear un feature/módulo nuevo", "agregar un endpoint", "nueva pantalla" o similar. Genera la estructura de archivos correcta con multi-tenancy y el flujo HTTP canónico ya cableados.
---

# Quartz Feature Scaffold — Vertical Slice

Crea features consistentes con el estándar. Reglas por paquete: `quartz-api/CLAUDE.md` (backend) y `quartz-web/CLAUDE.md` (frontend).

## Backend — `quartz-api/src/features/<feature>/`

Crea los 6 archivos (`<feature>` en kebab-case, singular del dominio):

1. **`<feature>.types.ts`** — enums, `I<X>`, `Create<X>DTO`, `Update<X>DTO`, `I<X>Response`.
2. **`<feature>.model.ts`** — `Schema` Mongoose + `I<X>Document extends I<X>, Document`. Incluye `institutionId: { type: ObjectId, ref: '...', required: true }`. Campos sensibles con `select: false`.
3. **`<feature>.validation.ts`** — esquemas Zod con forma `z.object({ body, params, query })`. Deriva DTOs con `z.infer`.
4. **`<feature>.service.ts`** — funciones `export async function`. **Toda** operación recibe y filtra `institutionId`. Lecturas con `.lean()`. Errores esperables → `throw new AppError(msg, code)`.
5. **`<feature>.controller.ts`** — funciones `<accion>Controller`. Extraen `req.user.institutionId.toString()`, llaman al service, mapean a HTTP. `try/catch` con manejo de `AppError`.
6. **`<feature>.routes.ts`** — `const router = Router()`; cada ruta encadena `authenticateJWT → authorize([roles]) → validate(schema) → controller`. `export default router`.

Finalmente **monta el router en `app.ts`**: `app.use('/api/<plural>', <feature>Routes);`.

## Frontend — `quartz-web/src/features/<feature>/`

1. **`types/`** — `domain.ts`, `api.ts`, `store.ts`, y `index.ts` que re-exporta (`export * from './store'`).
2. **`use<Feature>Store.ts`** — store Zustand con estado (`isLoading`, `isSubmitting`, `error`, datos) y acciones que usan `apiGet/apiPost/apiPatch/apiDelete` de `@/api/apiClient`. Nunca `fetch`/`axios` directo.
3. **`components/`** — UI presentacional (`PascalCase.tsx`), recibe props, sin llamadas a API.
4. **`pages/<Feature>Page.tsx`** — orquesta store + componentes + modales.
5. **Ruta en `App.tsx`** — bajo `<ProtectedRoute>` dentro del layout `Dashboard`.

## Reglas que el scaffold debe respetar siempre
- Multi-tenancy: `institutionId` del token en cada operación backend.
- Tipado estricto (ver skill `typescript-strict-mode`) y JSDoc en exports.
- Tailwind *mobile-first*; sin `style={{…}}`.
- Verifica al final: `npx tsc --noEmit` (api), `npm run build && npm run lint` (web).

## Plantilla mínima de service (referencia)
```typescript
import { AppError } from '../../utils/AppError';
import { <X>Model } from './<feature>.model';
import type { Create<X>DTO, I<X>Response } from './<feature>.types';

/** Crea un <X> dentro de la institución del usuario. */
export async function create<X>(data: Create<X>DTO, institutionId: string): Promise<I<X>Response> {
  const created = await <X>Model.create({ ...data, institutionId });
  return created.toObject();
}

/** Obtiene un <X> por id, acotado al tenant. */
export async function get<X>ById(id: string, institutionId: string): Promise<I<X>Response> {
  const doc = await <X>Model.findOne({ _id: id, institutionId }).lean();
  if (!doc) throw new AppError('<X> no encontrado.', 404);
  return doc;
}
```
