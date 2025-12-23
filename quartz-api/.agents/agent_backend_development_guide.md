# Agent Backend Development Guide for Academic Quartz

Este documento es mi guía interna y protocolo de desarrollo para el backend de Academic-Quartz. Combina las directrices del proyecto con el análisis de la arquitectura existente para asegurar un desarrollo consistente, seguro y mantenible.

## 1. Principios Fundamentales

- **Arquitectura:** El backend es un **Monolito Modular** con una **Arquitectura Orientada al Dominio (Screaming Architecture)**. La estructura de carpetas debe reflejar las capacidades del negocio (`auth`, `learning`, etc.), no las capas técnicas.
- **Seguridad Multi-tenant:** Es la regla más importante. Todas las operaciones de la base de datos **deben** estar aisladas por `institutionId`. No se puede confiar en ningún `institutionId` proveniente del cliente.
- **Separación de Responsabilidades (SoC):** Se debe respetar estrictamente la arquitectura por capas (Rutas -> Controlador -> Servicio -> Modelo/Repositorio).
- **Tipado Fuerte:** Se usará TypeScript en todo el proyecto.
- **Manejo de Errores:** Cualquier operación que pueda fallar (llamadas a BD, etc.) debe estar envuelta en un bloque `try...catch`.

## 2. Estructura de Carpetas y Nomenclatura

La estructura para cada feature sigue el patrón de "Screaming Architecture".

```
/src/features/[feature-name]/
├── [feature-name].controller.ts
├── [feature-name].model.ts
├── [feature-name].routes.ts
├── [feature-name].service.ts
├── [feature-name].types.ts
└── [feature-name].validation.ts
```

**Convenciones de Nomenclatura:**
- **Archivos y Carpetas:** `kebab-case` (ej: `learning-card.tsx`)
- **Variables y Funciones:** `camelCase` (ej: `createLearning`)
- **Constantes:** `SCREAMING_SNAKE_CASE` (ej: `JWT_SECRET`)

## 3. Arquitectura por Capas: Flujo de Operaciones

### Capa 1: Rutas (`.routes.ts`)

- **Responsabilidad:** Definir endpoints, métodos HTTP y aplicar la secuencia de middlewares.
- **Workflow:**
  1.  Instanciar `express.Router()`.
  2.  Definir la ruta (ej: `router.post('/', ...)`).
  3.  **Secuencia de Middlewares Obligatoria:**
      1.  `authenticateJWT`: Para validar el token y adjuntar `req.user`.
      2.  `authorize(['Role1', 'Role2'])`: Para el control de acceso basado en roles.
      3.  `validate(validationSchema)`: Para la validación de datos de entrada con Zod.
  4.  Asignar el método del controlador como manejador final.

### Capa 2: Controlador (`.controller.ts`)

- **Responsabilidad:** Orquestar la petición. Extraer datos de la petición HTTP y pasarlos a la capa de servicio. **No debe contener lógica de negocio.**
- **Workflow:**
  1.  Extraer datos de `req.body`, `req.params`, y `req.query`.
  2.  Extraer el objeto `user` de `req.user`.
  3.  **Verificar la existencia de `req.user` y `req.user.institutionId`**. Es un error crítico si faltan.
  4.  Extraer `institutionId` y `userId` del objeto `user`.
  5.  Llamar al método de servicio correspondiente, pasando `institutionId`, `userId` y los datos de la petición.
  6.  Recibir la respuesta del servicio, transformarla a un DTO si es necesario (ej: `mapLearningToResponse`), y enviarla al cliente con el código de estado correcto (200, 201, 404, etc.).
  7.  Manejar errores en un bloque `try...catch`.

### Capa 3: Servicio (`.service.ts`)

- **Responsabilidad:** Contener toda la lógica de negocio.
- **Workflow:**
  1.  Recibir `institutionId` y otros datos del controlador.
  2.  **Validar Integridad Referencial:** Usar el servicio `validateAllExist` para asegurar que los IDs de documentos relacionados (ej: `subjectId`) existen antes de una operación de escritura.
  3.  **Aplicar Seguridad Multi-tenant en Consultas a BD:**
      - **Lectura (`find`, `findById`):** La consulta **DEBE** incluir el filtro `{ institutionId }`.
      - **Escritura (`create`):** El payload del nuevo documento **DEBE** incluir el campo `institutionId`.
      - **Modificación (`update`, `delete`):** La consulta de búsqueda **DEBE** incluir `{ _id: documentId, institutionId: userInstitutionId }` para prevenir modificaciones entre tenants.
  4.  Interactuar con la capa de datos (Modelos de Mongoose o `base.repository`).
  5.  Devolver el resultado (o lanzar un error) al controlador.

### Capa 4: Modelo (`.model.ts`)

- **Responsabilidad:** Definir la estructura de los datos en la base de datos.
- **Workflow:**
  1.  Definir la interfaz del documento (`ILearningDocument`).
  2.  Crear el `Schema` de Mongoose.
  3.  **Ancla Multi-tenant:** El esquema **DEBE** incluir `institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true }`.
  4.  Exportar el modelo compilado.

## 4. Convenciones de Módulos (ESM)

- **`export default`:** Para el componente o función principal de un archivo (ej: el controlador principal, el servicio principal).
- **`export` (nombrado):** Para utilidades, tipos, constantes y funciones secundarias.
- **Híbrido:** Se puede usar `export default` para la función principal y `export` para tipos o helpers relacionados en el mismo archivo.
