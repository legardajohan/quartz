# VAL-04 — Plan técnico

## Archivos

### quartz-api
| Acción | Ruta |
|---|---|
| tocar | `src/features/student-valuation/student-valuation.service.ts` |
| tocar | `src/features/student-valuation/student-valuation.controller.ts` |
| tocar | `src/features/student-valuation/student-valuation.routes.ts` |
| tocar | `src/features/student-valuation/student-valuation.types.ts` |

### quartz-web
| Acción | Ruta |
|---|---|
| tocar | `src/features/student-valuation/components/StudentValuationDetail.tsx` |
| tocar | `src/features/student-valuation/pages/StudentValuationsPage.tsx` |

## Contratos

### Backend — contexto del solicitante

Tipo compartido en `student-valuation.types.ts`:

```ts
export interface RequestorScope {
  role: UserRole;
  schoolId?: string;
}
```

Los 6 controllers lo arman igual (`student-valuation.controller.ts`):

```ts
const scope: RequestorScope = {
  role: req.user!.role,
  schoolId: req.user!.schoolId?.toString(),
};
```

**Añadido durante la implementación:** en vez de repetir ese literal 6 veces, se extrajo `buildRequestorScope(req): RequestorScope` como función privada del controller. Mismo valor resultante en los 6 endpoints, sin cambio de contrato ni de comportamiento — solo evita la duplicación literal dentro de un único archivo.

`schoolId` llega vía `toSafeUser()` (`auth.model.ts:69`), **no** vía JWT: el payload solo lleva `sub`, `institutionId`, `role`, `firstName` (`auth.middleware.ts:7-12`), y `authenticateJWT` recarga el usuario de Mongo en cada request (`auth.middleware.ts:28`).

### Backend — guard de sede

Helper privado en `student-valuation.service.ts`, junto a los demás helpers del archivo:

```ts
async function assertStudentInScope(
  studentId: Types.ObjectId | string,
  institutionId: string,
  scope: RequestorScope
): Promise<void>
```

- Si `scope.role !== UserRole.DOCENTE` → retorna sin hacer nada (el Jefe de Área abarca la institución).
- Si es Docente y no hay `scope.schoolId` → `AppError('Valoración no encontrada.', 404)`.
- Carga el estudiante con `findByIdScoped(User, institutionId, studentId).lean()` y compara `schoolId`.
- No coincide o no existe → `AppError('Valoración no encontrada.', 404)`.

**404 y no 403, a propósito:** un 403 confirmaría que ese `valuationId` existe en otra sede. Es el mismo criterio ya aplicado en `users.service.ts:379-384` para la subida de foto. `report.service.ts:226-227` usa 403 en el camino individual; esa inconsistencia se deja como está (no es alcance de esta spec) y se anota en `docs/roles-permissions.md`.

### Backend — aplicación del guard

| Función | Línea actual | De dónde sale el `studentId` |
|---|---|---|
| `initializeStudentValuation` | `:269` | parámetro `studentId` — validar **antes** de crear |
| `getStudentValuations` | `:257` | parámetro `studentId` — validar antes de consultar |
| `getStudentValuationById` | `:242` | del documento encontrado (`valuation.studentId`) — validar **después** del `findOneScoped`, antes de `populateAndMapValuation` |
| `updateStudentValuation` | `:358` | del documento encontrado — validar tras el 404 de tenant, antes de mutar |
| `updateValuationConcepts` | `:515` | del documento encontrado — ídem |
| `deleteStudentValuation` | `:581` | **cambia de forma**: hoy hace `deleteOneScoped` directo sin leer. Pasa a `findOneScoped` → `assertStudentInScope` → `deleteOneScoped` |

Las tres funciones que reciben `studentId` por parámetro pagan una consulta extra a `User`; las que parten del documento ya tienen el `studentId` embebido (`student-valuation.model.ts:30`) y solo pagan la consulta del estudiante. Es una lectura `.lean()` por operación: aceptable frente a la fuga que cierra.

`getStudentValuationById` se invoca internamente al final de `initializeStudentValuation` (`:354`) — el guard ahí es redundante pero inocuo, y se deja por seguridad de defensa en profundidad.

### Backend — firmas resultantes

```ts
getStudentValuationById(valuationId: string, institutionId: string, scope: RequestorScope)
getStudentValuations(studentId: string, institutionId: string, scope: RequestorScope)
initializeStudentValuation(studentId: string, teacherId: string, institutionId: string, periodId: string, scope: RequestorScope)
updateStudentValuation(valuationId: string, institutionId: string, updateData: StudentValuationUpdateData, scope: RequestorScope)
updateValuationConcepts(valuationId: string, institutionId: string, data: StudentValuationConceptsUpdateData, scope: RequestorScope)
deleteStudentValuation(valuationId: string, institutionId: string, scope: RequestorScope)
```

### Endpoints

| Método | Ruta | Rol | Cambio |
|---|---|---|---|
| POST | `/api/student-valuations/student/:studentId/period/:periodId` | Jefe de Área · Docente | + guard de sede |
| GET | `/api/student-valuations/student/:studentId` | Jefe de Área · Docente | + guard de sede |
| GET | `/api/student-valuations/:valuationId` | Jefe de Área · Docente | + guard de sede |
| PATCH | `/api/student-valuations/:valuationId` | Jefe de Área · Docente | + guard de sede |
| PATCH | `/api/student-valuations/:valuationId/concepts` | Jefe de Área · Docente | + guard de sede |
| DELETE | `/api/student-valuations/:valuationId` | Jefe de Área · **Docente** | **+ rol nuevo** + guard de sede |

Middlewares sin cambios: `authenticateJWT → requireTenant → authorize([...]) → validate(schema) → asyncHandler(controller)`. Único cambio en `routes`: añadir `UserRole.DOCENTE` al `authorize` del DELETE (`student-valuation.routes.ts:69`).

### Frontend — quitar la carga de foto

`components/StudentValuationDetail.tsx` — la foto deja de ser editable desde aquí para **todos** los roles:

| Línea | Acción |
|---|---|
| `:18` | borrar `PHOTO_UPLOAD_ROLES` |
| `:39` | borrar `useUploadStudentPhotoMutation()` y su import |
| `:40` | borrar `canUploadPhoto` |
| `:42-45` | borrar `handlePhotoUpload` |
| `:165-176` | dejar solo la rama `<Avatar src={studentAvatarUrl \|\| AVATAR_FALLBACK} alt="user_image" size="lg" />`; borrar el `ImageCropUploader` y el ternario |

`useUsersQuery({ id: studentId })` (`:37-38`) se conserva: sigue haciendo falta para leer `avatarUrl`. Revisar si `ImageCropUploader` y `Progress` quedan sin usar en los imports.

Tras este cambio quedan **dos** consumidores de `ImageCropUploader` en la app: `UserForm.tsx:127` (foto de usuario) e `InstitutionShieldPanel.tsx:37` (escudo).

### Frontend — filtro de sede en `/evaluacion`

`pages/StudentValuationsPage.tsx`:

- Nuevo `const { isAreaLead, schoolId } = usePermissions();`
- Preseleccionar una sola vez, cuando lleguen los usuarios y por tanto las sedes derivadas (`schools`, `:54-58`):
  ```ts
  const hasInitializedSchoolFilter = useRef(false);
  useEffect(() => {
    if (hasInitializedSchoolFilter.current || !isAreaLead || !schoolId || schools.length === 0) return;
    if (schools.some((s) => s._id === schoolId)) setSelectedSchools([schoolId]);
    hasInitializedSchoolFilter.current = true;
  }, [isAreaLead, schoolId, schools]);
  ```
  Mismo patrón que `hasInitializedFilter` en `ConceptsPage.tsx:44,50-59`. El guard con `useRef` es lo que permite que el usuario **quite** la sede sin que el efecto se la vuelva a poner.
- El `filterGroups` (`:79-108`) arma el grupo "Sede" (`:100-107`) condicionalmente: se omite cuando `!isAreaLead`. Para el Docente el backend devuelve una sola sede, así que un filtro de un único valor es ruido sin función.
- `StudentValuationTable.tsx:250-266` (botón eliminar) **no se toca**: ahora ambos roles pueden eliminar y el backend acota por sede.

## Notas
- La lista de `/evaluacion` sale de `GET /api/users?role=Estudiante` (`useStudentValuationStore.ts:19-31`), que **ya** acota al Docente a su sede (`users.service.ts:96-104`). Esta spec no cambia eso; cierra el acceso **directo por id**, que era el camino sin protección.
- Las sedes del filtro se derivan de los usuarios recibidos, no de `GET /schools` (`StudentValuationsPage.tsx:54-58`). Por eso la preselección debe esperar a que `users` esté cargado, y por eso se verifica que el `schoolId` del Jefe de Área esté entre las sedes disponibles antes de preseleccionarlo (si no tiene estudiantes en su sede, el filtro dejaría la tabla vacía sin explicación).
- Tras esta spec, `docs/roles-permissions.md` deja de tener el "Hueco conocido" del final; se actualiza en `USR-02`, que es la última de las tres.

## Verificación
- `cd quartz-api && npx tsc --noEmit`
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev` en ambos paquetes: cero errores en consola.
- **Prueba de aislamiento (la crítica)** — token de un Docente de la Sede A contra una valoración de la Sede B:
  ```
  GET    /api/student-valuations/:valuationId            → 404
  GET    /api/student-valuations/student/:studentId      → 404
  PATCH  /api/student-valuations/:valuationId            → 404
  PATCH  /api/student-valuations/:valuationId/concepts   → 404
  DELETE /api/student-valuations/:valuationId            → 404
  POST   /api/student-valuations/student/:studentId/period/:periodId → 404
  ```
  Las mismas seis con un estudiante de **su** sede → `200`.
- Manual (Docente): `/evaluacion` lista solo su sede, sin filtro "Sede"; crea, edita y elimina evaluaciones; en `/evaluacion/:studentId` la foto es solo lectura.
- Manual (Jefe de Área): `/evaluacion` abre con su sede preseleccionada, puede quitarla y ver todas; elimina evaluaciones de cualquier sede.
