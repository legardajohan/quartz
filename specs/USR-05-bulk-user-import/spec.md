---
id: USR-05-bulk-user-import
feature: bulk-user-import
status: implemented  # draft | approved | implemented | released
created: 2026-10-06
---

# USR-05 — Cargue masivo de usuarios desde Excel (spec)

## Objetivo
Que el Jefe de Área dé de alta en lote **Estudiantes** y **Equipo docente** (Docente + Jefe de Área) desde una plantilla `.xlsx`, guardando solo las filas válidas e informando qué filas se omitieron y por qué.

## Alcance
**Incluye:**
- Botón **"Cargue masivo"** en `/gestion/usuarios`, sobre la pestaña activa (`Estudiantes` | `Equipo docente`).
- Descarga de plantilla `.xlsx` por pestaña, generada por inquilino con listas desplegables (Sede, Jornada, Tipo de identificación, Rol).
- Flujo en dos pasos: **previsualizar** (valida sin guardar) → **confirmar** (guarda las válidas) → informe final.
- Docente/Jefe de Área nacen `Pendiente` y reciben la invitación por correo (USR-04).

**Fuera:**
- Formatos `.xls` y `.csv`.
- Actualizar usuarios existentes (upsert); toda coincidencia se omite.
- Fotos, eliminación masiva, cambio de rol.
- Cargue por Docente.
- Grados distintos a Transición (columna de grado inexistente en esta fase).
- Historial de cargues, informe descargable, cola o reintentos automáticos de correo.

## Columnas de la plantilla
Fila 1 = encabezados exactos; datos desde la fila 2. `*` = obligatoria.

| Estudiantes (`kind=students`) | Equipo docente (`kind=staff`) |
|---|---|
| Primer nombre* | Rol* (`Docente` / `Jefe de Área`) |
| Segundo nombre | Primer nombre* |
| Primer apellido* | Segundo nombre |
| Segundo apellido | Primer apellido* |
| Tipo de identificación* (`CC`/`TI`/`RC`) | Segundo apellido |
| Número de identificación* | Tipo de identificación* |
| Teléfono | Número de identificación* |
| Sede* (nombre) | Correo* |
| Jornada (solo si `multipleShifts`) | Teléfono |
| | Sede* (nombre) |

## Criterios de aceptación (EARS)

**Acceso y UI**
- [x] Cuando el Jefe de Área abre `/gestion/usuarios`, el sistema muestra el botón "Cargue masivo" junto a "Crear"; el Docente no lo ve.
- [x] Cuando el Jefe de Área pulsa "Cargue masivo", el sistema abre un modal ligado a la pestaña activa con el título "Cargue masivo de Estudiantes" o "Cargue masivo de Equipo docente".
- [x] Si un usuario con rol distinto a Jefe de Área llama a cualquier endpoint de import, el sistema responde `403`.

**Plantilla**
- [x] Cuando el Jefe de Área pulsa "Descargar plantilla", el sistema descarga `plantilla-estudiantes.xlsx` o `plantilla-equipo-docente.xlsx` con los encabezados de la tabla "Columnas de la plantilla".
- [x] La plantilla incluye listas desplegables con las sedes (`name`) del inquilino, sus jornadas (si `multipleShifts`), los tipos de identificación y, en staff, los roles.
- [x] Si la institución no tiene `multipleShifts`, la plantilla de estudiantes no incluye la columna Jornada.

**Archivo (rechazo total, `422`, sin informe por fila)**
- [x] Si el archivo no es `.xlsx` válido, el sistema responde `422` "El archivo debe ser una hoja de cálculo .xlsx.".
- [x] Si el archivo supera 1 MB, el sistema responde `422` "El archivo supera el máximo de 1 MB.".
- [x] Si los encabezados de la fila 1 no coinciden con la plantilla del `kind`, el sistema responde `422` "El archivo no corresponde a la plantilla de <Estudiantes|Equipo docente>. Descarga la plantilla e inténtalo de nuevo.".
- [x] Si no hay filas con datos, el sistema responde `422` "El archivo no tiene filas con datos.".
- [x] Si hay más de 500 filas (estudiantes) o 100 (staff), el sistema responde `422` indicando el máximo.
- [x] El sistema ignora las filas totalmente vacías y no las cuenta.

**Validación por fila (preview y confirm)**
- [x] Cuando el Jefe de Área sube un archivo válido, el sistema responde `200` con las filas válidas y las inválidas, sin escribir en la BD.
- [x] Cada fila inválida reporta su número de fila de Excel y **todos** sus motivos, de esta lista cerrada:
  - `"<Columna>" es obligatorio.`
  - `"<Columna>" no es un valor permitido.` (Tipo de identificación, Rol, Jornada)
  - `El número de identificación debe ser un entero positivo.`
  - `El correo no es válido.`
  - `La sede "<valor>" no existe en la institución.`
  - `La identificación está repetida en la fila <n>.`
  - `El correo está repetido en la fila <n>.`
  - `Ya existe un usuario con esa identificación en la institución.`
  - `Ya existe un usuario registrado con ese correo.`
- [x] El sistema compara sede y jornada sin distinguir mayúsculas/tildes ni espacios extremos.
- [x] Si una identificación o correo se repite dentro del archivo, el sistema acepta la primera ocurrencia y marca las siguientes.
- [x] La unicidad de identificación se verifica dentro del inquilino; la del correo es global (criterio de USR-04) y el mensaje no revela datos de otra institución.

**Confirmación**
- [x] Cuando el modal muestra la previsualización, el sistema indica "N usuarios listos para crear" y la tabla de filas omitidas (Fila · Motivos); el botón "Crear N usuarios" se deshabilita si N = 0.
- [x] Cuando el Jefe de Área confirma, el sistema **revalida** todas las filas enviadas (formato, sede, jornada, duplicados, BD) antes de insertar.
- [x] El sistema crea solo las filas válidas con `institutionId` del token, `gradesTaught: ['Transición']` para Estudiante y Docente, y `[]` para Jefe de Área.
- [x] Si una inserción choca con el índice único `{ institutionId, identificationNumber }` o con un correo existente por carrera concurrente, el sistema omite esa fila con el motivo de duplicado y continúa con las demás.
- [x] Los Docentes/Jefes de Área creados quedan `accountStatus: 'Pendiente'`, sin `passwordHash`, y el sistema les envía la invitación (USR-04) uno a uno.
- [x] Si falla el envío de una invitación, el usuario se conserva `Pendiente` y aparece en `invitationsFailed`.
- [x] El sistema responde `201` con `{ created, skipped[], invitationsFailed[] }`; el modal muestra el resultado y la tabla de usuarios y el dashboard se refrescan.

**Transversales**
- [x] **Aislamiento:** toda lectura/escritura del feature filtra y fuerza `institutionId` del token; ningún endpoint lo acepta de `body`/`params`/`query`/archivo. Las sedes y jornadas se resuelven solo contra el inquilino.
- [x] `npx tsc --noEmit` en verde en `quartz-api`; `npm run build && npm run lint` en verde en `quartz-web`.

## Dependencias
- USR-01 (gestión de usuarios), USR-04 (`issueInvitation`, estado `Pendiente`), ACAD-04 (sedes y jornadas).
- Rama base: `feat/INF-10-concurrency-and-dashboard-freshness` (aún no fusionada en `develop`).

## Trazabilidad
- Backend:  `quartz-api/src/features/users/` · `quartz-api/src/services/spreadsheet.service.ts`
- Frontend: `quartz-web/src/features/users/`
- Branch:   `feat/USR-05-bulk-user-import`
