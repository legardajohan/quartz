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
5. **`<feature>.controller.ts`** — funciones `<accion>Controller`. Extraen `req.user!.institutionId.toString()`, llaman al service, responden. **Sin `try/catch`** y **sin** guarda `if (!user...)`: los errores se propagan al `errorHandler` central vía `asyncHandler` (cableado en routes), y `requireTenant` garantiza `req.user`. Errores esperables se lanzan en el **service** como `AppError`; el controller nunca mapea errores con `res.status(500)` ni por texto del mensaje.
6. **`<feature>.routes.ts`** — `const router = Router()`; cada ruta encadena `authenticateJWT → requireTenant → authorize([roles]) → validate(schema) → asyncHandler(controller)`. `requireTenant` va **inmediatamente después** de `authenticateJWT` (omitir solo en rutas públicas como `login`); todo controller se envuelve con `asyncHandler` aquí. `export default router`.

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
import AppError from '../../utils/AppError';
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

## Plantilla mínima de controller (referencia)
Delgado, sin `try/catch`, sin guarda `!user`. El tenant siempre sale del token.
```typescript
import { Request, Response } from 'express';
import { create<X>, get<X>ById } from './<feature>.service';

export async function get<X>ByIdController(req: Request, res: Response) {
  const { id } = req.params;
  const institutionId = req.user!.institutionId.toString();
  const result = await get<X>ById(id, institutionId);
  res.status(200).json(result);
}

export async function create<X>Controller(req: Request, res: Response) {
  const institutionId = req.user!.institutionId.toString();
  const created = await create<X>(req.body, institutionId);
  res.status(201).json(created);
}
```

## Plantilla mínima de routes (referencia)
`requireTenant` tras `authenticateJWT`; controllers envueltos con `asyncHandler`.
```typescript
import { Router } from 'express';
import { get<X>ByIdController, create<X>Controller } from './<feature>.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/require-tenant.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../middlewares/async-handler.middleware';
import { get<X>Schema, create<X>Schema } from './<feature>.validation';

const router = Router();

router.get(
  '/:id',
  authenticateJWT,
  requireTenant,
  authorize(['Jefe de Área']),
  validate(get<X>Schema),
  asyncHandler(get<X>ByIdController)
);

router.post(
  '/',
  authenticateJWT,
  requireTenant,
  authorize(['Jefe de Área']),
  validate(create<X>Schema),
  asyncHandler(create<X>Controller)
);

export default router;
```
