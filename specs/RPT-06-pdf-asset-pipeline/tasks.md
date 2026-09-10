# RPT-06 — Tasks

> Se implementa **después** de `RPT-05-communicative-letter-fixes` (aporta la banda de footer
> que aquí pasa a base64).

## Backend (`quartz-api`)

### 1. Escudo por institución
- [ ] `institution.types.ts` — `IInstitutionBrandingDTO` + `shieldVersion: string | null`.
- [ ] `institution.service.ts` — helper de módulo `resolveShieldVersion(shieldJpgUrl?)` con
      `/shield-(\d+)\.jpg$/`.
- [ ] `institution.service.ts` — `getInstitutionBranding` amplía su `.select(...)` a
      `'name shieldUrl shieldJpgUrl'` y devuelve `shieldVersion`.
- [ ] `institution.service.ts` — `getInstitutionShieldJpg(institutionId)`: `findById` +
      `.select('shieldJpgUrl').lean()` → `keyFromPublicUrl` → `getImage`; `AppError(..., 404)`
      si no hay escudo o R2 no lo devuelve; retorna `{ buffer, contentType, version }`.
- [ ] `institution.controller.ts` — `getMyInstitutionShieldController` con `ETag: W/"<version>"`,
      `Cache-Control: private, max-age=86400, must-revalidate` y `304` ante `If-None-Match`
      coincidente. Sin `try/catch`, `institutionId` desde `req.user!`.
- [ ] `institution.routes.ts` — `GET /me/shield.jpg` con
      `authenticateJWT → requireTenant → authorize([JEFE_DE_AREA, DOCENTE]) → asyncHandler`.
      Sin `validate` (no hay params/body/query).

### 2. Retirada del proxy por valuación
- [ ] `report.routes.ts` — eliminar las rutas `/checklist/:valuationId/shield` y
      `/communicative-letter/:valuationId/shield` y sus imports.
- [ ] `report.controller.ts` — eliminar `getChecklistReportShieldController` y
      `getCommunicativeLetterShieldController`.
- [ ] `report.service.ts` — eliminar `getChecklistReportShield` y `getCommunicativeLetterShield`.
- [ ] `report.validation.ts` — eliminar `getChecklistReportShieldSchema` y
      `getCommunicativeLetterShieldSchema`.
- [ ] `report.service.ts` — quitar los imports de `getImage` / `keyFromPublicUrl` si quedaron
      huérfanos.

## Frontend (`quartz-web`)

### 3. Assets en base64
- [ ] Script puntual en el scratchpad: leer los 3 iconos JPG + `footer.jpg` y emitir el módulo
      de data URIs. No se añade dependencia ni paso de build al proyecto.
- [ ] `features/report/assets/reportAssets.ts` — `STATUS_ICON_JPG_DATA_URI`,
      `REPORT_FOOTER_BANNER_DATA_URI` y reexport de `QUARTZ_LOGO_DATA_URI`.
- [ ] Mover `components/quartzLogoDataUri.ts` → `assets/quartzLogoDataUri.ts`; actualizar el
      import de `ChecklistReportDocument.tsx`.
- [ ] `statusVisuals.ts` — conservar `STATUS_ICON_SVG` (URL de Vite, uso web) y reexportar
      `STATUS_ICON_JPG` desde `reportAssets`; quitar los imports JPG de Vite y el de `footer.jpg`.
- [ ] Verificar el presupuesto de peso de `plan.md` (≤ 210 KB en el chunk de informes);
      reoptimizar cualquier asset que se pase antes de incrustarlo.

### 4. Caché del escudo
- [ ] `features/institution/types/` — DTO de branding + `shieldVersion`.
- [ ] `features/institution/useInstitutionStore.ts` — `branding` incorpora `shieldVersion`.
- [ ] Verificar que `fetchBranding()` se dispara para todos los roles en los caminos que abren
      informes; si algún camino no lo cubre, dispararlo desde el hook cuando `branding` sea nulo.
- [ ] `features/institution/queries/useInstitutionShieldQuery.ts` — `useQuery` con
      `queryKey: ['institution-shield', institutionId, shieldVersion]`, `enabled`,
      `staleTime`/`gcTime` infinitos, `initialData` desde `localStorage`, escritura + purga de
      versiones anteriores. Toda lectura/escritura de `localStorage` en `try/catch`. Devuelve
      `{ src, isLoading }`.
- [ ] `features/auth/useAuthStore.ts` — `logout()` purga las claves `quartz:pdf-shield:*`.
- [ ] `components/CommunicativeLetterModal.tsx` y `components/ChecklistReportModal.tsx` —
      sustituir `usePdfShieldImage` por el nuevo hook; `hasSource` pasa a ser `!!shieldVersion`.
- [ ] Borrar `features/report/usePdfShieldImage.ts` y confirmar que no queda ninguna referencia.

### 5. Shell reutilizable
- [ ] `components/LetterPageShell.tsx` — extraer de `CommunicativeLetterDocument.tsx` el `<Page>`,
      la cabecera con escudo, la fila de metadatos, la banda de footer `fixed` y la paginación,
      con sus estilos. Props `{ institution, period, student, shieldSrc, children }`.
- [ ] `components/CommunicativeLetterDocument.tsx` — queda con `<Document>`, mapeo de
      dimensiones, observaciones y firma, envolviendo su contenido en `LetterPageShell`.
- [ ] Comparar el PDF generado contra el de RPT-05: debe ser visualmente idéntico.

### 6. Aislamiento del peso
- [ ] `src/App.tsx` — `React.lazy` para `ReportsPage` y `CommunicativeLetterEditPage`, envueltos
      en `<Suspense fallback={<Loading />}>` (`components/ui/Loading` ya existe).
- [ ] Medir el tamaño de `index-*.js` antes y después; registrar ambas cifras en el PR.

## Verificación final
- [ ] `cd quartz-api && npx tsc --noEmit` en verde.
- [ ] `cd quartz-web && npm run build && npm run lint` en verde (sin errores nuevos).
- [ ] `npm run build` muestra un chunk separado con `@react-pdf/renderer`, e `index-*.js` más
      pequeño que antes del spec.
- [ ] Servidor arranca sin errores de compilación ni runtime.
- [ ] Manual — abrir dos informes seguidos con DevTools/Network filtrando imágenes: la segunda
      apertura registra **cero** peticiones de imagen.
- [ ] Manual — recargar la página y abrir un informe: el escudo sale de `localStorage`, sin
      petición.
- [ ] Manual — subir un escudo nuevo desde Configuración y abrir un informe: aparece el escudo
      nuevo sin recargar ni limpiar caché.
- [ ] Manual — segunda sesión del día (caché HTTP vigente): la revalidación responde `304`.
- [ ] Manual — cerrar sesión: las claves `quartz:pdf-shield:*` desaparecen del `localStorage`.
- [ ] Manual — inquilino sin escudo: el PDF se genera sin escudo, sin error ni petición fallida.
- [ ] Manual — como Docente: `GET /institutions/me/shield.jpg` devuelve el escudo de su
      inquilino; las rutas eliminadas responden 404.
- [ ] Repaso de aislamiento: ninguna query del feature sin `institutionId` del token; el nuevo
      endpoint no lee `institutionId` de `body`, `params` ni `query`.

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
