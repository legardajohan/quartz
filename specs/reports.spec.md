---
feature: reports
status: implemented
created: 2026-07-13
---

# Spec — Informes (Reports)

## Problema
- Como Docente, quiero ver una tabla de mis estudiantes con su identificación, grado, sede y estado
  de evaluación, y el acceso a sus informes, para llegar rápido a la Lista de Chequeo de quienes ya
  están evaluados completamente.
- Como Docente o Jefe de Área, quiero visualizar y descargar en PDF (tamaño carta) la Lista de
  Chequeo evaluada de un estudiante —con encabezado institucional, desempeños por dimensión y firma
  del docente— para entregar el informe oficial del período.
- Como Jefe de Área, quiero que el informe reserve el espacio del escudo institucional para poder
  incorporarlo cuando exista la configuración de subida.

## Solución (visión general)
- Nueva pantalla en `/informes` con una **tabla de estudiantes** (referencia visual: la tabla de
  `student-valuation`), con columnas: **ID**, **Apellidos** (avatar + apellidos), **Nombres**,
  **Identificación**, **Grado**, **Sede** e **Informes** (iconos de **Lista de Chequeo** y **Carta
  Comunicativa**). Reutiliza la fuente de datos de estudiantes ya existente y la insignia de estado.
- El icono de **Lista de Chequeo** solo se **habilita** cuando la valoración del estudiante está en
  estado **Evaluado** (evaluación completa). Si está **Evaluando**, **Por diligenciar** o sin
  iniciar, el icono aparece **deshabilitado** (no permite visualizar ni descargar). El icono de
  **Carta Comunicativa** permanece **deshabilitado** (placeholder) en esta fase.
- Al pulsar el icono habilitado, el sistema abre una **vista previa en pantalla** del informe (con
  la valoración más reciente) y ofrece un botón para **descargar el PDF**. El PDF se genera de forma
  **dinámica bajo demanda**, en **tamaño carta**, y **nunca se almacena**.
- **Diseño del informe (Lista de Chequeo):**
  - **Encabezado:** datos de la institución (nombre y demás datos relevantes) con un **espacio
    reservado para el escudo** (con fallback si aún no existe), el **período/boletín y año**, el
    **nombre del estudiante**, el **grado** y la **fecha de impresión**.
  - **Cuerpo:** una **tabla por cada dimensión** (la **DIMENSIÓN** es la cabecera de su tabla), con
    columnas **NO** (número de ítem), **APRENDIZAJES** y **VALORACIÓN**. En VALORACIÓN va un **único
    radio** pintado con el **color del desempeño obtenido** (Logrado / En proceso / Con dificultad).
  - **Pie:** el **nombre del docente** responsable y un **espacio para la firma**.
- **Autorización y multi-tenancy:** disponible para **Docente** y **Jefe de Área**; el Docente ve
  solo estudiantes de su sede y el Jefe de Área todas las sedes. Toda lectura se limita a la
  institución del token.

## Criterios de aceptación (EARS)
- [x] Cuando un Docente o Jefe de Área abre `/informes`, el sistema muestra una tabla de estudiantes
  con columnas ID, Apellidos (avatar + apellidos), Nombres, Identificación, Grado, Sede e Informes
  (iconos de Lista de Chequeo y Carta Comunicativa).
- [x] Si la Lista de Chequeo de un estudiante no está en estado "Evaluado", el sistema muestra su
  icono de Lista de Chequeo deshabilitado; cuando está "Evaluado", lo habilita para visualizar.
- [x] Cuando el usuario pulsa el icono habilitado de Lista de Chequeo, el sistema abre una vista
  previa en pantalla del informe con la valoración más reciente y un botón para descargar el PDF.
- [x] Cuando el sistema genera el informe de Lista de Chequeo, lo produce como PDF dinámico bajo
  demanda en tamaño carta y nunca lo almacena.
- [x] Cuando se renderiza el encabezado del informe, el sistema incluye los datos de la institución
  con un espacio reservado para el escudo, el período/boletín y año, el nombre del estudiante, el
  grado y la fecha de impresión.
- [x] Cuando se renderiza el cuerpo del informe, el sistema presenta una tabla por cada dimensión
  (cabecera = DIMENSIÓN) con columnas NO, APRENDIZAJES y VALORACIÓN, donde VALORACIÓN es un único
  radio pintado del color del desempeño obtenido.
- [x] Cuando se renderiza el pie del informe, el sistema muestra el nombre del docente responsable y
  un espacio para la firma.
- [x] Mientras un Docente accede a Informes, el sistema solo lista estudiantes de su sede y limita
  toda lectura a su institución; el Jefe de Área ve todas las sedes de su institución.
- [x] Mientras esta fase esté vigente, el sistema muestra el icono de Carta Comunicativa siempre
  deshabilitado (placeholder), sin acción de visualizar ni descargar.

## Fuera de alcance (fases futuras)
- Diseño y generación del PDF de **Carta Comunicativa**.
- Subida del **escudo institucional** y pantalla de **configuración del admin** (campo `shield` en
  `Institution` + primer mecanismo de upload del proyecto). El informe solo reserva el espacio.
- **Foto real por estudiante** (hoy el avatar es un placeholder estático).

## Trazabilidad
- Backend:  quartz-api/src/features/report/ (sin `report.model.ts`: no hay colección propia, es
  agregación de Institution/Period/User/School/StudentValuation/ChecklistTemplate)
- Frontend: quartz-web/src/features/report/
- Branch:   feat/reports

## Notas de implementación
- **PDF:** generado en frontend con `@react-pdf/renderer`; un único componente
  (`ChecklistReportDocument`) sirve tanto la vista previa (`PDFViewer`) como la descarga
  (`PDFDownloadLink`), evitando duplicar el diseño.
- **Previsualización:** modal (`Dialog`) sobre la tabla de `/informes`, no ruta dedicada.
- **Endpoint:** `GET /api/reports/checklist/:valuationId` (roles `Jefe de Área`/`Docente`), reutiliza
  `getStudentValuationById` de `student-valuation.service` y rechaza con `409` si la valoración no
  está `Evaluado`, y con `403` si un Docente intenta ver un estudiante fuera de su sede.
- **Tabla:** reutiliza el `DataTable<T>` genérico y el endpoint `GET /users?role=Estudiante` ya
  existente (mismo origen de datos que `student-valuation`).
