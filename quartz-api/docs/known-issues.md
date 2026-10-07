# Incidentes conocidos — quartz-api

Registro puntual de bugs no obvios encontrados en el backend, para no repetirlos en
futuras implementaciones. No es un changelog: solo entran aquí defectos cuya causa no
se deduce mirando el código a simple vista.

---

## Zod: `.strict()` en el envoltorio del schema rompe **todas** las peticiones de la ruta

**Fecha:** 2026-09 · **Archivos afectados:** `features/report/report.validation.ts`
**Síntoma:** los 4 endpoints POST de lote de informes
(`/api/reports/{checklist,communicative-letter}/{bulk,consolidated}`) devolvían
`400 {"message": "Error de validación."}` en el **100 %** de las peticiones, con un body
perfectamente válido. El toast del frontend mostraba solo "Error de validación.", sin pista de
qué campo fallaba, porque el array `errors[]` de la respuesta se descarta en
`extractErrorMessage` (`quartz-web/src/api/apiClient.ts`). Como consecuencia, el descargue
Consolidado (RPT-07) **nunca funcionó end-to-end** desde el día que se implementó.

**Causa raíz:** el `.strict()` estaba aplicado al objeto **envoltorio**, no al `body`:

```ts
// MAL — rechaza `query` y `params`
export const getConsolidatedChecklistReportSchema = z.object({ body: consolidatedReportBody }).strict();

// BIEN — el .strict() interno de consolidatedReportBody ya protege el body
export const getConsolidatedChecklistReportSchema = z.object({ body: consolidatedReportBody });
```

`validate()` **siempre** parsea las tres llaves, independientemente de las que el schema declare:

```ts
// middlewares/validate.middleware.ts
schema.parse({
  body: req.body,
  query: req.query,     // {} en una ruta sin query string, pero la llave EXISTE
  params: req.params,   // ídem
});
```

Un envoltorio estricto que solo declara `body` marca `query` y `params` como llaves no
reconocidas. Comprobado ejecutando la `zod@4.0.17` del propio proyecto:

```
outer .strict() -> false [{"code":"unrecognized_keys","keys":["query","params"], ...}]
outer sin strict -> true
```

Es engañoso porque `{}` "parece" vacío, pero `Object.keys` sí ve las llaves, y porque el mismo
`.strict()` en el nivel interno (que es lo que casi siempre se quiere) funciona perfectamente.

**Fix aplicado:** quitar `.strict()` de los 4 envoltorios. Era el único módulo del backend con
ese patrón: los otros 10 `*.validation.ts` ya aplicaban `.strict()` solo al objeto interno.

**Regla general:** `.strict()` va **siempre** sobre el objeto `body` / `params` / `query`, nunca
sobre el `z.object({ ... })` que los agrupa. Forma canónica:

```ts
export const xSchema = z.object({
  params: z.object({ id: objectIdSchema }).strict(),
  body: z.object({ ... }).strict(),
});
```

**Cómo se diagnosticó:** el mensaje "Error de validación." es genérico y solo aparece en dos
sitios del repo (`validate.middleware.ts` y `error.middleware.ts`), así que el origen era claro,
pero el body enviado por el frontend era correcto campo por campo. Se resolvió ejecutando el
schema real contra el input real que construye el middleware. Moraleja: ante un 400 de Zod con
un payload que se ve bien, parsear con el objeto **completo** que arma `validate()`, no solo con
el `body`.
