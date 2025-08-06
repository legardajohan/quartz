# Copilot Instructions for Academic Quartz

## Project Overview
- **Academic Quartz** is a MERN stack web application for managing academic performance and qualitative student evaluations, initially focused on the "Transition Grade" (pre-school) in Colombian schools.
- The system is designed for multi-tenancy (multiple institutions) and will scale to support quantitative grading for higher grades in the future.
- The architecture is split into:
  - `academic-quartz-api/`: Node.js/Express backend (REST API), MongoDB database.
  - `academic-quartz-web/`: React + TypeScript frontend (currently empty or WIP).
  - `dev/`: Contains project documentation, DB scripts, and design assets (mockups, wireframes). It is important to clarify that Figma MCP is available to directly access UI designs for the frontend.

## Data Model & Domain
- MongoDB is used with a highly normalized, multi-tenant schema. Key collections: `educationalInstitutions`, `users`, `schools`, `periods`, `subjects`, `expectedLearnings`, `concepts`, `checklistTemplates`, `studentValuations`, `notifications`.
- The concept of "dimensions" (e.g., Cognitive, Spiritual) is unified under the `Subject` entity.
- All institution-specific data references `institutionId` for isolation and performance.
- See `dev/Academic-Quartz-ProjectComplete.md` for detailed entity definitions and business logic.
- See `dev/script-db.js` for MongoDB collection setup and indexes.

## Developer Workflows
- **Database setup:**
  - Use `dev/script-db.js` in the MongoDB shell to create collections and indexes. Adjust the `use <db>` line as needed.
- **Backend:**
  - No `package.json` or source code is present in `academic-quartz-api/` yet. Standard Node.js/Express conventions are expected.
- **Frontend:**
  - No code present in `academic-quartz-web/` yet. Plan for React + TypeScript + Tailwind CSS + Zustand.
- **Design:**
  - For UI/UX references, the `Figma MCP` will be used, where fragments of sections will be given to do it in an orderly manner.

## Project-Specific Conventions
- All user, subject, and period data is always scoped by `institutionId`.
- Subjects (dimensions) are global if `educationalInstitutionId` is null, otherwise institution-specific.
- Qualitative assessment uses fixed concepts: `Achieved`, `InProgress`, `WithDifficulty`.
- Checklist templates define the structure of evaluations per period and subject.
- No historical PDFs are stored; reports are generated on demand from current data.

## Integration & External Dependencies
- Authentication is planned via JWT and/or OAuth (Google preferred).
- Email notifications and in-app alerts are part of the notification model.
- Figma design integration is configured via MCP for design asset automation.

## Examples & References
- See `dev/Academic-Quartz-ProjectComplete.md` for business rules, data flows, and entity relationships.
- See `dev/script-db.js` for DB structure and index patterns.
- See `dev/design/` for UI/UX guidance.

---

## Development Guide and Principles

### 1. General Coding Principles
- **Language & Style:** Use strict TypeScript. Follow the rules defined in the `.eslintrc.json` file (to be created). Code should be self-documented, but use JSDoc comments for complex and public functions.
- **Immutability:** In the frontend, never mutate state directly. Always create new objects or arrays.
- **Error Handling:** Any API call or process that might fail must be wrapped in a `try...catch` block.

### 2. Backend Development Guide (Node.js/Express)
- **Layered Architecture:**
  - **Routes (`.routes.js`):** Define endpoints and call the controllers.
  - **Controllers (`.controller.js`):** Handle the `request` and `response`. Extract data from the request and call services. **No business logic** should exist here.
  - **Services (`.service.js`):** Contain all business logic. Coordinate calls to database models and return results to controllers.
  - **Models (`.model.js`):** Define Mongoose/MongoDB schemas and handle direct interaction with the database.
- **Validation:** Use a library like `Joi` or `express-validator` to validate all input data (`body`, `params`, `query`) at the route or controller level.
- **API Security:** All routes (except login/register) must be protected by JWT authentication middleware. Every database query **must** be filtered by `institutionId` to ensure data isolation.

### 3. Frontend Development Guide (React/Zustand)
- **Component Structure:**
  - `features/`: Folders by business domain (e.g., `auth`, `students`).
  - `components/common/`: Generic, reusable UI components (Button, Input, Modal).
  - `pages/`: Components representing full pages, composed of `features` components.
- **State Management (Zustand):**
  - Create one store per `feature` (e.g., `src/features/students/useStudentsStore.ts`).
  - Actions that perform API calls must handle `loading` and `error` states.
- **API Calls:**
  - Create a centralized `axios` instance (`src/api/apiClient.ts`). This instance should set the `baseURL` and automatically attach the JWT token to all request headers.
  - Components **must not** use `fetch` or `axios` directly. They should invoke actions defined in the Zustand stores.

  
### 4. Architecture & Folder Structure

#### 4.1 Software Architecture

- **Backend - Modular Monolith:**  
  The backend is designed as a **Modular Monolith**, meaning we maintain a single codebase and deploy a single Node.js/Express application. However, it is internally structured into **isolated business modules** (e.g., `users`, `evaluations`, `reports`).  
  This provides most of the benefits of microservices—clear responsibilities, modularity, and easier maintenance—**without the initial complexity** of distributed systems.  
  If scalability demands it, each module can be later extracted into an independent microservice with minimal effort.

- **Frontend - Decoupled SPA:**  
  The frontend is a fully decoupled **Single Page Application (SPA)** built with React and TypeScript. It communicates with the backend exclusively via **RESTful APIs**.  
  This allows the frontend and backend to evolve independently and enables fast, responsive user interfaces.

- **Multi-Tenancy:**  
  The system supports **multi-tenancy at the application level** using a shared MongoDB database.  
  Every collection and query must filter by `institutionId` to isolate data between organizations and ensure security and performance.

- **Technology Stack:**  
  The project uses the **MERN stack**: MongoDB, Express, React, and Node.js. This stack is ideal for scalable, modular, and performant web applications with a strong community and tooling ecosystem.

---

#### 4.2 Folder Structure (Screaming Architecture)

We follow the **Screaming Architecture** principle: the folder structure should immediately reveal the business capabilities of the system (e.g., `auth`, `students`, `evaluations`), not technical layers (`controllers`, `models`, etc.).

##### ✅ Backend Folder Structure (Node.js + Express)

```
academic-quartz-api/
│
├── src/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.model.ts
│   │   ├── students/
│   │   │   ├── ...
│   │   └── evaluations/
│   ├── middlewares/
│   ├── utils/
│   └── app.ts
├── package.json
└── tsconfig.json
```

##### ✅ Frontend Folder Structure (React + TypeScript)

```
academic-quartz-web/
│
├── src/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── useAuthStore.ts
│   │   ├── students/
│   │   └── evaluations/
│   ├── components/
│   │   └── common/        # Reusable UI components (Button, Input, Modal, etc.)
│   ├── pages/             # Top-level pages that compose features
│   ├── api/               # axios instance and API functions
│   │   └── apiClient.ts
│   ├── hooks/
│   ├── styles/
│   └── main.tsx
├── package.json
└── tsconfig.json
```

##### ✅ Naming Conventions

| Element              | Convention           | Example                     |
|----------------------|----------------------|-----------------------------|
| Files & Folders      | `kebab-case`         | `use-auth-store.ts`         |
| React Components     | `PascalCase`         | `StudentCard.tsx`           |
| Variables/Functions  | `camelCase`          | `fetchStudentData()`        |
| Constants            | `SCREAMING_SNAKE_CASE` | `API_BASE_URL`              |

---

> This structure promotes clarity, maintainability, and scalability from the beginning of the project lifecycle. It also enables future migration to microservices if needed with minimal restructuring.


For any unclear or missing conventions, consult `dev/Academic-Quartz-ProjectComplete.md` or ask the project owner for clarification.
