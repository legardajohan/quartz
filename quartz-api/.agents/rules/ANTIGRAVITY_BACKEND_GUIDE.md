# Antigravity Backend Development Guide - Quartz API

## 1. Introduction & Philosophy
This guide defines the engineering standards for the **Quartz** backend. We follow a **Modular Monolith** architecture with strict **Domain-Driven Design (DDD)** principles ("Screaming Architecture").

**Key Change:** We exclusively use a **Functional/Module Pattern**. Avoid Classes for features (Controllers/Services).

---

## 2. Core Architecture Rules

### 2.1 Screaming Architecture
Do not group by technical layer (`/controllers`, `/services`). Group by **Feature/Domain**.
```
src/features/learning/
├── learning.controller.ts  # Functional Controller
├── learning.service.ts     # Functional Service
├── learning.routes.ts      # Route Definitions
├── learning.model.ts       # Mongoose Schema
├── learning.types.ts       # Types & DTOs
└── learning.validation.ts  # Zod Schemas
```

### 2.2 Functional Pattern (No Classes)
**Rule:** Use standard ES Modules with named exports for Controllers and Services.

**Service Example (`feature.service.ts`):**
```typescript
import { MyModel } from './feature.model';
import { CreateData } from './feature.types';

export const createFeature = async (data: CreateData, institutionId: string) => {
  // Business logic here
  return await MyModel.create({ ...data, institutionId });
};
```

**Controller Example (`feature.controller.ts`):**
```typescript
import { Request, Response } from 'express';
import { createFeature } from './feature.service';

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { institutionId } = req.user!;
    const result = await createFeature(req.body, institutionId);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
```

### 2.3 Strict Multi-Tenancy (CRITICAL)
Quartz is a SaaS. Data leakage between institutions is a critical failure.
-   **Read Operations:** ALWAYS filter by `institutionId`.
    ```typescript
    // CORRECT
    Model.findOne({ _id: id, institutionId: userInstitutionId });
    ```
-   **Write Operations:** ALWAYS enforce `institutionId` from the authenticated user token.

---

## 3. Development Standards

### 3.1 Naming Conventions
-   **Files:** `kebab-case` (e.g., `checklist-template.service.ts`)
-   **Functions:** `camelCase` (e.g., `getChecklistTemplatesByTeacherId`)
-   **Interfaces:** `PascalCase` (e.g., `IChecklistTemplateResponse`)

### 3.2 Code Structure - The "Quartz Way"
Reflecting the user's preferred style:
-   **Repository Pattern (Light):** Use helper functions like `populateChecklistTemplateDetails` inside the service to keep queries clean.
-   **Lean Queries:** Use `.lean()` extensively for performance when returning data to the client.
-   **Explicit Types:** Define interfaces for DB Documents (`IDocument`), Requests, and Responses (`IResponse`).

### 3.3 Layered Responsibilities
1.  **Routes**: `router.post('/', FeatureController.create)`.
2.  **Controller**: Extracts data, calls Service functions. Handles HTTP responses.
3.  **Service**: Pure business logic. Imports Mongoose Models directly or via Repository helpers.
4.  **Model**: Mongoose Schema definitions.

---

## 4. Agent Instructions
When implementing new features:
1.  **Define Types:** strict interfaces for Input/Output.
2.  **Service First:** Implement logic as exported functions (`export const`).
3.  **Controller Second:** Wire up the request to the service functions.
4.  **Routes Last:** Expose the endpoints.
