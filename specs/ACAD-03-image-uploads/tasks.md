# ACAD-03 — Tasks

## Preparación
- [x] Verificar que el bucket `quartz-storage` tiene acceso público habilitado en su dominio `r2.dev` (env `R2_PUBLIC_URL`). Nombres de env confirmados: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`.
- [x] `quartz-api`: instalar `multer`, `@aws-sdk/client-s3` y `@types/multer` (dev).
- [x] `quartz-web`: instalar `react-easy-crop`.

## Backend — infra transversal (`quartz-api`)
- [x] `src/utils/assertWebp.ts` — valida magic bytes RIFF/WEBP; `AppError(422)` si no.
- [x] `src/services/r2.service.ts` — `S3Client` R2 (endpoint `<account>.r2.cloudflarestorage.com`, `region:'auto'`); `uploadImage`, `deleteImage`, `keyFromPublicUrl`. Config perezosa: lee `process.env` en el primer uso, no al cargar el módulo (ver Nota en `plan.md`).
- [x] `src/middlewares/upload.middleware.ts` — `multer` memoryStorage, `fileSize 40KB`, `fileFilter` solo `image/webp`, `.single('image')`; traducir `MulterError` → `AppError(422)`.

## Backend — escudo (feature `institution`)
- [x] `institution.model.ts` — +`shieldUrl?` (interface + schema).
- [x] `institution.types.ts` — `shieldUrl?` en DTO + `mapInstitutionToDTO`.
- [x] `institution.service.ts` — `uploadInstitutionShield` (`assertWebp` → upload → borra previo → update scoped → DTO).
- [x] `institution.controller.ts` — `uploadShieldController` (sin `try/catch`; `institutionId` del token).
- [x] `institution.routes.ts` — `PATCH /me/shield` con `authorize([JEFE_DE_AREA]) → uploadImageSingle`.

## Backend — foto de estudiante (features `auth` + `users`)
- [x] `auth.model.ts` — +`avatarUrl?` en `IUser`, `SafeUser` (vía `Omit`), schema y `toSafeUser()`.
- [x] `users.validation.ts` — `uploadStudentPhotoSchema` (params `studentId` ObjectId).
- [x] `users.service.ts` — `uploadStudentPhoto` (scoped por `institutionId`; rol `ESTUDIANTE`; scoping por sede para `Docente`; `assertWebp` → upload → borra previo → update). También: `avatarUrl` sumado al `.select()` de `getUsersByFilters` para que tabla/detalle lo reciban.
- [x] `users.controller.ts` — `uploadStudentPhotoController` (params + `institutionId` + rol del token).
- [x] `users.routes.ts` — `PATCH /:studentId/photo` con `authorize([JEFE_DE_AREA, DOCENTE]) → validate → uploadImageSingle`.

## Backend — wiring del informe
- [x] `report.service.ts` — mapear `shield: institution.shieldUrl` en la interfaz del PDF.

## Frontend (`quartz-web`)
- [x] `src/utils/imageToWebp.ts` — `cropToWebp` (canvas 400×400, fondo blanco si PNG, iterar calidad ≤40KB), `ACCEPTED_IMAGE_TYPES`, `isPng`.
- [x] `src/components/common/ImageCropUploader.tsx` — input + validación de formato (toast con formatos aceptados) + `Dialog` con `<Cropper aspect={1}>` + zoom → `onUpload(blob)`. Pulido con skill `emil-design-eng` (feedback de presión `active:scale-[0.97]`, overlay de cámara en hover, dialog sin animaciones lentas).
- [x] `institution/types/store.ts` — `shieldUrl?` en `InstitutionDto` + acción `uploadShield` en la interfaz de estado.
- [x] `useInstitutionStore.ts` — acción `uploadShield(blob)` (FormData multipart).
- [x] `institution/components/InstitutionShieldPanel.tsx` — escudo actual + uploader + `toast.promise`.
- [x] `configuration/pages/ConfigurationPage.tsx` — montado dentro del tab "Informes", junto a `ReportSettingsPanel`.
- [x] `useUsersQuery.ts` — `useUploadStudentPhotoMutation` con `PATCH /users/:studentId/photo` (multipart) + invalidación de `['users']`.
- [x] `StudentValuationDetail.tsx` — uploader junto al `Avatar` para `Jefe de Área` y `Docente`; consume `avatarUrl` vía `useUsersQuery({ id: studentId })` (el DTO de `student-valuation` no trae avatar; se reutiliza el endpoint de usuarios ya planeado).
- [x] `StudentValuationTable.tsx` y `report/components/ReportsTable.tsx` — `src={user.avatarUrl || userImage}`.
- [x] `users/types/api.ts` y `student-valuation/types/store.ts` — `avatarUrl?` sumado a ambas copias de `UserDto` (no comparten tipo).

## Docs
- [x] `docs/data-base.md` — registrada la decisión en §2.4: `shieldUrl` en `Institution`, `avatarUrl` en `User`, URL pública de R2, sin almacenamiento local de imágenes.

## Verificación final
- [x] `cd quartz-api && npx tsc --noEmit` en verde.
- [x] `cd quartz-web && npm run build && npm run lint` — build en verde; lint sin regresiones (los 10 errores/7 warnings preexisten en `develop`, verificado con `git stash`; ninguno en archivos de este feature).
- [x] Servidor arranca sin errores de compilación ni runtime (`MongoDB connected` + `Server running on port 4000`).
- [ ] Escudo: sube desde Configuración, se ve en panel y en el PDF de informe. — **Pendiente de prueba manual en navegador** (no ejecutable desde este entorno).
- [ ] Foto: sube desde el detalle de valoración como `Jefe de Área` y como `Docente`; avatar actualizado. — **Pendiente de prueba manual en navegador**.
- [ ] Rechazos: PNG renombrado a `.webp` → 422; >40KB → 422; `Docente` en escudo → 403; `Docente` con estudiante de otra sede → 404. — **Pendiente de prueba manual (requiere cliente HTTP o navegador)**.
- [x] Repaso de aislamiento: ninguna query sin `institutionId` del token; `institutionId` nunca de body/params (verificado en `institution.service.ts` y `users.service.ts`: `findOneScoped`/`findOneAndUpdateScoped` en ambos, scoping adicional por sede para `Docente`).

## Definición de "hecho"
Código completo y verificaciones automatizadas en verde. Las pruebas manuales end-to-end (subida real de imágenes, rechazos HTTP) quedan pendientes de ejecución en navegador/cliente HTTP — no accionables desde este entorno de implementación.
