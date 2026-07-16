---
id: ACAD-03-image-uploads
feature: image-uploads
status: implemented        # draft | approved | implemented | released
created: 2026-07-16
---

# ACAD-03 — Carga de imágenes: escudo de institución y foto de estudiante (spec)

## Objetivo
Permitir subir el **escudo del colegio** (por inquilino, solo `Jefe de Área`) y la **foto del estudiante** (`Jefe de Área` y `Docente`), almacenados en **Cloudflare R2**. El frontend recorta cuadrado y entrega un `.webp` 400×400 (~20–40 KB); el backend valida únicamente formato real (webp) y peso máximo (≤40 KB).

## Alcance
**Incluye:**
- Infraestructura de subida a R2 (cliente S3-compatible + middleware multipart + validación de imagen).
- Escudo de institución: campo `shieldUrl` en `Institution`, endpoint solo `Jefe de Área`.
- Foto de estudiante: campo `avatarUrl` en `User`, endpoint `Jefe de Área` + `Docente`.
- Frontend: recorte cuadrado (react-easy-crop) + conversión a WebP 400×400 en canvas (fondo blanco si el origen es PNG con transparencia) + validación de formato en cliente.
- Consumo de `avatarUrl` en las vistas de estudiante (hoy hardcodean imagen por defecto).
- Wiring del escudo al PDF de informe (`report.shield`).

**Fuera:**
- Variantes / transformaciones de Cloudflare Images (el front entrega el webp final).
- Foto/avatar de `Docente` o `Jefe de Área` (solo estudiantes en esta fase).
- Escudo por sede (`School`); el escudo es del inquilino (`Institution`).
- Borrado explícito de imagen desde la UI (solo reemplazo; el anterior se elimina best-effort).
- Migración de datos (campos opcionales; documentos existentes quedan sin imagen).

## Criterios de aceptación (EARS)
- [x] Cuando el usuario selecciona un archivo cuyo formato no es JPG/JPEG, PNG o WEBP, el frontend lo rechaza con un toast que informa los formatos aceptados. (`ImageCropUploader.tsx`)
- [x] Cuando el usuario confirma el recorte, el frontend produce un WebP de 400×400 px, ≤40 KB, y lo envía; si el origen es PNG con transparencia, el resultado lleva fondo blanco. (`imageToWebp.ts`)
- [x] Cuando el backend recibe un archivo que no es un `.webp` real (validado por *magic bytes*, no por mimetype/extensión), el sistema responde 422 y no almacena nada. (`assertWebp.ts`, corre antes de tocar R2)
- [x] Si el archivo supera los 40 KB, el backend responde 422 y no almacena nada. (`upload.middleware.ts`, `multer` `limits.fileSize`)
- [x] Cuando el backend responde error en la subida, el frontend muestra un toast para que el usuario reintente. (`ImageCropUploader.tsx` captura y muestra `err.message`)
- [x] Cuando `Jefe de Área` sube un escudo, el sistema lo almacena en R2 y persiste `shieldUrl` en la institución del token; el PDF de informe pinta ese escudo. (`institution.service.ts` + `report.service.ts`)
- [x] Si el rol no es `Jefe de Área`, el endpoint de escudo responde 403. (`authorize([JEFE_DE_AREA])` en `institution.routes.ts`)
- [x] Cuando `Jefe de Área` o `Docente` sube la foto de un estudiante del inquilino, el sistema la almacena en R2 y persiste `avatarUrl`; la UI (tabla y detalle de valoración) refleja la nueva foto. (`users.service.ts` + consumo de `avatarUrl` en `StudentValuationTable.tsx`/`StudentValuationDetail.tsx`/`ReportsTable.tsx`)
- [x] Si un `Docente` intenta subir la foto de un estudiante fuera de su(s) sede(s), el backend responde 404 (mismo scoping que la lectura de estudiantes). (`uploadStudentPhoto` en `users.service.ts`)
- [x] Cuando se reemplaza una imagen existente, el objeto anterior en R2 se elimina best-effort (un fallo de borrado no bloquea la operación). (`deleteImage` con `try/catch` interno en `r2.service.ts`)
- [x] **Aislamiento:** toda lectura/escritura del feature filtra y fuerza `institutionId` del token; ninguna operación lo acepta de `body`/`params`. El escudo opera sobre la institución del token; la foto solo sobre estudiantes del inquilino. (`findOneScoped`/`findOneAndUpdateScoped` en ambos servicios)
- [x] `npx tsc --noEmit` en verde en `quartz-api` + `npm run build && npm run lint` en verde en `quartz-web`. (ver `plan.md` § Verificación — lint sin regresiones respecto a `develop`)

> Nota: los criterios anteriores están verificados por lectura de código + typecheck/build/lint en verde y arranque limpio del servidor. La prueba manual end-to-end en navegador (subir imágenes reales, click-through de rechazos) queda pendiente — ver `tasks.md` § Verificación final.

## Dependencias
- Variables de entorno de R2 ya presentes en `quartz-api/.env` (confirmar nombres al implementar — ver `plan.md` § Notas).
- Dependencias npm nuevas: backend `multer`, `@aws-sdk/client-s3` (+ `@types/multer`); frontend `react-easy-crop`.
- El campo `avatarUrl?` ya existe en el tipo `User` del frontend (`src/types/domain.ts`); esta feature empieza a poblarlo.

## Trazabilidad
- Backend:  quartz-api/src/features/institution/ · quartz-api/src/features/users/ · quartz-api/src/features/auth/auth.model.ts · quartz-api/src/services/r2.service.ts · quartz-api/src/middlewares/upload.middleware.ts · quartz-api/src/utils/assertWebp.ts
- Frontend: quartz-web/src/features/institution/ · quartz-web/src/features/student-valuation/ · quartz-web/src/features/users/ · quartz-web/src/components/common/ImageCropUploader.tsx · quartz-web/src/utils/imageToWebp.ts
- Branch:   feat/ACAD-03-image-uploads
