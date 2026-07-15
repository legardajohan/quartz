# quartz-api

> **Sistema:** Quartz — Gestión académica para la **evaluación cualitativa** de estudiantes del grado **Transición**.
> **Dominio y datos:** reglas de negocio en [`docs/domain.md`](../docs/domain.md); modelo de colecciones en [`docs/data-model.md`](../docs/data-model.md) (la verdad de campos vive en los `*.model.ts`).

## Arquitectura
**Backend:** **Monolito Modular** con *Screaming Architecture*: se agrupa por **feature/dominio**, no por capa técnica. Cada módulo es aislable y, si la escala lo exige, extraíble a *microservicio*. **Patron funcional/módulo:** sin clases, solo *named exports*. 

## Stack (MERN + Typescript)
**Backend:** Express 4 · Mongoose 8 · Zod 4 · JWT 9 · bcrypt 2 · typescript 5.4 (CommonJS, `ts-node` + `nodemon`). 

## Estructura por feature
```
src/features/<feature>/
├── <feature>.routes.ts       # endpoints + middlewares
├── <feature>.controller.ts   # capa HTTP (funcional)
├── <feature>.service.ts      # lógica de negocio (funcional)
├── <feature>.model.ts        # schema Mongoose + interfaces
├── <feature>.types.ts        # DTOs, enums
└── <feature>.validation.ts   # esquemas Zod
```
**Regla de oro:** un *feature* nuevo replica exactamente este conjunto de 6 archivos. No se crean carpetas técnicas globales (`/controllers`, `/services` planos).

Transversales: `middlewares/` (authenticateJWT, **requireTenant**, authorize, validate, **asyncHandler**, **errorHandler**), `repositories/base.repository.ts`, `utils/AppError.ts`, `services/` (soporte no atado a feature), `types/`.

## Responsabilidades por capa
1. **Routes** — método + path; encadena `authenticateJWT → requireTenant → authorize([roles]) → validate(schema) → asyncHandler(controller)`. Sin lógica. `requireTenant` va **inmediatamente después** de `authenticateJWT` en toda ruta que dependa del tenant (omitir solo en rutas públicas, p. ej. `POST /login`). Todo controller se envuelve con `asyncHandler` **aquí**, no en el archivo de controller.
2. **Controller** — solo HTTP: extrae `req.user!`/`params`/`body`, obtiene `institutionId` con `req.user!.institutionId.toString()`, llama al service, responde. **Sin `try/catch`** y **sin** guarda `if (!user...)` (de eso se encargan `asyncHandler` + `requireTenant`). Los errores se propagan a `next` vía `asyncHandler` y los resuelve el `errorHandler` central; **nunca** mapear errores con `res.status(500)`/`console.error` ni por coincidencia de texto del mensaje.
3. **Service** — solo negocio: orquesta modelos (directo o vía `base.repository`), **siempre** con filtro `institutionId`, `.lean()` en lecturas. Lanza `AppError(msg, code)` para fallos esperables (incluido el statusCode exacto, p. ej. `422`); el `errorHandler` central lo traduce a HTTP.
4. **Model** — schema Mongoose + interfaces `I<X>` / `I<X>Document` + métodos (`toSafeUser`). Campos sensibles con `select: false`.

## Multi-tenancy (CRÍTICO)
Toda lectura/escritura filtra y fuerza `institutionId` desde el **token autenticado**. Una fuga de datos entre instituciones es un fallo de severidad máxima.
```typescript
// Lectura
Model.findOne({ _id: id, institutionId });          // SIEMPRE filtrar
// Escritura
Model.create({ ...data, institutionId });            // SIEMPRE forzar desde el token
```
Nunca aceptar `institutionId` del body/params.

## Nombrado
- Archivos: `kebab-case.<rol>.ts` (`checklist-template.service.ts`).
- Funciones: `camelCase`, verbo+sustantivo (`getStudentValuationById`).
- Controllers: sufijo `Controller` (`updateValuationController`).
- Interfaces: `I<Nombre>` / `I<Nombre>Document`; DTO salida segura `Safe<Nombre>`.
- Modelo Mongoose: `PascalCase` singular.
- Constantes: `SCREAMING_SNAKE_CASE`.

## Validación y errores
- **Zod** para todo input (`{ body, params, query }`); deriva DTOs con `z.infer`. (No Joi/express-validator.)
- Errores esperables → `throw new AppError(msg, statusCode)` desde el **service**; el `errorHandler` central (destino de `asyncHandler`) lo traduce a `res.status(statusCode).json({ message })`. El controller **no** captura ni mapea errores.

## Orden al crear un feature
1. `*.types.ts` → 2. `*.model.ts` → 3. `*.validation.ts` → 4. `*.service.ts` → 5. `*.controller.ts` → 6. `*.routes.ts` → 7. montar en `app.ts` (`app.use('/api/<plural>', <feature>Routes)`).

## Convención de export
- Routers: `export default router`.
- Controllers/Services: *named exports* (`export async function`).

## Verificación
`npx tsc --noEmit`