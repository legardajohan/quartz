# Academic Quartz API

This is the backend API for the Academic Quartz platform. It is built with Node.js, Express, and TypeScript, and it uses MongoDB as its database.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- MongoDB instance (local or cloud-based)

### Installation

1.  **Clone the repository**

2.  **Navigate to the API directory:**
    ```bash
    cd academic-quartz-api
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Create an environment file:**
    Create a `.env` file in the `academic-quartz-api` root directory. This file will store your environment-specific configurations. You will need to add the following variables:

    ```env
    # The connection string for your MongoDB database
    DB_CONNECTION_STRING=mongodb://user:password@host:port/database_name

    # A secret key for signing JWTs
    JWT_SECRET=your_super_secret_key

    # The port the server will run on
    PORT=3000
    ```

### Running the Application

-   **Development Mode:** For running the server with hot-reloading on file changes.
    ```bash
    npm run dev
    ```

-   **Production Mode:** For starting the server in a production context.
    ```bash
    npm start
    ```

The server will be running on the port specified in your `.env` file (e.g., `http://localhost:3000`).

---

## Project Structure

The API follows a **feature-based architecture**. The goal is to group code by business domain rather than by technical role. All the code related to a specific feature (e.g., `auth`, `expected-learning`) is located within its own directory under `src/features/`.

```
src/
├── app.ts             # Main application entry point
├── features/          # Where the core business logic lives
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.model.ts
│   │   ├── auth.routes.ts
│   │   ├── auth.service.ts
│   │   └── auth.validation.ts
│   └── ... more features
├── middlewares/       # Shared Express middlewares
└── types/             # Global TypeScript definitions
```

-   **`*.model.ts`**: Defines the Mongoose schema and TypeScript interface for the feature's data model.
-   **`*.service.ts`**: Contains the core business logic and database interactions.
-   **`*.controller.ts`**: Handles the Express request and response objects, calling the service to perform actions.
-   **`*.routes.ts`**: Defines the API endpoints for the feature and connects them to controllers and middlewares.
-   **`*.validation.ts`**: Defines the Zod schemas for validating incoming request data.

---

## Core Concepts

### Middleware Pipeline

Requests to protected routes flow through a standard pipeline of middlewares to ensure security and data integrity:

1.  **`authenticateJWT`**: Checks for a valid JSON Web Token (JWT) in the `Authorization` header. If valid, it decodes the payload and attaches the user object to `req.user`.

2.  **`authorize`**: (Optional) An authorization middleware that checks if the `req.user` has the required role to access the endpoint. It takes an array of allowed roles.

3.  **`validate`**: Uses a Zod schema to validate the incoming `req.body`, `req.query`, or `req.params`. If validation fails, it returns a `400 Bad Request` with detailed errors.

### Validation with Zod

We use `Zod` for robust and type-safe validation of all incoming data. Validation schemas are defined in the feature's `*.validation.ts` file.

**Example: `expected-learning.validation.ts`**
```typescript
import { z } from 'zod';

export const createExpectedLearningSchema = z.object({
  body: z.object({
    institutionId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val)),
    description: z.string().min(1, 'Description cannot be empty.'),
    // ... other fields
  }),
});
```

This schema is then used in the route definition with the `validate` middleware.

### Authentication & Authorization

-   **Authentication**: Handled via JWTs. The `POST /auth/login` endpoint returns a token upon successful login, which must be sent with subsequent requests.

-   **Authorization**: Role-based access control is managed by the `authorize` middleware. It provides a clean and declarative way to protect endpoints.

**Example: Protecting a route**
```typescript
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';

// This route is only accessible by authenticated users with the 'Jefe de Área' role.
router.post(
  '/',
  authenticateJWT,
  authorize(['Jefe de Área']),
  validate(createExpectedLearningSchema),
  expectedLearningController
);
```
