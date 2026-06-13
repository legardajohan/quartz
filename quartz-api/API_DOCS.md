# Documentación de API - Quartz

Este documento detalla el comportamiento, modelos de datos y endpoints para los módulos centrales de evaluación estudiantil: **Checklist Templates** (Plantillas de Indicadores) y **Student Valuations** (Evaluaciones de Estudiantes).

---

## 1. Conceptos Generales

### Checklist Templates
Las plantillas actúan como "planos maestro" definidos por los docentes por periodo. Una plantilla agrupa las **asignaturas** que dicta un docente y, para cada asignatura, define una lista de **aprendizajes (learnings)** o indicadores.
- **Propósito:** Estandarizar qué se va a evaluar antes de iniciar el proceso de calificación.
- **Estructura:** Periodo -> Docente -> Lista de Asignaturas -> Lista de Aprendizajes.

### Student Valuations
Una evaluación de estudiante es una **instancia concreta** generada a partir de una `Checklist Template` para un estudiante específico en un periodo específico.
- **Pattern "Snapshot":** Al crear una evaluación, se copia la estructura (asignaturas y aprendizajes) de la plantilla. Esto garantiza que si la plantilla cambia a futuro, las evaluaciones históricas no se rompan.
- **Learnings:** Cada aprendizaje tiene una valoración cualitativa (e.g., "Logrado", "En proceso", "Con dificultad").

---

## 2. Modelos de Datos (Resumen)

### Checklist Template
```typescript
interface IChecklistTemplate {
  institutionId: ObjectId;
  periodId: ObjectId;
  teacherId: ObjectId;
  name: string; // e.g., "Plantilla Primaria Q1"
  subjects: {
    subject: { _id: ObjectId; name: string };
    learnings: { 
      description: string; // Texto del indicador
    }[];
  }[];
}
```

### Student Valuation
```typescript
interface IStudentValuation {
  studentId: ObjectId;
  periodId: ObjectId;
  checklistTemplateId: ObjectId; // Referencia a la plantilla origen
  globalStatus: 'Evaluado' | 'Evaluando' | 'Por diligenciar';
  valuationsBySubject: {
    subjectId: ObjectId;
    learningValuations: {
        learningId: ObjectId;      // ID único del aprendizaje en esta evaluación
        description: string;       // Copia del texto original
        qualitativeValuation: 'Logrado' | 'En proceso' | 'Con dificultad' | null;
        pointsObtained: number;
    }[];
  }[];
}
```

### Learning
Entidad base que representa un indicador o logro esperado.
```typescript
interface ILearning {
  author: { _id: ObjectId; name: string; role: string }; // Docente creador
  subject: { _id: ObjectId; name: string };
  period: { _id: ObjectId; name: string };
  grade: string;        // e.g., "5-A", "11-B"
  description: string;  // El texto del aprendizaje
  institutionId: ObjectId;
}
```

---

## 3. Endpoints API

### A. Checklist Templates (Plantillas)

#### 1. Obtener Plantillas por Docente
Obtiene todas las plantillas creadas por el docente autenticado (o para un docente específico si es admin).

*   **Método:** `GET`
*   **URL:** `/api/checklist-templates`
*   **Headers:** `Authorization: Bearer <token>`
*   **Query Params:** N/A (filtra por `req.user.userId`)
*   **Respuesta Exitosa (200):**
    ```json
    [
      {
        "_id": "...",
        "name": "Plantilla Grado 5 - Periodo 1",
        "periodId": "...",
        "subjects": [...]
      }
    ]
    ```

#### 2. Crear Plantilla
Crea una nueva plantilla para un periodo. El backend automáticamente asocia las asignaturas que el docente dicta en ese periodo.

*   **Método:** `POST`
*   **URL:** `/api/checklist-templates`
*   **Headers:** `Authorization: Bearer <token>`
*   **Cuerpo (JSON):**
    ```json
    {
      "name": "Mi Nueva Plantilla",
      "periodId": "<ObjectId>"
    }
    ```
*   **Respuesta Exitosa (201):** Objeto `ChecklistTemplate` creado.

---

### B. Student Valuations (Evaluaciones)

#### 1. Inicializar Evaluación
Crea el registro de evaluación para un estudiante si no existe. Requiere que exista una plantilla válida para el docente/periodo.

*   **Método:** `POST`
*   **URL:** `/api/student-valuations/student/:studentId/period/:periodId`
*   **Headers:** `Authorization: Bearer <token>`
*   **Cuerpo (JSON):**
    ```json
    {
       "checklistTemplateId": "<ObjectId>" // Opcional si hay lógica automática, pero recomendado
    }
    ```
*   **Respuesta Exitosa (201/200):** Objeto `StudentValuation` (nuevo o existente).

#### 2. Obtener Evaluaciones de un Estudiante
Obtiene el historial de evaluaciones de un estudiante (boletines pasados y actuales).

*   **Método:** `GET`
*   **URL:** `/api/student-valuations/student/:studentId`
*   **Headers:** `Authorization: Bearer <token>`
*   **Respuesta Exitosa (200):** Array de evaluaciones pobladas (con nombres de asignaturas, periodos, etc.).

#### 3. Obtener Evaluación por ID (Detalle)
Obtiene el detalle completo de una evaluación específica para edición/visualización.

*   **Método:** `GET`
*   **URL:** `/api/student-valuations/:valuationId`
*   **Headers:** `Authorization: Bearer <token>`
*   **Respuesta Exitosa (200):** Objeto `StudentValuationDTO` enriquecido.

#### 4. Actualizar Evaluación (Calificar)
Actualiza las valoraciones cualitativas de los aprendizajes. Soporta actualizaciones parciales (patch).

*   **Método:** `PATCH`
*   **URL:** `/api/student-valuations/:valuationId`
*   **Headers:** `Authorization: Bearer <token>`
*   **Cuerpo (JSON):**
    ```json
    {
      "valuationsBySubject": [
        {
          "subjectId": "<ObjectId>",
          "learningValuations": [
            {
              "learningId": "<ObjectId>",
              "qualitativeValuation": "Logrado" // Opciones: "Logrado", "En proceso", "Con dificultad"
            }
          ]
        }
      ]
    }
    ```
*   **Respuesta Exitosa (200):** Objeto actualizado.

#### 5. Eliminar Evaluación
Elimina físicamente el registro de evaluación.

*   **Método:** `DELETE`
*   **URL:** `/api/student-valuations/:valuationId`
*   **Headers:** `Authorization: Bearer <token>`
*   **Respuesta Exitosa (200):** Mensaje de confirmación.

---

### C. Learnings (Aprendizajes/Indicadores)

#### 1. Obtener Aprendizajes (Listar)
Obtiene una lista de aprendizajes filtrados por el rol del usuario.
- **Docente:** Ve sus propios aprendizajes del periodo actual/filtros.
- **Jefe de Área:** Puede ver aprendizajes globales (según lógica de negocio específica).

*   **Método:** `GET`
*   **URL:** `/api/learnings`
*   **Headers:** `Authorization: Bearer <token>`
*   **Query Params:** `subjectId`, `periodId`, `grade` (opcionales para filtrar).
*   **Respuesta Exitosa (200):**
    ```json
    [
      {
        "_id": "...",
        "description": "Reconoce los colores primarios...",
        "author": { "name": "Profesor X" },
        "grade": "1-A",
        "subject": { "name": "Artes" }
      }
    ]
    ```

#### 2. Crear Aprendizaje
Crea un nuevo indicador/aprendizaje individual.

*   **Método:** `POST`
*   **URL:** `/api/learnings`
*   **Headers:** `Authorization: Bearer <token>`
*   **Cuerpo (JSON):**
    ```json
    {
      "description": "Comprende la segunda ley de Newton",
      "subjectId": "<ObjectId>",
      "periodId": "<ObjectId>",
      "grade": "10-A"
    }
    ```
*   **Respuesta Exitosa (201):** Objeto learning creado.

#### 3. Actualizar Aprendizaje
Modifica la descripción u otros campos de un aprendizaje existente.

*   **Método:** `PATCH`
*   **URL:** `/api/learnings/:learningId`
*   **Headers:** `Authorization: Bearer <token>`
*   **Cuerpo (JSON):**
    ```json
    {
      "description": "Nueva descripción corregida"
    }
    ```
*   **Respuesta Exitosa (200):** Objeto actualizado.

#### 4. Eliminar Aprendizaje
Elimina un aprendizaje del sistema.
*Nota: Verificar si esto afecta plantillas existentes (generalmente las plantillas copian los learnings, pero es bueno tener cuidado).*

*   **Método:** `DELETE`
*   **URL:** `/api/learnings/:learningId`
*   **Headers:** `Authorization: Bearer <token>`
*   **Respuesta Exitosa (200):** Mensaje de confirmación.
