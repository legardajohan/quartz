---
id: RPT-06-pdf-asset-pipeline
feature: pdf-asset-pipeline
status: draft
created: 2026-09-08
---

# RPT-06 — Pipeline de assets del PDF y caché del escudo (spec)

## Objetivo
Eliminar toda petición de imagen del camino de generación de informes: el escudo del inquilino
pasa de descargarse **por estudiante** a resolverse **una vez por sesión** con invalidación por
versión, y los assets estáticos del PDF (iconos de estado, banda de footer, logo) pasan a base64
incrustado. Es la causa raíz del timeout que RPT-05 solo amortigua, y la base para el descargue
masivo de informes.

## Alcance
**Incluye:**
- **Backend — escudo por institución.** Nuevo `GET /api/institutions/me/shield.jpg` que devuelve
  el JPG del inquilino del token con `ETag` y `Cache-Control`, y responde `304` ante un
  `If-None-Match` vigente sin llegar a leer R2. `getInstitutionBranding` expone además
  `shieldVersion`, derivado de la clave R2 que **ya** lleva versión
  (`institutions/<id>/shield-<timestamp>.jpg`, `institution.service.ts:204,212`): ningún campo
  nuevo en el modelo.
- **Backend — retirada del proxy por valuación.** Se eliminan las rutas
  `GET /api/reports/checklist/:valuationId/shield` y
  `GET /api/reports/communicative-letter/:valuationId/shield`, sus controllers, sus schemas Zod
  y las funciones `getChecklistReportShield` / `getCommunicativeLetterShield` (idénticas entre
  sí salvo el mensaje de error). Cada llamada a esas rutas costaba 3 lecturas a Mongo —una de
  ellas hidrataba y poblaba la valoración completa solo para leer `globalStatus`— más un
  `GetObject` a R2.
- **Frontend — caché del escudo.** `usePdfShieldImage` se sustituye por una query de TanStack
  Query indexada por `(institutionId, shieldVersion)`, con persistencia en `localStorage` para
  sobrevivir a recargas y purga en `logout()`.
- **Frontend — assets en base64.** Los 3 iconos de estado JPG y la banda de footer pasan de URL
  de Vite a data URI en un módulo de assets, junto al logo Quartz que ya seguía ese patrón
  (`quartzLogoDataUri.ts`). Con ello react-pdf deja de emitir fetch por imagen.
- **Frontend — aislamiento del peso.** `ReportsPage` y `CommunicativeLetterEditPage` pasan a
  `React.lazy` + `Suspense`, de modo que `@react-pdf/renderer` y los assets base64 salen del
  bundle inicial. Hoy `App.tsx` importa todo en estático.
- **Frontend — shell reutilizable.** `CommunicativeLetterDocument` se separa en un shell
  invariante (`LetterPageShell`: cabecera de institución con escudo, fila de metadatos, banda de
  footer, paginación) y el cuerpo por estudiante. Una sola definición del formato para el camino
  masivo, sin cambio visual en el PDF.

**Fuera:**
- Generación masiva de informes: es el consumidor futuro de este trabajo, no parte de él.
- Render de PDF en backend y almacenamiento de PDFs — prohibido por `docs/domain.md:66`.
- Congelar layout o saltos de página entre estudiantes — ver `plan.md` § *Plantilla reutilizable*.
- Optimizar los round-trips a Mongo de `getCommunicativeLetterReport` (`getStudentValuationById`
  sin `.lean()` + 3 `populate`): deuda anotada, spec aparte.
- Índice único sobre `(institutionId, periodId, subjectId, valuationType)` en `Concept`.
- La variante `.webp` del escudo (`shieldUrl`) y su consumo en `InstitutionBrand`: no cambian.
- Los 9 assets sin trackear `{achieved,in-process,with-dificulty}-icon-0{1,2,3}.jpg`.

## Criterios de aceptación (EARS)
- [ ] Cuando se abre un informe y el escudo del inquilino ya está en caché para el
      `shieldVersion` vigente, el sistema no emite ninguna petición de imagen.
- [ ] Cuando se abre un informe por primera vez en la sesión, el sistema descarga el escudo una
      sola vez y lo reutiliza para todos los informes siguientes del mismo inquilino.
- [ ] Cuando el usuario recarga la página, el sistema recupera el escudo desde `localStorage`
      sin volver a pedirlo, mientras `shieldVersion` no cambie.
- [ ] Cuando el Jefe de Área sube un escudo nuevo, `shieldVersion` cambia y la siguiente
      apertura de informe descarga el escudo nuevo sin acción del usuario.
- [ ] Cuando el navegador revalida con `If-None-Match` y la versión coincide, el backend
      responde `304` sin leer R2.
- [ ] Cuando el usuario cierra sesión, el sistema purga del `localStorage` las entradas de
      escudo cacheadas.
- [ ] Si el inquilino no tiene escudo (`shieldVersion` nulo), el sistema genera el PDF sin
      escudo, sin error y sin emitir petición alguna.
- [ ] Cuando el PDF renderiza iconos de estado o la banda de footer, el sistema no emite ninguna
      petición de red por esas imágenes.
- [ ] Cuando se carga la aplicación por primera vez, `@react-pdf/renderer` y los assets base64
      no forman parte del bundle inicial (chunk separado, verificable en `npm run build`).
- [ ] Cuando se renderiza la Carta Comunicativa, la cabecera, los metadatos, la banda de footer
      y la paginación provienen de `LetterPageShell` y no están duplicados en el cuerpo del
      documento; el PDF resultante es visualmente idéntico al de RPT-05.
- [ ] Si un Docente solicita `GET /institutions/me/shield.jpg`, el sistema responde el escudo de
      **su** inquilino; si el rol no es `Jefe de Área` ni `Docente`, responde 403.
- [ ] Cuando se invoca cualquiera de las rutas eliminadas `/reports/*/:valuationId/shield`, el
      sistema responde 404 y ningún componente del frontend las referencia.
- [ ] **Aislamiento:** `GET /institutions/me/shield.jpg` resuelve `institutionId` desde el
      token; ninguna operación del feature lo acepta de `body`, `params` ni `query`.
- [ ] `npx tsc --noEmit` en verde en `quartz-api` · `npm run build && npm run lint` en verde en
      `quartz-web`.

## Dependencias
- RPT-05-communicative-letter-fixes: aporta la banda de footer y el override de timeout que este
  spec convierte en innecesario. Se implementa **después** de RPT-05.
- ACAD-03-image-uploads (implementado): `shieldUrl` / `shieldJpgUrl`, `r2.service.ts`,
  `keyFromPublicUrl`, y la convención de clave `shield-<timestamp>` de la que sale la versión.
- `@tanstack/react-query@^5.101.0` ya instalado en `quartz-web` (patrón de referencia:
  `features/users/queries/useUsersQuery.ts`).
- `src/utils/blobToDataUrl.ts` ya existente.

## Trazabilidad
- Backend:  quartz-api/src/features/institution/ · quartz-api/src/features/report/
- Frontend: quartz-web/src/features/report/ · quartz-web/src/features/institution/ · quartz-web/src/App.tsx
- Branch:   feat/RPT-02-communicative-letter (continúa sobre la rama actual, sin rama nueva)
