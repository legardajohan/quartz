# Changelog

Versión de producto de Quartz (semver). Cada entrada lista los specs incluidos con su ID; el detalle vive en `specs/<ID>-<slug>/`.

## v1.0.0 — 2026-10-07
Paquetes: quartz-api 1.0.0 · quartz-web 1.0.0

Primer release a producción (Render + Vercel). Consolida todo lo implementado en `develop` hasta la fecha.

### Features
- **ACAD-01** Gestión de dimensiones — CRUD de `Subject` por institución con modo de evaluación `checklist` o `description`.
- **ACAD-02** Periodos académicos — periodos sin límite, periodo activo, alerta de cierre e informes habilitados por institución.
- **ACAD-03** Carga de imágenes — escudo de la institución y foto del estudiante en Cloudflare R2 (`.webp` 400×400, ≤40 KB).
- **ACAD-04** Sedes y jornadas — CRUD de sedes y lista de jornadas propia del inquilino, asignable al estudiante.
- **ACAD-05** Niveles ofertados — Prejardín, Jardín y Transición configurables por institución.
- **AUTH-01** Welcome loader — overlay de bienvenida con la marca tras un login exitoso.
- **AUTH-04** Recuperar contraseña — enlace de un solo uso (1 h) enviado por correo.
- **USR-01** Gestión de usuarios — CRUD de Estudiantes y Docentes con tabs por rol, búsqueda, filtros e imagen de perfil.
- **USR-02** Permisos de UI del Docente — la UI muestra solo lo que la API le permite; el Docente actualiza estudiantes de su sede.
- **USR-03** Mi cuenta — perfil propio, foto y cambio de contraseña.
- **USR-04** Alta por invitación — enlace de activación de un solo uso (15 días); el usuario crea su propia contraseña.
- **USR-05** Cargue masivo de usuarios — importación desde plantilla `.xlsx` con reporte de filas omitidas.
- **VAL-03** Modo descripción — valoración por dimensión con texto libre del desempeño.
- **VAL-04** Alcance por sede en Evaluaciones — el Docente solo lee y edita valoraciones de estudiantes de su sede.
- **RPT-02** Carta Comunicativa — PDF dinámico con concepto por dimensión según el nivel cualitativo, elegible por el docente.
- **RPT-03** UX de la Carta Comunicativa — edición en página dentro de `/Evaluación`; `/Informes` queda solo con el PDF descargable.
- **RPT-04** Snapshot de concepto e íconos de estado — el texto del concepto se congela al asignarlo.
- **RPT-06** Pipeline de assets del PDF — escudo resuelto una vez por sesión, sin peticiones de imagen por estudiante.
- **RPT-07** Descargue masivo de informes — pestañas Individual y Masivo en `/Informes`.
- **INF-04** Dashboard analítico — 12 widgets con datos reales del avance del periodo, por docente, dimensión y estudiante.
- **INF-10** Concurrencia optimista — aviso de conflicto al editar aprendizajes y valoraciones sin perder el borrador; Dashboard sin recarga al volver.

### Fixes
- **AUTH-03** Checklist de contraseña compacto — menor alto en activación y cambio de contraseña, misma política.
- **INF-03** Sesión y alcance — `sessionData` resincronizada con el backend, `Select` sin recorte y alcance por sede endurecido.
- **RPT-05** Correcciones de la Carta Comunicativa — timeout al generar el PDF, barra de perfil fija y `Select` de conceptos.
- **USR-06** Correcciones del cargue masivo — grado en la plantilla, feedback al confirmar y envío de invitaciones más rápido.

### Infraestructura
- **AUTH-02** Base de acceso por rol — reglas de permiso de UI centralizadas en `usePermissions`.
- **INF-01** Buscador reutilizable y acabado del PDF — componente de búsqueda transversal y nomenclatura de dimensiones por inquilino.
- **INF-02** Sincronización de `develop` en la rama de la Carta Comunicativa.
- **INF-05** Base de estado de servidor — React Query con política global de caché y purga entre sesiones.
- **INF-06** Catálogos de configuración en React Query — periodos, dimensiones, sedes e institución.
- **INF-07** Valoración e informes en React Query — lista compartida e invalidación cruzada tras cada escritura.
- **INF-08** Zustand acotado a sesión y UI — filtros de tablas que sobreviven a la navegación, selectores obligatorios.
- **INF-09** `sessionData` solo identidad — React Query es el único dueño de los catálogos.
- **INF-11** Production readiness — `quartz-api` compila con `tsc` y arranca desde `dist`, `JWT_SECRET` obligatorio, `/api/health`, rewrite SPA en Vercel.
- `quartz-web` con lint en verde — `AppRoot` en su propio archivo e íconos de dimensión compartidos en `features/subject/subjectIcons.ts`.
