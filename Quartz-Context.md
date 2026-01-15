# **Quartz: Propuesta de Aplicación Web para Gestión de Valoraciones Educativas**

## **1. Introducción y Contextualización de la Propuesta**

Esta propuesta detalla el desarrollo de una aplicación web para la gestión del desempeño académico y evaluación estudiantil, enfocada inicialmente en instituciones educativas con estudiantes de **Grado Transición** quienes requieren **Evaluación Cualitativa**. Surge como respuesta a las limitaciones de las plataformas existentes que no cumplen con los lineamientos del Ministerio de Educación Nacional (MEN), dificultando la labor de docentes.

El objetivo principal es optimizar los procesos institucionales, mejorar la eficiencia en el entorno educativo y asegurar el cumplimiento de la normativa vigente, facilitando el registro de valoraciones, el seguimiento del rendimiento académico y la generación de informes. El proyecto, en su fase piloto para IEA La Planada, busca ajustarse a las necesidades locales, con una visión a futuro de expansión a nivel nacional y la capacidad de evaluar hasta **Grado Undécimo** con un enfoque escalable de **Evaluación Cuantitativa**.

## **2. Alcance y Proyección del Proyecto**

### **2.1. Fase Inicial: Grado Transición (Valoración Cualitativa)**

La fase inicial se centrará en el **Grado Transición**, donde las valoraciones son estrictamente cualitativas y se basan en una "Lista de Chequeo" que deriva en una "Carta Comunicativa" y reportes complementarios.

* **Lista de Chequeo:** Documento de evaluación con ítems específicos por dimensión.
* **Valoración:** Los ítems se califican cualitativamente como "Logrado", "En proceso" o "Con dificultad".
* **Informes:** Se generan una "Carta Comunicativa" y un reporte de la "Lista de Chequeo".

### **2.2. Proyección a Futuro: Grados 1° a 11° (Valoración Cuantitativa)**

La arquitectura de la aplicación será diseñada para permitir una futura expansión y desarrollo hacia grados superiores (1° a 11°), donde la valoración es **cuantitativa** (escala de 0.0 a 5.0). Esta proyección implica que el modelo de datos y la lógica de negocio serán lo suficientemente flexibles para integrar:

* Gestión de aproximadamente 10 materias.
* Valoraciones cuantitativas por actividades.
* Textos descriptivos de "Desempeños".
* Informes consolidados por grados y períodos.
* Asignación de grupos de estudiantes a docentes.

## **3. Requisitos Funcionales (RF)**

* **RF001 - Gestión de Usuarios:** El Jefe de Área podrá registrar, modificar, eliminar y consultar usuarios (Docentes y Estudiantes). Se podrá registrar Docentes individualmente mediante formulario y Estudiantes de forma masiva (carga `.xls`) o individual (formulario).
* **RF002 - Gestión de Aprendizajes Esperados:** El Jefe de Área podrá agregar, modificar, eliminar y consultar "Aprendizajes Esperados" por dimensión y período, incluyendo un código y descripción.
* **RF003 - Gestión de Conceptos:** El Jefe de Área podrá agregar, modificar, eliminar y consultar "Conceptos" (Logrado, En proceso, Con dificultad) por dimensión y período, incluyendo un código y descripción.
* **RF004 - Gestión de Ítems de Lista de Chequeo:** El Jefe de Área podrá agregar, modificar, eliminar y consultar ítems (descripciones breves, entre 5 y 10) para cada una de las 7 dimensiones por período.
* **RF005 - Visualización de Estudiantes:** Los Docentes y Jefes de Área podrán visualizar el listado de estudiantes de su sede por defecto. Podrán filtrar por otras sedes, sin poder editar.
* **RF006 - Valoración de Lista de Chequeo:** Los Docentes y Jefes de Área podrán ingresar a la "Lista de Chequeo" de un estudiante y valorar cualitativamente cada ítem de cada dimensión.
* **RF007 - Generación y Previsualización de Carta Comunicativa:** La aplicación generará la "Carta Comunicativa" como un PDF dinámico en el momento de la solicitud de visualización. Los datos se consultarán de la valoración actual del estudiante. No se guardarán versiones previas.
* **RF008 - Visualización de Informes:** Los Docentes y Jefes de Área podrán previsualizar y descargar en formato PDF la "Carta Comunicativa" y la "Lista de Chequeo" de los estudiantes. Si la "Lista de Chequeo" no está completa, la previsualización no estará disponible.
* **RF009 - Descarga de Consolidados:** Los Docentes y Jefes de Área podrán descargar informes consolidados (ej. de Listas de Chequeo o Cartas Comunicativas por grupo/sede).
* **RF010 - Carga Masiva de Estudiantes:** El Jefe de Área podrá subir usuarios Estudiantes de forma masiva mediante un archivo `.xls` descargable como plantilla desde la aplicación.
* **RF011 - Configuración de Períodos Académicos:** El Jefe de Área podrá configurar las fechas de los períodos académicos (cuatrimestrales), y solo uno estará activo a la vez.
* **RF012 - Modificación de Valoraciones:** Los Docentes y Jefes de Área podrán modificar las valoraciones de la "Lista de Chequeo" ya registradas, y la "Carta Comunicativa" se actualizará con los cambios al ser generada nuevamente.
* **RF013 - Autenticación de Usuarios:** Autenticación de usuarios mediante JWT y/o OAuth (adaptable para Google).
* **RF014 - Gestión de Sedes y Dimensiones:** Las 9 sedes y las 7 dimensiones (Cognitiva, Espiritual, Estética, Comunicativa, Socioafectiva, Corporal, Ética) estarán configuradas en la base de datos como colecciones maestras para su referencia. El Jefe de Área gestionará las sedes. Las dimensiones serán fijas.
* **RF015 - Notificaciones:** El sistema enviará alertas por correo electrónico y dentro de la aplicación cuando se acerquen fechas de corte académico o haya pendientes de calificación. No serán personalizables por el docente.

## **4. Requisitos No Funcionales (RNF)**

* **RNF001 - Rendimiento:** La aplicación debe garantizar una respuesta de menos de 2 segundos para el 95% de las operaciones.
* **RNF002 - Escalabilidad:** La arquitectura debe permitir escalar horizontalmente para soportar un número creciente de usuarios y datos.
* **RNF003 - Alta Disponibilidad:** El sistema debe tener una disponibilidad mínima del 99.5% anual.
* **RNF004 - Seguridad:**
    * Encriptación de datos sensibles (ej. contraseñas con bcrypt).
    * Uso de HTTPS.
    * Protección contra ataques comunes (CSRF, XSS, inyección SQL/NoSQL, fuerza bruta).
* **RNF005 - Usabilidad:** La interfaz debe ser intuitiva, accesible, amigable y responsive.
* **RNF006 - Compatibilidad:** La aplicación debe ser compatible con navegadores modernos y dispositivos móviles.
* **RNF007 - Mantenibilidad:** El código y la documentación deben ser claros y fáciles de mantener.
* **RNF008 - Backup y Recuperación:** Implementación de copias de seguridad periódicas de la base de datos.
* **RNF009 - Interoperabilidad:** Capacidad de integración con otros sistemas a través de APIs REST.

## **5. Arquitectura y Tecnologías Propuestas**


El proyecto se construirá sobre el **MERN Stack**, ofreciendo flexibilidad, rendimiento y una amplia comunidad de soporte.

* **Backend:** Node.js con Express.js (APIs RESTful).
* **Base de Datos:** MongoDB (NoSQL, ideal para el modelo de datos flexible y escalable).
* **Frontend:** React con TypeScript (para desarrollo robusto y escalable).
* **Estilos:** Tailwind CSS (para un diseño rápido y personalizable).
* **Gestión de Estados (Frontend):** Zustand (alternativa eficiente para el manejo de estados).
* **Autenticación:** JWT y/o OAuth (con preferencia por la adaptación a Google para la autenticación).

### **Estándar de desarrollo de controladores (Backend)**

A partir de septiembre 2025, todos los controladores del backend se implementarán como **clases** en vez de funciones sueltas. Este patrón incluye:

- **Encapsulación:** Cada clase agrupa la lógica de la entidad (por ejemplo, `LearningController` para la feature de aprendizajes esperados).
- **Inyección de dependencias:** El servicio correspondiente (por ejemplo, `LearningService`) se inyecta en el constructor del controlador, facilitando el desacoplamiento y las pruebas unitarias.
- **Consistencia:** Todas las features del API seguirán este patrón, permitiendo una estructura clara y profesional.
- **Escalabilidad y mantenibilidad:** El código es más fácil de extender, refactorizar y testear.

**Ejemplo de implementación:**

```typescript
// src/features/learning/learning.controller.ts
import { Request, Response } from "express";
import { LearningService } from "./learning.service";

export class LearningController {
  constructor(private learningService: LearningService) {}

  async create(req: Request, res: Response): Promise<void> {
    // Lógica de creación
  }
  async update(req: Request, res: Response): Promise<void> {
    // Lógica de actualización
  }
  async delete(req: Request, res: Response): Promise<void> {
    // Lógica de eliminación
  }
  async getById(req: Request, res: Response): Promise<void> {
    // Lógica para obtener uno por ID
  }
  async getAll(req: Request, res: Response): Promise<void> {
    // Lógica para obtener todos con filtros
  }
}
```

**Uso en rutas:**

```typescript
// src/features/learning/learning.routes.ts
import { Router } from 'express';
import { LearningController } from './learning.controller';
import { LearningService } from './learning.service';

const router = Router();
const learningService = new LearningService();
const learningController = new LearningController(learningService);

router.post('/', (req, res) => learningController.create(req, res));
router.put('/:learningId', (req, res) => learningController.update(req, res));
// ... demás rutas

export default router;
```

Este estándar será obligatorio para todas las nuevas features y para la refactorización de las existentes.

## **6. Roles y Permisos de Usuario**

* **Jefe de Área (Administrador):**
    * Gestión total de usuarios (creación, edición, eliminación).
    * Gestión de Aprendizajes Esperados, Conceptos y ítems de Lista de Chequeo.
    * Configuración de períodos académicos y sedes.
    * Acceso a todas las funcionalidades del Docente.
    * Descarga de consolidados.
    * Carga masiva de estudiantes.
* **Docente:**
    * Visualización del listado de estudiantes (propios de su sede/grado asignado, con filtro por otras sedes/grados).
n    * Valoración cualitativa de ítems en la Lista de Chequeo.
    * Modificación de valoraciones ya registradas.
    * Previsualización y descarga de "Carta Comunicativa" y "Lista de Chequeo".
    * Descarga de consolidados de sus grupos.
* **Estudiante:**
    * No tiene acciones directas en la aplicación en esta fase.

## **7. Lógica de Negocio Detallada**

### **7.1. Jerarquía de la Lista de Chequeo**

La estructura de la Lista de Chequeo se organiza jerárquicamente:

1.  **Periodo:** Contiene las valoraciones para un período académico específico.
    * **Dimensión (x):** Cada período agrupa las 7 dimensiones predefinidas (Cognitiva, Espiritual, Estética, Comunicativa, Socioafectiva, Corporal, Ética).
        * **Aprendizaje Esperado (x.x):** Cada dimensión contiene un conjunto de "Aprendizajes Esperados". Estos son los ítems a valorar y son seleccionados por el docente al componer su lista de chequeo personal.

### **7.2. Proceso de Valoración y Asignación de Conceptos**

1.  **Valoración de Ítems:**
    * Cada ítem de la "Lista de Chequeo" será valorado por el Docente/Jefe de Área usando radio buttons con opciones: "Logrado", "En proceso", "Con dificultad".
    * Internamente, a cada valoración se le asignará un puntaje:
        * **Logrado:** 3 puntos
        * **En proceso:** 2 puntos
        * **Con dificultad:** 1 punto

2.  **Cálculo del Ponderado Oculto por Dimensión:**
    * Para cada Dimensión de un estudiante, se sumarán los puntos obtenidos de todos sus ítems valorados. Este será el "Puntaje Total de la Dimensión".
    * Se calculará el "Puntaje Máximo Posible" para esa Dimensión: `(Número de ítems en la Dimensión) * 3`.

3.  **Asignación del Concepto por Dimensión:**
    * El "Concepto" final para cada Dimensión en la "Carta Comunicativa" se asignará basándose en el porcentaje del "Puntaje Total de la Dimensión" respecto al "Puntaje Máximo Posible".
    * **Rangos de Asignación:**
        * **"Logrado":** Ponderado oculto del 80% al 100% del puntaje máximo.
        * **"En proceso":** Ponderado oculto del 46% al 79% del puntaje máximo.
        * **"Con dificultad":** Ponderado oculto del 0% al 45% del puntaje máximo.
    * *Ejemplo:* Si una Dimensión tiene 5 ítems, el puntaje máximo posible es 15 puntos.
        * "Logrado": 12 a 15 puntos.
        * "En proceso": 7 a 11 puntos.
        * "Con dificultad": 0 a 6 puntos.

### **7.3. Estados de la Lista de Chequeo o `GlobalStatus`**

La aplicación determinará automáticamente el estado de la Lista de Cheequeo para cada estudiante y período, representado por un color de ícono:

* **Verde:** Evaluado (todos los ítems de todas las dimensiones han sido valorados).
* **Azul:** Evaluando (faltan algunas dimensiones o ítems por valorar).
* **Gris:** Por diligenciar (no se ha iniciado ninguna valoración).

### **7.4. Generación de Informes**

* La "Carta Comunicativa" y el informe de la "Lista de Chequeo" son generados dinámicamente como PDFs al momento de ser solicitados para visualización o descarga, garantizando que siempre muestren la información más reciente. No se almacenarán versiones de estos PDFs en la base de datos.

¡Perfecto\! Entendido. Eliminaremos `Activity` y `ActivityScore` por ahora, centrándonos en el modelo para el grado Transición y las valoraciones cualitativas. También, como lo indicaste, eliminaremos el campo `code` de `ExpectedLearning`, confiando en el `_id` de MongoDB para la unicidad de los documentos.

Aquí tienes el modelo de base de datos de MongoDB revisado, con los cambios aplicados y ajustado para el enfoque en el grado Transición y el sistema de valoración cualitativa:

## **8. Proposed MongoDB Data Model (Transition Grade - Qualitative Focus)**

This model is tailored for the initial phase, focusing on the qualitative assessment for the "Transition Grade". It unifies the concept of "dimensions" and "subjects" under a single `Subject` entity. Multi-tenancy support via `institutionId` fields is maintained for data isolation and high performance.

### **8.1. Entity: `Institution`**

This is a **new top-level collection** to represent each distinct educational institution using the system. All other institution-specific data will reference this entity.

```json
{
  "_id": ObjectId("..."), // Unique ID for the educational institution
  "name": "String", // Unique: Name of the institution (e.g., "Acacia School")
  "daneCode": "String", // Unique, official registration code (DANE in Colombia)
  "address": "String",
  "rectorName": "String", // Added: Name of the institution's rector
  "phoneNumber": "String",
  "email": "String", // Unique
  "isActive": "Boolean", // To enable/disable the institution in the system
  "createdAt": ISODate(), // timestamps
  "updatedAt": ISODate()
}
```

### **8.2. Entity: `User`**

Each user (Teacher, Area Manager, Student) will belong to a specific institution.

```json
{
  "_id": ObjectId("..."),
  "institutionId": ObjectId("..."), // REQUIRED: Reference to the `Institution`
  "role": "Jefe de Área" | "Docente" | "Estudiante",
  "firstName": "String",
  "middleName": "String", // Optional
  "lastName": "String",
  "secondLastName": "String", // Optional
  "identificationType": "CC" | "TI" | "RC", // Values: Citizen ID, Identity Card, Civil Registry | only user role: Estudiante
  "identificationNumber": "Number", // Unique within the institution | only user role: Estudiante
  "phoneNumber": "String", // Optional for student
  "email": "String", // Optional for student
  "passwordHash": "String", // Optional for student
  "schoolId": ObjectId("..."), // Reference to the `School` collection within the same institution
  "gradesTaught": ["String"], // Array of grades for Teacher/AreaManager roles, e.g.: ["Transition"]. Optional for Students.
  "createdAt": ISODate(), // Timestamp
  "updatedAt": ISODate()
}
```

### **8.3. Entity: `School`**

Each school/campus will belong to a specific institution.

```json
{
  "_id": ObjectId("..."),
  "institutionId": ObjectId("..."), // REQUIRED: Reference to the `Institution`
  "name": "String", // E.g.: "La Planada"
  "schoolNumber": "Number" // Optional, if there's a school number
}
```

### **8.4. Entity: `Period`**

Academic periods are specific to each institution.

```json
{
  "_id": ObjectId("..."),
  "institutionId": ObjectId("..."), // REQUIRED: Reference to the `Institution`
  "name": "String", // E.g.: "First Quarter 2024"
  "startDate": ISODate(),
  "endDate": ISODate(),
  "isActive": "Boolean" // Only one active period per institution at a time
}
```

### **8.5. Entity: `Learning`**

Defines expected learning outcomes for the "Transition Grade". These are associated with a `Subject` (which represents the former "Dimensions").

```json
{
  "_id": ObjectId("..."),
  "institutionId": ObjectId("..."), // REQUIRED: Reference to the `Institution`
  "description": "String",
  "grade": "String", // For this phase: "Transition Grade"
  "subjectId": ObjectId("..."), // Reference to the `Subject` collection (e.g., "Cognitive", "Spiritual")
  "periodId": ObjectId("..."), // Reference to the `Period` within the same institution
  "userId": ObjectId("..."), // Reference to the `User` collection
}
```

### **8.6. Entity: `Concept`**

Defines concepts (Achieved, InProgress, WithDifficulty), used for qualitative assessments. These are associated with a `Subject` and `Period`.

```json
{
  "_id": ObjectId("..."),
  "institutionId": ObjectId("..."), // REQUIRED: Reference to the `Institution`
  "description": "String",
  "valuationType": "Achieved" | "InProgress" | "WithDifficulty", // To map the assignment
  "subjectId": ObjectId("..."), // Reference to the `Subject` collection (e.g., "Cognitive", "Spiritual")
  "periodId": ObjectId("..."), // Reference to the `Period` within the same institution
}
```

### **8.7. Entity: `Subject`**

Master collection for educational subjects. In this phase, it will primarily contain names that were previously "Dimensions" (e.g., "Cognitive", "Spiritual", "Ethical"). When the project scales, it will also include academic subjects like "Mathematics", "Art".

```json
{
  "_id": ObjectId("..."),
  "name": "String", // E.g.: "Cognitive", "Spiritual", "Ethical", etc.
  "institutionId": ObjectId("..."), // OPTIONAL: For institution-specific subjects. If empty, it's a global subject.
  "type": "Dimensión" | "Asignatura" // OPTIONAL, to explicitly categorize subjects if needed for UI/logic.
}
```

#### **Aclaración sobre `institutionId` en Subjects:**

El campo `institutionId` en la entidad `Subject` es opcional en la base de datos para permitir dos casos de uso:

*   **Materias Globales (Grados 1° a 11°):** Para materias comunes y pre-cargadas en el sistema como "Matemáticas", "Ciencias Naturales", etc., el campo `institutionId` será **nulo**. Esto las define como materias globales, compartidas por todas las instituciones.
*   **Dimensiones Específicas (Grado Transición):** Para las "dimensiones" del grado Transición, que son creadas por los usuarios administradores de una institución, el campo `institutionId` es **obligatorio**. La lógica de la aplicación se encargará de asignar el `institutionId` del usuario creador en el momento del registro.

A futuro, se debe implementar un CRUD para que el rol de "Jefe de Área" pueda gestionar las dimensiones (`subjects`) específicas de su institución.

### **8.8. Entity: `ChecklistTemplate`**

Defines the structure of a "Checklist" **personal to a teacher** for a period. It is composed of `Learnings`.

```json
{
  "_id": ObjectId("..."),
  "institutionId": ObjectId("..."), // REQUIRED: Reference to the `Institution`
  "periodId": ObjectId("..."), // Reference to the `Period`
  "teacherId": ObjectId("..."), // NEW: Reference to the User (teacher) who owns this template
  "name": "String", // E.g.: "My P1 Checklist 2025 - Juanito Pérez"
  "subjects": [ // Array of subjects (dimensions) contained in this template
    {
      "subjectId": ObjectId("..."), // Reference to the `Subject`
      "learnings": [ // ADJUSTED: An array of references to the Learnings
        ObjectId("...") // Reference to a Learning's _id
      ]
    }
  ]
}
```

### **8.9. Entity: `StudentValuation`**

Stores the qualitative valuations from a teacher for a student, based on the teacher's personal `ChecklistTemplate`.

```json
{
  "_id": ObjectId("..."),
  "institutionId": ObjectId("..."), // REQUIRED: Reference to the `Institution`
  "studentId": ObjectId("..."), // Reference to the `User` (Student)
  "teacherId": ObjectId("..."), // Reference to the `User` (Teacher)
  "checklistTemplateId": ObjectId("..."), // Reference to the teacher's personal `ChecklistTemplate`
  "periodId": ObjectId("..."), // Reference to the `Period`
  "globalStatus": "Evaluado" | "Evaluando" | "Por diligenciar", // Calculated
  "valuationsBySubject": [ // Array of valuations for each subject
    {
      "subjectId": ObjectId("..."), // Reference to the `Subject`
      "learningValuations": [ // ADJUSTED: Renamed from "itemValuations"
        {
          "learningId": ObjectId("..."), // ADJUSTED: Direct reference to the Learning
          "qualitativeValuation": "Logrado" | "En proceso" | "Con dificultad",
          "pointsObtained": "Number" // (Calculated: 3, 2, or 1)
        }
      ],
      "totalSubjectScore": "Number", // (Calculated) Sum of points obtained in this subject
      "maxSubjectScore": "Number", // (Calculated) Max possible points for this subject
      "subjectPercentage": "Number", // (Calculated) (totalScore / maxScore) * 100
      "assignedConceptId": ObjectId("...") // (Calculated) Reference to the assigned `Concept`
    }
  ]
}
```

### **8.10. Entity: `Notification`**

Notifications should be associated with an institution if they are institution-specific.

```json
{
  "_id": ObjectId("..."),
  "institutionId": ObjectId("..."), // OPTIONAL: If the notification is institution-specific, otherwise it's global
  "userId": ObjectId("..."), // To whom it is addressed (within the same institution, if applicable)
  "type": "ALERT" | "INFO",
  "message": "String",
  "createdAt": ISODate(),
  "isRead": "Boolean",
  "isEmailSent": "Boolean" // Indicates if the email has already been sent
}
```

## **9. Future Development**

*   A futuro, desarrollar un flujo de registro de autoservicio (self-service) donde los clientes puedan registrar su propia Institución y Sedes a través de un formulario público. El primer usuario de ese registro se convertirá en el administrador ('Jefe de Área').
*   El administrador de la plataforma, podrá revisar los `learnings` y conocer el: autor, fecha de creación, periodo, descripción, grado, materia, otros. 
