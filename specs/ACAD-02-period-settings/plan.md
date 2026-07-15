# ACAD-02 — Plan técnico

## Archivos
### quartz-api
| Acción | Ruta |
|---|---|
| crear | `src/features/institution/institution.types.ts` |
| tocar | `src/features/institution/institution.model.ts` |
| crear | `src/features/institution/institution.validation.ts` |
| crear | `src/features/institution/institution.service.ts` |
| crear | `src/features/institution/institution.controller.ts` |
| crear | `src/features/institution/institution.routes.ts` |
| crear | `src/features/period/period.types.ts` |
| tocar | `src/features/period/period.model.ts` |
| crear | `src/features/period/period.validation.ts` |
| tocar | `src/features/period/period.service.ts` |
| tocar | `src/features/period/period.controller.ts` |
| tocar | `src/features/period/period.routes.ts` |
| tocar | `src/features/report/report.types.ts` |
| tocar | `src/features/report/report.service.ts` |
| tocar | `src/app.ts` |

### quartz-web
| Acción | Ruta |
|---|---|
| crear | `src/features/institution/types/{api.ts,store.ts,index.ts}` |
| crear | `src/features/institution/useInstitutionStore.ts` |
| crear | `src/features/institution/components/ReportSettingsPanel.tsx` |
| crear | `src/features/period/types/{api.ts,store.ts,index.ts}` |
| crear | `src/features/period/usePeriodStore.ts` |
| crear | `src/features/period/components/PeriodsPanel.tsx` |
| crear | `src/features/period/components/PeriodForm.tsx` |
| tocar | `src/features/configuration/pages/ConfigurationPage.tsx` |
| tocar | `src/features/report/pages/ReportsPage.tsx` |
| tocar | `src/features/report/components/ReportsTable.tsx` |

### docs
| Acción | Ruta |
|---|---|
| tocar | `docs/data-model.md` |

## Contratos
### Tipos / DTOs
`institution.types.ts`:
```typescript
export enum ReportKind {
  CHECKLIST = 'checklist',
  COMMUNICATIVE_LETTER = 'communicative-letter',
}

export interface IInstitutionSettings {
  periodsPerYear: number;
  enabledReports: ReportKind[];
}

export interface IInstitutionDTO {
  _id: string;
  name: string;
  daneCode: string;
  address: string;
  rectorName: string;
  phoneNumber?: string;
  email: string;
  isActive: boolean;
  settings: IInstitutionSettings;
}

export type UpdateInstitutionSettingsData = Partial<IInstitutionSettings>;
```

`period.types.ts`:
```typescript
export interface IPeriodDTO {
  _id: string;
  name: string;
  year: number;
  startDate: string;   // ISO
  endDate: string;     // ISO
  closingAlertDate: string | null;
  isActive: boolean;
}

export type CreatePeriodData = {
  name: string;
  year: number;
  startDate: Date;
  endDate: Date;
  closingAlertDate?: Date | null;
  isActive?: boolean;
};

export type UpdatePeriodData = Partial<CreatePeriodData>;
```

### Modelo Mongoose
`institution.model.ts` — subdocumento nuevo (`{ _id: false }`):

| Campo | Tipo | Notas |
|---|---|---|
| `settings.periodsPerYear` | `Number` | `default: 4`, `min: 1` |
| `settings.enabledReports` | `[String]` | `enum: Object.values(ReportKind)`, `default: [CHECKLIST, COMMUNICATIVE_LETTER]` |

`settings` con `default: () => ({})` para que los documentos existentes resuelvan los defaults al leerse.

`period.model.ts` — `IPeriod` gana:

| Campo | Tipo | Notas |
|---|---|---|
| `year` | `Number` | `required`, `index: true` |
| `closingAlertDate` | `Date` | `default: null` |

Y se corrige lo existente: `institutionId` con `ref: 'Institution'` (hoy `'EducationalInstitution'`, `period.model.ts:17` — mismo bug que `Subject`, hace fallar cualquier `.populate('institutionId')`) + `index: true`.

Índice **parcial único** que respalda la invariante de un solo periodo activo:
```typescript
PeriodSchema.index(
  { institutionId: 1, isActive: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);
```
Ver Nota 1.

### Zod
`institution.validation.ts`:

| Esquema | Forma |
|---|---|
| `getInstitutionSchema` | sin params/body |
| `updateInstitutionSettingsSchema` | `body: { settings: { periodsPerYear: number().int().min(1).max(12).optional(), enabledReports: array(nativeEnum(ReportKind)).nonempty().optional() } }` |

`period.validation.ts` — reutiliza `objectIdSchema = /^[0-9a-fA-F]{24}$/` de `student-valuation.validation.ts`:

| Esquema | Forma |
|---|---|
| `createPeriodSchema` | `body: { name: string().trim().min(1).max(120), year: number().int().min(2000).max(2100), startDate: coerce.date(), endDate: coerce.date(), closingAlertDate: coerce.date().nullable().optional(), isActive: boolean().optional() }` + `.refine(endDate > startDate)` + `.refine(closingAlertDate >= endDate)` |
| `updatePeriodSchema` | `params: { periodId: objectIdSchema }` · `body: createPeriodSchema.body.partial()` (las comparaciones de fecha se revalidan en el service contra el documento persistido, ver Nota 2) |
| `deletePeriodSchema` | `params: { periodId: objectIdSchema }` |

Ningún esquema acepta `institutionId`.

### Endpoints
| Método | Ruta | Rol | Middlewares |
|---|---|---|---|
| GET | `/api/institutions/me` | Jefe de Área | `authenticateJWT → requireTenant → authorize([UserRole.JEFE_DE_AREA]) → asyncHandler` |
| PATCH | `/api/institutions/me` | Jefe de Área | `… → validate(updateInstitutionSettingsSchema) → asyncHandler` |
| GET | `/api/periods` | Autenticado | `authenticateJWT → requireTenant → asyncHandler` (existente, sin cambios) |
| POST | `/api/periods` | Jefe de Área | `… → authorize([UserRole.JEFE_DE_AREA]) → validate(createPeriodSchema) → asyncHandler` |
| PATCH | `/api/periods/:periodId` | Jefe de Área | `… → validate(updatePeriodSchema) → asyncHandler` |
| DELETE | `/api/periods/:periodId` | Jefe de Área | `… → validate(deletePeriodSchema) → asyncHandler` |

`app.ts` — montar `app.use('/api/institutions', institutionRoutes)`. `/api/periods` ya está montado (línea 30).

Usar el enum `UserRole`, no el literal `'Jefe de Área'`.

### Service — `institution.service.ts`
`Institution` es la **raíz del tenant**: no tiene campo `institutionId`, se resuelve por `_id === req.user.institutionId`. Por eso **no** se usa `base.repository` aquí — el mismo criterio ya se aplica en `report.service.ts:41` (`Institution.findById(institutionId)`), que es la única lectura del proyecto sin `findOneScoped` y es correcta.

- `getInstitutionById(institutionId)` → `Institution.findById(institutionId).lean()`; `null` → `AppError('Institución no encontrada.', 404)`.
- `updateInstitutionSettings(institutionId, data)` → `findByIdAndUpdate(institutionId, { $set: { 'settings.…': … } }, { new: true, runValidators: true })`. `enabledReports` vacío → `AppError('Debe habilitarse al menos un informe.', 422)`.

### Service — `period.service.ts`
- `getPeriodsByInstitution` — existente; añadir `year` y `closingAlertDate` al DTO.
- `createPeriod(institutionId, data)`:
  1. Leer `settings.periodsPerYear` de la institución; contar `Period` del tenant con ese `year`; si `count >= periodsPerYear` → `AppError('Se alcanzó el máximo de periodos configurado para el año.', 409)`.
  2. Si `isActive: true` → desactivar el resto: `Period.updateMany({ institutionId, isActive: true }, { isActive: false })` **antes** de crear (ver Nota 1).
  3. `createScoped(Period, institutionId, data)`.
- `updatePeriod(periodId, institutionId, data)` → `findOneAndUpdateScoped(..., { new: true, runValidators: true })`. Si `isActive: true`, desactivar los demás (`_id: { $ne: periodId }`). Revalidar el orden de fechas contra el documento fusionado (Nota 2). `null` → `AppError(..., 404)`.
- `deletePeriod(periodId, institutionId)` → `deleteOneScoped`; `deletedCount === 0` → `AppError(..., 404)`.

### report
`report.types.ts:18` declara `year: number; // Derivado de startDate, el modelo Period no lo almacena`. Con `Period.year` persistido, `report.service.ts` pasa a leerlo directo y se borra el `startDate.getFullYear()` y su comentario.

### Frontend
**`features/institution/`** y **`features/period/`** — patrón canónico de `features/learning/` (`types/{index,api,store}.ts` + `use<Feature>Store.ts` con acciones `apiClient`). Ninguno de los dos existe hoy en el front: `period/`, `subject/` y `school/` se consumen vía `sessionData` (`quartz-web/CLAUDE.md`, mapa de paridad).

- `usePeriodStore.ts`: `periods[]`, `isLoading`, `isSubmitting`, `error` + `fetchPeriods` / `createPeriod` / `updatePeriod` / `deletePeriod`. Convención de `useLearningStore.ts`: `fetch*` traga el error; `create/update/delete` hacen `set({ error })` **y** `throw` para `toast.promise`.
- `useInstitutionStore.ts`: `institution`, `isLoading`, `isSubmitting`, `error` + `fetchInstitution` / `updateSettings`.
- `components/PeriodsPanel.tsx`: `DataTable` (`components/common/DataTable.tsx`) + `FormModal` + `ConfirmationModal`. Marca visual del periodo activo.
- `components/PeriodForm.tsx`: presentacional, sin API. Campos `name`, `year`, `startDate`, `endDate`, `isActive`, `closingAlertDate`. Al fijar `endDate`, propone `closingAlertDate = endDate + 7 días` **editable** (es lo habitual: la semana de gracia para terminar de subir notas). Si el usuario lo borra, se envía `null`.
- `components/ReportSettingsPanel.tsx`: dos checkboxes (Lista de chequeo / Carta comunicativa); el submit se deshabilita con ambos desmarcados.
- `ConfigurationPage.tsx`: añadir las pestañas **Periodos** e **Informes** al shell de ACAD-01.
- `ReportsPage.tsx` / `ReportsTable.tsx`: leer `enabledReports` y ocultar la acción del informe deshabilitado. Ver Nota 4.
- Acabado con las skills `impeccable`, `emil-design-eng` y `frontend-design`.

**Coherencia con `sessionData.periods`:** igual que con `subjects` en ACAD-01, `sessionData.periods` solo se puebla en el login. Tras cada mutación, `usePeriodStore` sincroniza `useAuthStore` (extender el `setSubjects` de ACAD-01 con un `setPeriods` análogo). Consumidores hoy: los selects de periodo en Aprendizajes, Conceptos y Lista de Chequeo.

## Notas
0. **[Añadido en implementación] `enabledReports` debe viajar por `sessionData`, no solo por `GET /api/institutions/me`.** `/informes` (`ReportsPage.tsx`) es visible para `Docente` (`report.routes.ts` permite `[UserRole.JEFE_DE_AREA, UserRole.DOCENTE]`), pero `GET /api/institutions/me` está restringido a Jefe de Área (criterio EARS explícito). Un Docente no puede consultar `enabledReports` para saber qué informes ocultar. Solución: `ISessionData` gana `enabledReports: ReportKind[]`, poblado en `auth.service.ts:getSessionData()` vía `institution.service.ts:getEnabledReports(institutionId)` (lectura ligera, sin gate de rol — mismo patrón que `subjects`/`periods`/`checklistTemplates`, ya expuestos a todo autenticado). El endpoint `/api/institutions/me` sigue exclusivo de Jefe de Área para el `GET`/`PATCH` completo usado en `ReportSettingsPanel`. Archivos adicionales tocados: `auth.types.ts`, `auth.service.ts`, `institution.service.ts` (backend); `types/domain.ts` (frontend).

1. **"Un solo `Period` activo" hoy no está protegido.** `docs/domain.md:64` lo declara invariante, pero `period.model.ts:21` solo tiene `isActive: { type: Boolean, default: true }` — nada impide dos activos, y **el default es `true`**, así que cada periodo nuevo nace activo. Doble defensa: el `updateMany` en el service (intención explícita) más el índice parcial único (red de seguridad ante escrituras concurrentes). El `updateMany` + `create` no es atómico sin transacción; con un solo Jefe de Área por institución el riesgo es bajo, y el índice convierte la carrera en un `E11000` en vez de en datos corruptos. Si aparece, se traduce a `AppError(409)`.

2. **`PATCH` parcial y validación de fechas.** Zod valida el body aislado; un `PATCH` que solo trae `endDate` no puede compararse contra `startDate` porque no viene. Las tres comparaciones (`endDate > startDate`, `closingAlertDate >= endDate`) deben revalidarse en el **service**, sobre el documento fusionado con el payload, y lanzar `AppError(400)`. El `.refine()` de Zod cubre solo el `POST`.

3. **`Period.year` es `required` y los documentos existentes no lo tienen.** Al no haber runner de migraciones en el proyecto, los periodos ya creados quedarían inválidos ante `runValidators`. Opciones: (a) script puntual `updateMany` derivando `year` de `$year: '$startDate'`, ejecutado una vez; (b) declararlo opcional con fallback a `startDate.getFullYear()` en el service. **Recomendada la (a):** es un `updateMany` de una línea y deja el modelo limpio, que es el punto de persistirlo. Decidir al implementar y dejar el comando en el PR.

4. **`enabledReports` sobre la Carta Comunicativa es casi decorativo hoy.** Según `specs/reports.spec.md`, el icono de la Carta está **siempre deshabilitado** (placeholder) y el backend solo expone `GET /api/reports/checklist/:valuationId`. Desmarcarla oculta un botón que ya no hacía nada. Se implementa igual porque la configuración debe existir antes que la Carta, pero conviene no venderlo como funcionalidad visible.

5. **`periodsPerYear` no fuerza la creación.** Es un techo, no una plantilla: no se autogeneran periodos. El Jefe de Área los crea uno a uno y el sistema impide pasarse. Autogenerar fechas cuatrimestrales sería otro feature.

6. **`docs/data-model.md` describe `Period` como "cuatrimestral"** con la nota "Solo uno `isActive`". Al hacer configurable `periodsPerYear`, "cuatrimestral" pasa a ser el default (4), no una propiedad del modelo. Ajustar esa línea.

## Verificación
- `cd quartz-api && npx tsc --noEmit`
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev` en ambos paquetes: cero errores en consola.
- `GET /api/institutions/me` como Jefe de Área devuelve `settings` con los defaults sin haberlos escrito nunca.
- Crear un periodo con `isActive: true` teniendo otro activo → queda exactamente uno activo.
- Crear el periodo nº 5 con `periodsPerYear: 4` en el mismo año → `409`.
- `endDate` anterior a `startDate` → `400`. `closingAlertDate` anterior a `endDate` → `400`.
- Desmarcar Lista de chequeo en Configuración → `/informes` deja de ofrecerla. Desmarcar ambas → el submit no se habilita.
- Un Docente recibe `403` en `/api/institutions/me` y en las mutaciones de `/api/periods`.
