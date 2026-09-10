# RPT-06 — Plan técnico

## Decisiones de arquitectura

### Tecnología
`@react-pdf/renderer@^4.5.1` (`quartz-web/package.json:15`), render **100 % en cliente**. El
backend no tiene ninguna librería de PDF: solo compone el JSON del informe y hace de proxy
binario del escudo. No se introduce render en servidor.

### Plantilla reutilizable — qué se puede congelar y qué no
El pipeline de react-pdf es `árbol React → layout (Yoga/flexbox) → pintado (pdfkit)`. El paso
caro es el layout, y **depende del contenido**: `conceptText` admite hasta 2000 caracteres y
varía por estudiante, así que cambian los saltos de línea, la altura de cada bloque y los saltos
de página. No existe un esqueleto pre-renderizado que se hidrate con datos; para tenerlo habría
que bajar a `pdf-lib`/`pdfkit` y posicionar a mano, perdiendo el flujo automático justo donde el
contenido es variable. **Se descarta.** Almacenar el PDF resultante tampoco es opción:
`docs/domain.md:66` lo prohíbe explícitamente.

Lo que sí se reutiliza, por retorno:

| Reutilizable | Cómo | Dónde |
|---|---|---|
| **Imágenes** — el 100 % del coste evitable hoy | `src` idéntico y estable a nivel de módulo (base64) → sin fetch en ningún render | `reportAssets.ts` |
| **Datos del inquilino** | Resueltos una vez por sesión, no por estudiante | `useInstitutionShieldQuery` + `branding` |
| **Init del motor** (módulo, Yoga, pdfkit) | Se paga una vez por sesión; en masivo se amortiza con **una** llamada por lote, no N montajes de `PDFViewer` | deuda, spec futuro |
| **Layout y saltos de página** | ❌ No reutilizable: depende del texto de cada estudiante | — |

Entregable concreto: separar `CommunicativeLetterDocument.tsx` en **shell invariante**
(`LetterPageShell`) y **cuerpo por estudiante**. No acelera el render individual —el shell se
relayoutea igual— pero deja una sola definición del formato para el camino masivo en vez de
duplicarla.

### Dónde cachear: frontend
El escudo es una imagen de ~20-40 KB por inquilino, reutilizada en cada informe de ese
navegador. Cachearla en el proceso del backend no evita el salto de red hacia el navegador;
cachearla en el navegador sí. El backend solo aporta `ETag` + `Cache-Control` para que la
revalidación sea barata.

> Nota a verificar en implementación: react-pdf mantiene además una caché interna de imágenes
> por `src` dentro de la sesión. El diseño **no depende** de ello — el base64 elimina la
> petición de red en cualquier caso; la caché de decodificación sería un extra.

### Token de versión: ninguno campo nuevo
`uploadInstitutionShield` (`institution.service.ts:204,212`) ya nombra las claves R2 como
`institutions/<institutionId>/shield-<timestamp>.{webp,jpg}`. Ese `timestamp` es el token: se
extrae de `shieldJpgUrl` y se expone como `shieldVersion`. Cambia si y solo si se sube un escudo
nuevo, que es exactamente la condición de invalidación buscada.

### ¿Conviene si hoy la generación es individual? Sí
Hoy cada apertura de informe hace: 1 GET del template + 1 GET del escudo (3 lecturas a Mongo +
1 `GetObject` a R2) + 3 fetch de iconos disparados por react-pdf. Después de este spec, la
apertura N-ésima del mismo inquilino hace 1 GET del template y **cero** peticiones de imagen.
Ese salto a R2 es lo que agota los 10 s del timeout reportado.

## Archivos

### quartz-api
| Acción | Ruta |
|---|---|
| tocar | `src/features/institution/institution.types.ts` |
| tocar | `src/features/institution/institution.service.ts` |
| tocar | `src/features/institution/institution.controller.ts` |
| tocar | `src/features/institution/institution.routes.ts` |
| tocar | `src/features/report/report.routes.ts` |
| tocar | `src/features/report/report.controller.ts` |
| tocar | `src/features/report/report.service.ts` |
| tocar | `src/features/report/report.validation.ts` |

### quartz-web
| Acción | Ruta |
|---|---|
| crear | `src/features/report/assets/reportAssets.ts` |
| crear | `src/features/report/components/LetterPageShell.tsx` |
| crear | `src/features/institution/queries/useInstitutionShieldQuery.ts` |
| borrar | `src/features/report/usePdfShieldImage.ts` |
| mover | `src/features/report/components/quartzLogoDataUri.ts` → `src/features/report/assets/` |
| tocar | `src/features/institution/useInstitutionStore.ts` |
| tocar | `src/features/institution/types/` (DTO de branding) |
| tocar | `src/features/report/statusVisuals.ts` |
| tocar | `src/features/report/components/CommunicativeLetterModal.tsx` |
| tocar | `src/features/report/components/ChecklistReportModal.tsx` |
| tocar | `src/features/report/components/CommunicativeLetterDocument.tsx` |
| tocar | `src/features/report/components/ChecklistReportDocument.tsx` |
| tocar | `src/App.tsx` |
| tocar | `src/features/auth/useAuthStore.ts` |

## Contratos

### Tipos / DTOs (`institution.types.ts`)
`IInstitutionBrandingDTO` gana un campo:
```ts
shieldVersion: string | null;
```

### Modelo Mongoose
**Sin cambios.** `Institution` ya tiene `shieldUrl`, `shieldJpgUrl` y `timestamps: true`; la
versión sale de la clave R2, no de un campo nuevo.

### Service (`institution.service.ts`)
Helper de módulo:
```ts
const SHIELD_VERSION_RE = /shield-(\d+)\.jpg$/;

function resolveShieldVersion(shieldJpgUrl?: string): string | null {
  return shieldJpgUrl?.match(SHIELD_VERSION_RE)?.[1] ?? null;
}
```
`getInstitutionBranding` (línea ~73) amplía su `.select(...)` a `'name shieldUrl shieldJpgUrl'` y
devuelve `{ name, shieldUrl, shieldVersion: resolveShieldVersion(institution.shieldJpgUrl) }`.

Nueva función:
```ts
export const getInstitutionShieldJpg = async (
  institutionId: string
): Promise<{ buffer: Buffer; contentType: string; version: string }> => { ... }
```
- `Institution.findById(institutionId).select('shieldJpgUrl').lean()`.
- Sin escudo, o sin clave derivable con `keyFromPublicUrl` → `throw new AppError('Imagen no disponible.', 404)`.
- `getImage(key)` de `r2.service.ts`; `null` → mismo `AppError` 404.
- Devuelve también la `version` para que el controller compona el `ETag`.

### Controller (`institution.controller.ts`)
```ts
export const getMyInstitutionShieldController = async (req: Request, res: Response) => {
  const institutionId = req.user!.institutionId.toString();
  const { buffer, contentType, version } = await getInstitutionShieldJpg(institutionId);
  const etag = `W/"${version}"`;

  res.setHeader('ETag', etag);
  res.setHeader('Cache-Control', 'private, max-age=86400, must-revalidate');

  if (req.headers['if-none-match'] === etag) {
    res.status(304).end();
    return;
  }

  res.type(contentType).send(buffer);
};
```
Sin `try/catch` (lo resuelve `asyncHandler` + `errorHandler`), sin `institutionId` de
`params`/`body`.

> El `304` se emite después de leer R2 porque la versión vive en la clave del objeto. Si más
> adelante conviene evitar también esa lectura, basta con resolver la versión antes de bajar el
> binario; queda anotado, no se implementa ahora (una lectura a Mongo + un `GetObject` una vez
> al día por navegador no es el cuello de botella).

### Endpoints
| Método | Ruta | Rol | Middlewares |
|---|---|---|---|
| GET | `/api/institutions/me/shield.jpg` | Jefe de Área · Docente | `authenticateJWT → requireTenant → authorize([JEFE_DE_AREA, DOCENTE]) → asyncHandler` |

Sin `validate(...)`: no hay `params`, `body` ni `query`.

**Eliminados** (rutas, controllers, servicios y schemas Zod):

| Método | Ruta | Se va con |
|---|---|---|
| GET | `/api/reports/checklist/:valuationId/shield` | `getChecklistReportShieldController`, `getChecklistReportShield`, `getChecklistReportShieldSchema` |
| GET | `/api/reports/communicative-letter/:valuationId/shield` | `getCommunicativeLetterShieldController`, `getCommunicativeLetterShield`, `getCommunicativeLetterShieldSchema` |

Tras la eliminación, revisar si `getImage` / `keyFromPublicUrl` siguen importados en
`report.service.ts`; si no, quitar los imports huérfanos.

**Nota de seguridad.** El escudo deja de estar scopeado por valuación. No es una regresión: es
un recurso del **inquilino**, idéntico para todos sus usuarios, y `requireTenant` + `authorize`
siguen aplicando con `institutionId` resuelto desde el token. El scoping por sede del docente
que hacían las rutas eliminadas no protegía nada aquí — la imagen devuelta era la misma para
cualquier valuación del inquilino.

### Frontend

**`features/report/assets/reportAssets.ts`** — data URIs a nivel de módulo:
```ts
export const STATUS_ICON_JPG_DATA_URI: Record<QualitativeValuation, string> = { ... };
export const REPORT_FOOTER_BANNER_DATA_URI: string;
export { QUARTZ_LOGO_DATA_URI } from './quartzLogoDataUri';
```
Generados una sola vez con un script puntual en el scratchpad (leer el JPG, `toString('base64')`,
emitir el módulo). `statusVisuals.ts` conserva `STATUS_ICON_SVG` (URL de Vite) para la web y
reexporta `STATUS_ICON_JPG` desde `reportAssets` para no romper a sus consumidores actuales.

Presupuesto de peso (base64 ≈ +33 %), todo dentro del chunk *lazy* de informes:

| Asset | Hoy | Objetivo |
|---|---|---|
| Logo Quartz (ya inline) | 70 KB b64 | ≤ 70 KB |
| 3 iconos de estado | ~45 KB (URL) | ≤ 60 KB b64 |
| Banda de footer | ≤ 60 KB tras RPT-05 (URL) | ≤ 80 KB b64 |
| **Total en el chunk de informes** | — | **≤ 210 KB** |

Si un icono se pasa del presupuesto, reoptimizarlo antes de incrustarlo (los actuales son
219×179; no necesitan más).

**`features/institution/queries/useInstitutionShieldQuery.ts`** — patrón de
`features/users/queries/useUsersQuery.ts`:
```ts
const cacheKey = (institutionId: string, version: string) =>
  `quartz:pdf-shield:${institutionId}:${version}`;

useQuery({
  queryKey: ['institution-shield', institutionId, shieldVersion],
  enabled: !!institutionId && !!shieldVersion,
  staleTime: Infinity,
  gcTime: Infinity,
  retry: 1,
  initialData: () => readFromLocalStorage(institutionId, shieldVersion),
  queryFn: async () => {
    const blob = await apiGet<Blob>('/institutions/me/shield.jpg', { responseType: 'blob' });
    const dataUrl = await blobToDataUrl(blob);
    writeToLocalStorage(institutionId, shieldVersion, dataUrl); // + purga otras versiones
    return dataUrl;
  },
});
```
- Devuelve la misma forma que el hook que sustituye (`{ src, isLoading }`) para que los modales
  cambien de import y poco más.
- `institutionId` sale de `useAuthStore().sessionData?.user.institutionId`; `shieldVersion` de
  `useInstitutionStore().branding`.
- Escritura y lectura de `localStorage` envueltas en `try/catch`: modo privado o cuota llena no
  deben romper la generación del PDF, solo perder la caché.
- Al escribir se purgan las claves `quartz:pdf-shield:<institutionId>:*` de otra versión.
- `useAuthStore.logout()` purga **todas** las claves `quartz:pdf-shield:*` (máquina compartida).

**`features/institution/useInstitutionStore.ts`** — `branding` incorpora `shieldVersion`. Los
modales de informe necesitan que `fetchBranding()` se haya ejecutado; hoy solo lo dispara
`InstitutionBrand`. Al implementar, verificar que está montado en el layout para cualquier rol
(`ProfileNavbar` → `InstitutionBrand`) y, si no lo estuviera en algún camino, disparar
`fetchBranding()` desde el hook cuando `branding` sea `null`.

**`LetterPageShell.tsx`** — recibe `{ institution, period, student, shieldSrc, children }` y
contiene el `<Page>`, la cabecera con escudo, la fila de metadatos, la banda de footer `fixed` y
la paginación. `CommunicativeLetterDocument` queda con el `<Document>`, el mapeo de dimensiones,
las observaciones y la firma. Los `StyleSheet.create` del shell se mueven con él. **Sin cambio
visual**: el PDF debe salir idéntico al de RPT-05.

**Modales** (`CommunicativeLetterModal.tsx:24`, `ChecklistReportModal.tsx`) — sustituyen
`usePdfShieldImage(valuationId, hasSource, reportKind)` por `useInstitutionShieldQuery()`. La
condición `isPdfReady` conserva su forma; `hasSource` pasa a ser `!!shieldVersion`.

**`App.tsx`** — `React.lazy` para `ReportsPage` y `CommunicativeLetterEditPage`, envueltos en un
`<Suspense fallback={<Loading />}>` (componente ya existente en `components/ui/Loading`). Son las
dos únicas pantallas que arrastran `@react-pdf/renderer` y los assets base64.

## Notas
- Orden de implementación: **después** de RPT-05, que introduce la banda de footer y el override
  de timeout. Al terminar RPT-06, `usePdfShieldImage.ts` y su override desaparecen; el
  `REPORT_REQUEST_TIMEOUT_MS` sobre los GET de template se conserva.
- `ChecklistReportDocument` también consume el escudo por la misma vía; el cambio lo cubre sin
  trabajo adicional más allá del import.
- Deuda que este spec **no** aborda y conviene anotar en `specs/README.md` como candidata a
  RPT-07: `getCommunicativeLetterReport` encadena ~9 round-trips a Mongo porque
  `getStudentValuationById` no usa `.lean()` y hace 3 `populate`
  (`student-valuation.service.ts:97-171`).

## Verificación
- `cd quartz-api && npx tsc --noEmit`
- `cd quartz-web && npm run build && npm run lint`
- `npm run build` en `quartz-web`: comparar el tamaño de `index-*.js` contra la medición previa
  a este spec y confirmar que existe un chunk separado con `@react-pdf/renderer`.
- `npm run dev` en ambos paquetes: cero errores en consola.
- DevTools → Network con filtro de imágenes, abriendo dos informes seguidos: la segunda apertura
  debe registrar cero peticiones de imagen.
