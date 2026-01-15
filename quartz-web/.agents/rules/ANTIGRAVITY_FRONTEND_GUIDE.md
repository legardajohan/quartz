# Antigravity Frontend Development Guide - Quartz Web

## 1. Introduction
This guide establishes the standards for the **Quartz** frontend. We use **React + TypeScript + Vite** with a focus on **UX Excellence** and **Robust State Management**.

---

## 2. Core Architecture Rules

### 2.1 State Management (Zustand)
We use **Zustand** for global client state.
-   **Auth Store:** `features/auth/useAuthStore.ts` is the Source of Truth for:
    -   Authentication Token (`token`)
    -   User Profile (`sessionData.user`)
    -   User Context (`institutionId`, etc.)
-   **Persistence:** The store automatically persists to `localStorage`.

### 2.2 API Communication (Axios)
**NEVER** use `fetch` directly. Always use the centralized `apiClient`.
-   **Location:** `src/api/apiClient.ts`
-   **Usage:**
    ```typescript
    import { apiGet, apiPost } from '@/api/apiClient';

    const loadData = async () => {
      const data = await apiGet('/learning/my-courses');
    };
    ```
-   **Magic:**
    -   **Request:** Automatically injects `Authorization: Bearer <token>`.
    -   **Response:** Automatically intercepts `401 Unauthorized` and logs the user out.

### 2.3 Component Structure
Follow a "Feature-first" folder structure similar to the backend.
```
src/features/learning/
├── components/           # UI Components specific to this feature
│   ├── LearningCard.tsx
│   └── LearningList.tsx
├── hooks/                # Custom hooks (logic separation)
│   └── useLearning.ts
├── pages/                # Page-level components (Routed)
│   └── LearningPage.tsx
└── types/                # TypeScript interfaces
    └── learning.types.ts
```

---

## 3. Development Standards

### 3.1 Naming Conventions
-   **Components/Files:** `PascalCase.tsx` (e.g., `StudentValuationTable.tsx`)
-   **Hooks:** `camelCase` (prefix `use`) (e.g., `useStudentList.ts`)
-   **Functions:** `camelCase` (e.g., `handleSubmit`)
-   **Types/Interfaces:** `PascalCase` (e.g., `IStudent`, `LearningProps`)

### 3.2 Styling (Tailwind CSS)
-   Use **Tailwind CSS** for all styling.
-   Avoid inline styles (`style={{ ... }}`).
-   Build responsive designs mobile-first (`class="w-full md:w-1/2"`).

### 3.3 Security & Auth in Components
-   **Accessing User Data:**
    ```typescript
    const { sessionData } = useAuthStore();
    const role = sessionData?.user.role;
    ```
-   **Protected Routes:** Ensure pages are wrapped in the `ProtectedRoute` layout or check auth state before rendering sensitive content.

---

## 4. Agent Instructions
When building UI features:
1.  **Check Design:** Understand the requirement (Mobile vs Desktop).
2.  **Define Types:** Create `features/[name]/types/[name].types.ts` first.
3.  **Build Components:** Create dumb UI components in `components/`.
4.  **Integrate API:** Use `apiClient` inside custom hooks or `useEffect`.
5.  **Assemble Page:** Combine everything in `pages/`.
