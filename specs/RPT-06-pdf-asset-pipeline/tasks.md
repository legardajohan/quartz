# RPT-06 — Tasks

> Se implementa **después** de `RPT-05-communicative-letter-fixes` (aporta la banda de footer
> que aquí pasa a base64).

## Backend (`quartz-api`)

### 1. Escudo por institución
- [x] `institution.types.ts` — `IInstitutionBrandingDTO` + `shieldVersion: string | null`.
- [x] `institution.service.ts` — helper de módulo `resolveShieldVersion(shieldJpgUrl?)` con
      `/shield-(\d+)\.jpg$/`.
- [x] `institution.service.ts` — `getInstitutionBranding` amplía su `.select(...)` a
      `'name shieldUrl shieldJpgUrl'` y devuelve `shieldVersion`.
- [x] `institution.service.ts` — `getInstitutionShieldJpg(institutionId)`: `findById` +
      `.select('shieldJpgUrl').lean()` → `keyFromPublicUrl` → `getImage`; `AppError(..., 404)`
      si no hay escudo o R2 no lo devuelve; retorna `{ buffer, contentType, version }`.
- [x] `institution.controller.ts` — `getMyInstitutionShieldController` con `ETag: W/"<version>"`,
      `Cache-Control: private, max-age=86400, must-revalidate` y `304` ante `If-None-Match`
      coincidente. Sin `try/catch`, `institutionId` desde `req.user!`.
- [x] `institution.routes.ts` — `GET /me/shield.jpg` con
      `authenticateJWT → requireTenant → authorize([JEFE_DE_AREA, DOCENTE]) → asyncHandler`.
      Sin `validate` (no hay params/body/query).

### 2. Retirada del proxy por valuación
- [x] `report.routes.ts` — eliminar las rutas `/checklist/:valuationId/shield` y
      `/communicative-letter/:valuationId/shield` y sus imports.
- [x] `report.controller.ts` — eliminar `getChecklistReportShieldController` y
      `getCommunicativeLetterShieldController`.
- [x] `report.service.ts` — eliminar `getChecklistReportShield` y `getCommunicativeLetterShield`.
- [x] `report.validation.ts` — eliminar `getChecklistReportShieldSchema` y
      `getCommunicativeLetterShieldSchema`.
- [x] `report.service.ts` — quitar los imports de `getImage` / `keyFromPublicUrl` si quedaron
      huérfanos.

## Frontend (`quartz-web`)

### 3. Assets en base64
- [x] Script puntual en el scratchpad: leer los 3 iconos JPG + `footer.jpg` y emitir el módulo
      de data URIs. No se añade dependencia ni paso de build al proyecto.
- [x] `features/report/assets/reportAssets.ts` — `STATUS_ICON_JPG_DATA_URI`,
      `REPORT_FOOTER_BANNER_DATA_URI` y reexport de `QUARTZ_LOGO_DATA_URI`.
- [x] Mover `components/quartzLogoDataUri.ts` → `assets/quartzLogoDataUri.ts`; actualizar el
      import de `ChecklistReportDocument.tsx`.
- [x] `statusVisuals.ts` — conservar `STATUS_ICON_SVG` (URL de Vite, uso web) y reexportar
      `STATUS_ICON_JPG` desde `reportAssets`; quitar los imports JPG de Vite y el de `footer.jpg`.
- [x] Verificar el presupuesto de peso de `plan.md` (≤ 210 KB en el chunk de informes);
      reoptimizar cualquier asset que se pase antes de incrustarlo. (Total real: ~97 KB de
      iconos+footer más el logo, muy por debajo del presupuesto — ningún asset se reoptimizó.)

### 4. Caché del escudo
- [x] `features/institution/types/` — DTO de branding + `shieldVersion`.
- [x] `features/institution/useInstitutionStore.ts` — `branding` incorpora `shieldVersion`.
- [x] Verificar que `fetchBranding()` se dispara para todos los roles en los caminos que abren
      informes; si algún camino no lo cubre, dispararlo desde el hook cuando `branding` sea nulo.
      (`InstitutionBrand` ya está SIEMPRE montado en `ProfileNavbar`/`SidebarMenu` del layout
      `Dashboard`, para cualquier rol — no hizo falta disparo adicional.)
- [x] `features/institution/queries/useInstitutionShieldQuery.ts` — `useQuery` con
      `queryKey: ['institution-shield', institutionId, shieldVersion]`, `enabled`,
      `staleTime`/`gcTime` infinitos, `initialData` desde `localStorage`, escritura + purga de
      versiones anteriores. Toda lectura/escritura de `localStorage` en `try/catch`. Devuelve
      `{ src, isLoading }`. (Las funciones de `localStorage` se aislaron en
      `features/institution/shieldCache.ts` — no estaba en el plan original — para que
      `useAuthStore.logout()` pudiera purgar la caché sin crear un ciclo de imports con este
      hook, que a su vez depende de `useAuthStore` para `institutionId`.)
- [x] `features/auth/useAuthStore.ts` — `logout()` purga las claves `quartz:pdf-shield:*`.
- [x] `components/CommunicativeLetterModal.tsx` y `components/ChecklistReportModal.tsx` —
      sustituir `usePdfShieldImage` por el nuevo hook; `hasSource` pasa a ser `!!shieldVersion`.
- [x] Borrar `features/report/usePdfShieldImage.ts` y confirmar que no queda ninguna referencia.

### 5. Shell reutilizable
- [x] `components/LetterPageShell.tsx` — extraer de `CommunicativeLetterDocument.tsx` el `<Page>`,
      la cabecera con escudo, la fila de metadatos, la banda de footer `fixed` y la paginación,
      con sus estilos. Props `{ institution, period, student, shieldSrc, generatedAt, children }`
      (se añadió `generatedAt`, necesario para "Fecha de impresión" en la fila de metadatos).
- [x] `components/CommunicativeLetterDocument.tsx` — queda con `<Document>`, mapeo de
      dimensiones, observaciones y firma, envolviendo su contenido en `LetterPageShell`.
- [x] `LetterPageShell.tsx` — mover el número de página a superposición sobre la esquina
      inferior derecha del footer banner (orden Image→Text en JSX, footer primero); quitar
      `PAGE_NUMBER_ROW` de `paddingBottom` y de las constantes si queda sin otro uso.
- [ ] Verificar manualmente que no choca con el arte del footer en "N / M" de 1 y 2 dígitos.
      **Pendiente del usuario** (verificación visual en navegador, fuera del alcance de Claude
      según `quartz-web/CLAUDE.md`).
- [ ] Comparar el PDF generado contra el de RPT-05: debe ser visualmente idéntico salvo la
      posición del número de página (cambio intencional de esta tarea). **Pendiente del usuario.**

### 6. Aislamiento del peso
- [x] `src/App.tsx` — `React.lazy` para `ReportsPage` y `CommunicativeLetterEditPage`, envueltos
      en `<Suspense fallback={<Loading />}>` (`components/ui/Loading` ya existe).
- [x] Medir el tamaño de `index-*.js` antes y después; registrar ambas cifras en el PR.
      Antes: `index-BHt37x97.js` 3396.60 kB (gzip 1006.97 kB), sin code-splitting. Después:
      `index-CfRkyriP.js` 1584.97 kB (gzip 405.11 kB) + `ReportsPage-*.js` 1743.80 kB (lazy,
      incluye `@react-pdf/renderer`) + `statusVisuals-*.js` 97.87 kB (lazy, assets base64) +
      `CommunicativeLetterEditPage-*.js` 21.33 kB (lazy). Bundle inicial: -53% (-60% gzip).

## Verificación final
- [x] `cd quartz-api && npx tsc --noEmit` en verde.
- [x] `cd quartz-web && npm run build && npm run lint` en verde (sin errores nuevos; los 4
      errores y 3 warnings restantes de `npm run lint` son preexistentes, verificado contra
      `HEAD` antes de este spec).
- [x] `npm run build` muestra un chunk separado con `@react-pdf/renderer` (solo aparece en
      `ReportsPage-*.js`, confirmado por grep), e `index-*.js` más pequeño que antes del spec.
- [x] Servidor arranca sin errores de compilación ni runtime (backend: conecta a MongoDB, solo
      falla el bind de puerto por haber ya otra instancia corriendo; frontend: Vite arranca
      limpio).
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
- [x] Repaso de aislamiento: ninguna query del feature sin `institutionId` del token; el nuevo
      endpoint no lee `institutionId` de `body`, `params` ni `query` (sin `:params` en la ruta,
      `institutionId` sale de `req.user!` en el controller).

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
