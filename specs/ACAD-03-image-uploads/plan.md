# ACAD-03 — Plan técnico

## Archivos
### quartz-api
| Acción | Ruta |
|---|---|
| crear | `src/services/r2.service.ts` |
| crear | `src/middlewares/upload.middleware.ts` |
| crear | `src/utils/assertWebp.ts` |
| tocar | `src/features/institution/institution.model.ts` |
| tocar | `src/features/institution/institution.types.ts` |
| tocar | `src/features/institution/institution.service.ts` |
| tocar | `src/features/institution/institution.controller.ts` |
| tocar | `src/features/institution/institution.routes.ts` |
| tocar | `src/features/auth/auth.model.ts` |
| tocar | `src/features/users/users.validation.ts` |
| tocar | `src/features/users/users.service.ts` |
| tocar | `src/features/users/users.controller.ts` |
| tocar | `src/features/users/users.routes.ts` |
| tocar | `src/features/report/report.service.ts` (mapper de institución → `shield`) |
| tocar | `package.json` (deps) |

### quartz-web
| Acción | Ruta |
|---|---|
| crear | `src/utils/imageToWebp.ts` |
| crear | `src/components/common/ImageCropUploader.tsx` |
| crear | `src/features/institution/components/InstitutionShieldPanel.tsx` |
| tocar | `src/features/institution/types/store.ts` |
| tocar | `src/features/institution/useInstitutionStore.ts` |
| tocar | `src/features/configuration/pages/ConfigurationPage.tsx` |
| tocar | `src/features/student-valuation/components/StudentValuationDetail.tsx` |
| tocar | `src/features/student-valuation/components/StudentValuationTable.tsx` |
| tocar | `src/features/report/components/ReportsTable.tsx` |
| tocar | `src/features/users/queries/useUsersQuery.ts` (mutación de foto) |
| tocar | `package.json` (dep) |

### docs
| Acción | Ruta |
|---|---|
| tocar | `docs/data-base.md` (decisión: dónde vive la URL de R2 / campos `shieldUrl` y `avatarUrl`) |

## Contratos

### Infra R2 — `src/services/r2.service.ts`
Env (nombres reales, confirmados): `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` (`quartz-storage`), `R2_PUBLIC_URL` (`https://pub-xxxx.r2.dev`).
```typescript
// S3Client apuntando a R2. region: 'auto', endpoint: https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com
// credenciales: R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY · Bucket: R2_BUCKET
export async function uploadImage(key: string, buffer: Buffer, contentType: string): Promise<string>; // devuelve URL pública (`${R2_PUBLIC_URL}/${key}`)
export async function deleteImage(key: string): Promise<void>; // best-effort; no lanza si el objeto no existe
export function keyFromPublicUrl(url: string): string | null; // deriva la key desde la URL almacenada (strip de R2_PUBLIC_URL), para borrar el previo
```
- `contentType` fijo `'image/webp'`.
- `ACL` no aplica en R2; la visibilidad pública se sirve por `R2_PUBLIC_URL` (dominio público `r2.dev` del bucket).

### Middleware multipart — `src/middlewares/upload.middleware.ts`
```typescript
// multer memoryStorage
export const uploadImageSingle = // multer({ storage, limits: { fileSize: 40 * 1024 }, fileFilter }).single('image')
// fileFilter: acepta solo mimetype === 'image/webp'; cualquier otro → cb(new AppError('Formato no permitido, solo .webp', 422))
// wrapper que captura MulterError:
//   - LIMIT_FILE_SIZE → AppError('La imagen supera el máximo de 40 KB', 422)
//   - LIMIT_UNEXPECTED_FILE / otros → AppError('Archivo inválido', 422)
```
- Campo único: `image`. `req.file.buffer` disponible en el controller.

### Validación magic bytes — `src/utils/assertWebp.ts`
```typescript
export function assertWebp(buffer: Buffer): void; // bytes 0..3 === 'RIFF' && bytes 8..11 === 'WEBP'; si no, throw AppError('Formato de imagen inválido', 422)
```

### Modelo Mongoose
`institution.model.ts` — `IInstitutionDocument` + schema ganan:

| Campo | Tipo | Notas |
|---|---|---|
| `shieldUrl` | `String` | opcional, sin default |

`auth.model.ts` — `IUser`, `SafeUser`, schema y `toSafeUser()` ganan:

| Campo | Tipo | Notas |
|---|---|---|
| `avatarUrl` | `String` | opcional, sin default; incluido en `toSafeUser()` |

`institutionId` de `User` ya es `required` + referencia; no se toca. Sin índices nuevos.

### Zod
`users.validation.ts` — esquema para la ruta de foto:
```typescript
// params: { studentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'studentId inválido') }
// body/query: sin campos (el archivo va por multipart, no por Zod)
export const uploadStudentPhotoSchema = z.object({ params: z.object({ studentId: objectId }), body: z.object({}), query: z.object({}) });
```
El escudo no lleva params/body validables (identidad por token) → no requiere esquema Zod nuevo.

### Endpoints
| Método | Ruta | Rol | Middlewares |
|---|---|---|---|
| PATCH | `/api/institutions/me/shield` | Jefe de Área | `authenticateJWT → requireTenant → authorize([JEFE_DE_AREA]) → uploadImageSingle → asyncHandler(uploadShieldController)` |
| PATCH | `/api/users/:studentId/photo` | Jefe de Área, Docente | `authenticateJWT → requireTenant → authorize([JEFE_DE_AREA, DOCENTE]) → validate(uploadStudentPhotoSchema) → uploadImageSingle → asyncHandler(uploadStudentPhotoController)` |

Respuesta escudo: `InstitutionDto` (con `shieldUrl`). Respuesta foto: `SafeUser`/DTO de estudiante (con `avatarUrl`).
Nota de orden: `uploadImageSingle` va **después** de `validate` para que un `studentId` malformado se rechace antes de parsear el archivo.

### Service — backend
`institution.service.ts` → `uploadInstitutionShield(institutionId, file)`:
1. `assertWebp(file.buffer)`.
2. `key = institutions/${institutionId}/shield-${Date.now()}.webp`.
3. `url = await uploadImage(key, file.buffer, 'image/webp')`.
4. Leer `shieldUrl` previo (scoped); si existe, `deleteImage(keyFromPublicUrl(prev))` best-effort.
5. `findOneAndUpdateScoped({}, { shieldUrl: url }, institutionId)` → `mapInstitutionToDTO`.

`users.service.ts` → `uploadStudentPhoto(institutionId, studentId, file, requester)`:
1. `assertWebp(file.buffer)`.
2. Buscar estudiante `findOneScoped({ _id: studentId, role: ESTUDIANTE }, institutionId)`; si no existe → `AppError(404)`.
3. Si `requester.role === DOCENTE`: exigir que `student.schoolId` esté entre las sedes del docente (mismo criterio de `users.service` en la lectura); si no → `AppError(404)`.
4. `key = institutions/${institutionId}/students/${studentId}/photo-${Date.now()}.webp`; upload; borrar previo best-effort.
5. Update `avatarUrl` (scoped) → devolver estudiante seguro.

Los controllers no usan `try/catch`; `institutionId` sale de `req.user!.institutionId.toString()`; el rol de `req.user!.role`.

### Wiring del informe — `report.service.ts`
Donde se arma la interfaz `IInstitution` del PDF, setear `shield: institution.shieldUrl ?? undefined`. (Hoy `shield` es el placeholder de `report.types.ts:12`.)

### Frontend

**`src/utils/imageToWebp.ts`**
```typescript
export async function cropToWebp(
  imageSrc: string,
  croppedAreaPixels: { x: number; y: number; width: number; height: number },
  opts?: { size?: number; whiteBg?: boolean; maxBytes?: number }
): Promise<Blob>;
// canvas de size×size (default 400). Si whiteBg (origen PNG/con alfa): fillRect blanco antes de drawImage.
// Exporta con canvas.toBlob('image/webp', q); itera q desde 0.9 bajando (~0.05) hasta blob.size <= maxBytes (default 40*1024),
// con piso q≈0.4 (si aún excede, devuelve el mejor y el back rechazará → toast).
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export function isPng(file: File): boolean;
```

**`src/components/common/ImageCropUploader.tsx`** (reutilizable)
- Props: `{ currentUrl?: string; label: string; onUpload: (blob: Blob) => Promise<void>; isUploading?: boolean; shape?: 'circle' | 'square' }`.
- Input `type=file` `accept=".jpg,.jpeg,.png,.webp,image/*"`. Al elegir: si `!ACCEPTED_IMAGE_TYPES.includes(file.type)` → `toast.error('Formato no permitido. Aceptados: JPG, PNG, WEBP')` y aborta.
- `Dialog` (Material Tailwind) con `<Cropper aspect={1} zoom … onCropComplete>` (react-easy-crop) + slider de zoom.
- Confirmar → `cropToWebp(objectUrl, croppedAreaPixels, { whiteBg: isPng(file) })` → `await onUpload(blob)`.
- Pulido con skills **`emil-design-eng`**, **`impeccable`** y **`frontend-design`** (motion del Dialog, foco, estados de carga, jerarquía visual).

**Escudo**
- `institution/types/store.ts` — `InstitutionDto` gana `shieldUrl?: string`.
- `useInstitutionStore.ts` — acción `uploadShield(blob: Blob)`:
  ```typescript
  const fd = new FormData(); fd.append('image', blob, 'shield.webp');
  const dto = await apiPatch<InstitutionDto>('/institutions/me/shield', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  set({ institution: dto });
  ```
  Maneja `isSubmitting`/`error`; el componente hace `toast`.
- `InstitutionShieldPanel.tsx` — muestra escudo actual (o placeholder) + `ImageCropUploader`; `toast.promise` sobre `uploadShield`.
- `ConfigurationPage.tsx` — montar el panel (Tab "Identidad" nuevo, o dentro del tab Informes). La página ya está bajo `RoleRoute` de `Jefe de Área`.

**Foto de estudiante**
- Consumir `avatarUrl` en lugar del hardcode `default-user.jpg`:
  - `StudentValuationTable.tsx:153` · `StudentValuationDetail.tsx:151` · `report/components/ReportsTable.tsx:51` → `src={student.avatarUrl || defaultUser}`.
- `StudentValuationDetail.tsx` — junto al `Avatar` (size lg), montar `ImageCropUploader` visible para `Jefe de Área` y `Docente` (rol de `useAuthStore`).
- Subida: mutación en `useUsersQuery.ts`:
  ```typescript
  // PATCH /users/:studentId/photo con FormData multipart; onSuccess: invalidar la query de usuarios / actualizar avatar
  ```
  `toast.promise` para feedback; en error, mensaje para reintentar.

## Notas
1. **Env (nombres confirmados por el usuario).** `r2.service.ts` lee: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` (`quartz-storage`), `R2_PUBLIC_URL` (`https://pub-xxxx.r2.dev`). Es la única fuente que los lee. `R2_PUBLIC_URL` es el dominio público de desarrollo de R2; para producción con dominio propio solo cambia el valor, sin tocar código. Verificar en la fase de implementación que el bucket tiene acceso público habilitado en `r2.dev`.
2. **Validación defensiva en dos capas.** El requisito es que el back valide *solo* peso y formato. Se hace con: (a) multer `fileFilter` por mimetype `image/webp`, (b) `limits.fileSize = 40KB`, (c) `assertWebp` por *magic bytes* sobre el buffer. (c) cubre el ataque de mimetype falsificado — no se confía en extensión ni header declarado.
3. **Cache-busting y limpieza.** La key lleva `Date.now()` → cada reemplazo es una URL nueva (evita CDN cache viejo). El objeto anterior se borra best-effort derivando su key con `keyFromPublicUrl`; un fallo de borrado se ignora (no bloquea).
4. **`avatarUrl` ya declarado en el front.** El tipo `User`/`SafeUser` del front ya lo tiene; solo faltaba poblarlo y consumirlo. En el back se agrega a `auth.model.ts` + `toSafeUser()` para que viaje en la sesión y en los DTOs de estudiante.
5. **Escudo en `Institution`, no en `School`.** El requisito dice "por inquilino, `institutionId`". El escudo es del tenant raíz; las sedes (`School`) quedan fuera.
6. **apiClient multipart.** No requiere cambios: los helpers aceptan `config` como 3.º argumento; pasar `headers['Content-Type'] = 'multipart/form-data'` sobrescribe el `application/json` por defecto y axios serializa el `FormData`.

## Verificación
- `cd quartz-api && npx tsc --noEmit`
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev` en los paquetes tocados: cero errores en consola.
- Subir escudo desde `/gestion/configuracion` → aparece en el panel y en el PDF de informe.
- Subir foto de estudiante desde el detalle de valoración (como `Jefe de Área` y como `Docente`) → avatar actualizado en tabla y detalle.
- `PATCH /api/institutions/me/shield` con un PNG renombrado a `.webp` → 422 (magic bytes).
- Subir >40 KB → 422 (límite multer).
- Como `Docente`, `PATCH /api/institutions/me/shield` → 403.
- Como `Docente`, foto de un estudiante de otra sede → 404.

## Addendum 2026-07-16 — 4º tab "Identidad" + fix de stacking-context

Ajuste post-implementación, mismo feature (aún `implemented`, no `released`), misma rama.

**Motivo:** el escudo quedó embebido en el tab "Informes" (opción B del plan original), lo que mezclaba temas (qué informes ofrece vs. identidad visual) y hacía ese tab más alto que antes. Al activarlo, el contenido quedaba visualmente por encima del menú superior (`ProfileNavbar`, `sticky top-0 z-10`) en vez de detrás.

### Causa raíz de la superposición
`quartz-web/src/components/layouts/Dashboard.tsx` — `<main>` (contenedor del contenido de cada página) no establecía su propio *stacking context* (sin `position`/`transform`/`isolation`). Por spec CSS, cualquier descendiente posicionado con `z-index` (el indicador animado del tab activo de `TabsHeader`, o el `Dialog` de `ImageCropUploader`, ambos con z-index propio) se compara directamente contra hermanos de `main` en el contexto raíz — incluido `ProfileNavbar` (`z-10`). Sin un contexto de apilamiento intermedio, esos elementos podían ganar el desempate y renderizar por encima del navbar sticky.

### Archivos (adicionales a los ya listados)
| Acción | Ruta |
|---|---|
| tocar | `src/components/layouts/Dashboard.tsx` |
| tocar | `src/features/configuration/pages/ConfigurationPage.tsx` (ya listado; cambio adicional) |

### Cambios
1. **`Dashboard.tsx`** — clase `isolate` (CSS `isolation: isolate`) en `<main>`. Crea un *stacking context* propio para todo el contenido de página: ningún z-index interno (presente o futuro) puede volver a escapar por encima del navbar sticky, sin necesidad de tocar z-index individuales. Fix agnóstico a la causa exacta, de bajo riesgo, no cambia nada visualmente salvo corregir el escape.
2. **`ConfigurationPage.tsx`** — 4º `STEP` `"identidad"` (icono `ShieldCheckIcon`, hint "Cómo te ver"). `InstitutionShieldPanel` se mueve de estar apilado dentro del `TabPanel="informes"` a su propio `TabPanel="identidad"`. Copy de introducción actualizado: "en tres pasos" → "en cuatro pasos: dimensiones, periodos, informes e identidad".

### Verificación adicional
- `cd quartz-web && npm run build` — verde.
- Pendiente de confirmación visual del usuario en navegador (sin herramienta de automatización de navegador disponible en este entorno de implementación).
