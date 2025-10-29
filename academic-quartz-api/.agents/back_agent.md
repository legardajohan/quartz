# Guía de Arquitectura y Patrones para el Backend de Academic-Quartz

Este documento sirve como la guía de referencia y el "cerebro" para el desarrollo de nuevas features en el backend. El objetivo es mantener una arquitectura consistente, segura, y escalable, basada en los patrones establecidos en la feature de `learning`.

## 1. Filosofía y Principios

*   **Separación de Responsabilidades (SoC):** Cada capa de la aplicación tiene un propósito definido y no debe mezclar su lógica con otras.
*   **Seguridad Multi-tenant:** La base de toda la arquitectura. Ningún dato debe ser accesible por un usuario de una institución a la que no pertenece. El `institutionId` es el ancla de esta protección.
*   **Don't Repeat Yourself (DRY):** Se deben crear servicios y funciones genéricas para lógicas reutilizables (ej: `BaseRepository`, `DocumentValidatorService`).
*   **Tipado Fuerte:** TypeScript es mandatorio en todo el proyecto para asegurar la robustez y mantenibilidad del código.

## 2. Estructura de una Feature

Toda nueva feature (ej: `users`, `subjects`, `periods`) debe seguir la siguiente estructura de archivos dentro de `src/features/`:

```
/features/
└───[nombre-feature]/
    ├───[nombre-feature].controller.ts
    ├───[nombre-feature].model.ts
    ├───[nombre-feature].routes.ts
    ├───[nombre-feature].service.ts
    ├───[nombre-feature].types.ts
    └───[nombre-feature].validation.ts
```

## 3. Flujo de una Petición y Capas de la Aplicación

Una petición HTTP sigue un flujo unidireccional a través de varias capas, cada una con una responsabilidad específica.

### Capa 1: Rutas (`.routes.ts`)

*   **Propósito:** Define los endpoints de la API, los métodos HTTP y qué middlewares y controladores gestionarán la petición.
*   **Implementación:**
    1.  Crear una instancia de `express.Router()`.
    2.  Definir las rutas (ej: `router.get('/', ...)`).
    3.  **Aplicar Middlewares en Orden:**
        1.  `authenticateJWT`: Siempre primero para proteger la ruta y obtener la identidad del usuario (`req.user`).
        2.  `authorize([...roles])`: Segundo, para el control de acceso basado en roles.
        3.  `validate(schema)`: Tercero, para validar los datos de entrada (`body`, `params`, `query`).
    4.  Asignar el método del controlador correspondiente como último argumento.

### Capa 2: Controlador (`.controller.ts`)

*   **Propósito:** Orquestar el flujo de la petición. Es el intermediario entre el mundo HTTP y la lógica de negocio. **No debe contener lógica de negocio**.
*   **Implementación:**
    1.  Extraer datos de la petición: `req.body`, `req.params`, `req.query`.
    2.  **Extraer la identidad del usuario:** Obtener `req.user`, que fue inyectado por `authenticateJWT`.
    3.  **Validar la existencia de `req.user` y `req.user.institutionId`**. Si no existen, es un error crítico del servidor.
    4.  Extraer el `institutionId` y el `userId` de `req.user`.
    5.  Llamar a la función de servicio correspondiente, pasando el `institutionId`, `userId` y los datos de la petición.
    6.  Manejar la respuesta del servicio:
        *   Si es exitosa, transformar el resultado (si es necesario) a un formato de respuesta para el cliente (DTO - Data Transfer Object) y enviarlo con el código de estado adecuado (200, 201).
        *   Si hay un error, capturarlo en un bloque `try...catch` y enviar una respuesta de error con el código apropiado (400, 404, 500).

### Capa 3: Servicio (`.service.ts`)

*   **Propósito:** Contener toda la lógica de negocio. Es el corazón de la feature.
*   **Implementación:**
    1.  Recibe los datos del controlador, incluyendo siempre el `institutionId`.
    2.  **Validación de Integridad Referencial:** Antes de crear/actualizar, usar `validateAllExist` para asegurar que los IDs de documentos relacionados (ej: `subjectId`, `periodId`) son válidos y existen.
    3.  **Aplicación de la Seguridad Multi-tenant:**
        *   **Para Lecturas (`find`, `findById`):** La consulta a la base de datos **DEBE** incluir el filtro `{ institutionId }`.
        *   **Para Creaciones (`create`):** El objeto a guardar **DEBE** incluir el campo `institutionId`.
        *   **Para Actualizaciones/Borrados (`update`, `delete`):** La consulta para encontrar el documento **DEBE** incluir tanto el `_id` del documento como el `institutionId`. Ejemplo: `Model.findOneAndUpdate({ _id: docId, institutionId: instId }, ...)`
    4.  Interactuar con la capa de datos (Repositorio o Modelos de Mongoose).
    5.  Realizar cualquier otra lógica de negocio (cálculos, transformaciones, etc.).
    6.  Devolver el resultado al controlador o lanzar un error si la operación falla.

### Capa 4: Modelo y Datos (`.model.ts` y `repositories`)

*   **Propósito:** Definir la estructura de los datos y la interacción con la base de datos.
*   **Implementación (`.model.ts`):**
    1.  Definir la interfaz del documento de Mongoose (`IDocument`).
    2.  Crear el `Schema` de Mongoose.
    3.  **Ancla Multi-tenant:** El esquema **DEBE** contener el campo `institutionId` definido como: `institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true }`.
    4.  Exportar el modelo compilado: `model<IDocument>('MiModelo', MiSchema)`.
*   **Implementación (`repositories/base.repository.ts`):**
    *   Para operaciones CRUD muy simples y genéricas, se pueden usar las funciones del repositorio base para mantener el código DRY.
    *   Para operaciones que requieren lógica específica o consultas complejas (como las de actualización/borrado multi-tenant), es aceptable usar los modelos de Mongoose directamente en la capa de servicio.

## 4. Resumen del Patrón Multi-Tenant

1.  **Token JWT:** El `institutionId` y el `role` del usuario se codifican en el token durante el login.
2.  **Middleware `authenticateJWT`:** En cada petición, decodifica el token, verifica el usuario contra la BD y adjunta un objeto `user` seguro (con `_id`, `institutionId`, `role`, etc.) al objeto `req`.
3.  **Controlador:** Extrae el `institutionId` de `req.user`. **Nunca confía en un `institutionId` que venga del cliente (body/params)**.
4.  **Servicio:** Recibe el `institutionId` del controlador y lo usa para filtrar **TODAS** las consultas a la base de datos.
5.  **Modelo:** El campo `institutionId` es `required: true` en el esquema de la base de datos, asegurando que ningún dato pueda existir sin un dueño.

Siguiendo esta guía de forma estricta, aseguraremos que Academic-Quartz sea una plataforma robusta, segura y fácil de mantener a largo plazo.
