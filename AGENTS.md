# Renovar Frontend - Agent Guide

This document provides guidelines for AI agents and developers working on the Renovar frontend codebase. It outlines the project structure, development workflows, code style, and best practices.

## 1. Project Overview

- **Stack:** React 19, Vite 6, Tailwind CSS 4.
- **Language:** JavaScript (ES Modules, `.jsx`).
- **State Management:** React Context API + Local State.
- **Routing:** React Router DOM v7.
- **Styling:** Tailwind CSS + Lucide React (Icons).
- **HTTP Client:** Native `fetch` wrapped in `src/services/api.js`.

## 2. Build, Lint, and Test Commands

### Development Server
Start the local development server:
```bash
npm run dev
```
*   Runs on `http://localhost:5173` (default).
*   Uses Vite for HMR (Hot Module Replacement).

### Production Build
Build the application for production:
```bash
npm run build
```
*   Output directory: `dist/`.
*   Preview the build locally: `npm run preview`.

### Linting
Run ESLint to check for code quality and style issues:
```bash
npm run lint
```
*   **Config:** `eslint.config.js`
*   **Plugins:** `react-hooks`, `react-refresh`.
*   **Note:** The project uses flat config format.

### Testing
*   **Status:** There is currently **no test runner configured** (e.g., Vitest, Jest) and no test files exist in the repository.
*   **Action:** If tasked with writing tests, first propose setting up Vitest, as it integrates natively with Vite.

## 3. Code Style & Conventions

### 3.1. File Structure
*   `src/components/`: Reusable UI components.
*   `src/pages/`: Page components corresponding to routes.
*   `src/services/`: API integration logic (`api.js`).
*   `src/context/`: Global state (e.g., `AuthContext`).
*   `src/hooks/`: Custom React hooks (e.g., `usePersonalAPI`).
*   `src/utils/`: Helper functions (e.g., export to CSV).

### 3.2. Component Guidelines
*   **Definition:** Use **Arrow Functions** for component definitions.
    ```jsx
    const MyComponent = ({ prop1, prop2 }) => { ... };
    export default MyComponent;
    ```
*   **Naming:** PascalCase for components (`UserProfile.jsx`) and camelCase for logic files (`api.js`).
*   **Props:** Destructure props in the function signature.
*   **Hooks:** Follow the Rules of Hooks. Keep effects clean and include all dependencies in the dependency array.

### 3.3. Imports
*   **Relative Paths:** Use relative imports (e.g., `../../components/Button`) as path aliases (like `@/`) are not currently configured in `vite.config.js`.
*   **Order:**
    1.  React and standard libraries.
    2.  Third-party libraries (e.g., `react-router-dom`, `lucide-react`).
    3.  Internal components.
    4.  Services and Context.
    5.  Utils and Assets.
    ```jsx
    import React, { useState } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { User } from 'lucide-react';
    import MyModal from '../components/MyModal';
    import * as api from '../services/api';
    ```

### 3.4. Styling (Tailwind CSS)
*   Use utility classes directly in the `className` prop.
*   Avoid inline `style={{ ... }}` objects unless dynamic values (like coordinates) are required.
*   **Icons:** Use `lucide-react` components with Tailwind classes for sizing and color.
    ```jsx
    <User className="h-5 w-5 text-gray-500" />
    ```

### 3.5. State Management
*   **Local State:** Use `useState` for component-specific logic (modals, forms).
*   **Global State:** Use Context API (`src/context/`) for session data (Auth) or theme.
*   **Server State:** Prefer custom hooks (e.g., `usePersonalAPI`) to encapsulate data fetching and mutation logic.

## 4. API Integration Pattern

The project uses a centralized API service pattern in `src/services/api.js`.

### 4.1. Pattern
*   **Do not use `fetch` directly in components.**
*   Import functions from `src/services/api.js`.
*   The `apiRequest` wrapper handles:
    *   Base URL prepending.
    *   Authorization headers (Bearer token from `localStorage`).
    *   Standard error handling and logging.

### 4.2. Example Usage
**Defining an Endpoint (`src/services/api.js`):**
```javascript
export const getEmployees = (params) => {
  const queryParams = new URLSearchParams(params).toString();
  return apiRequest(`/employees/?${queryParams}`);
};
```

**Consuming in Component:**
```jsx
import * as api from '../services/api';

const loadData = async () => {
  try {
    const data = await api.getEmployees({ page: 1 });
    setEmployees(data);
  } catch (error) {
    toast.error('Failed to load employees');
  }
};
```

## 5. Error Handling

*   **API Errors:** The `apiRequest` function throws errors with a `message` property. Catch these in components/hooks.
*   **UI Feedback:** Use `sonner` for toast notifications.
    ```jsx
    import { toast } from 'sonner';
    // ...
    toast.error('Error message here');
    toast.success('Operation successful');
    ```

## 6. Git & Version Control

*   **Commits:** Use conventional commits (e.g., `feat: add user login`, `fix: resolve layout bug`).
*   **Branches:** Create feature branches for new tasks.

## 7. Performance Considerations

*   **Memoization:** Use `useMemo` for expensive calculations (e.g., filtering large lists) and `useCallback` for event handlers passed to children.
*   **Loading States:** Always handle loading states (e.g., `isLoading`) to prevent UI flashes. Use skeletons or spinners (e.g., `Loader2` from `lucide-react`).

## 8. Specific Feature Implementation Details

*   **Modals:** Use the `ModernModal` component found in `src/components/ModernModal.jsx`.
*   **Forms:**
    *   Use controlled components.
    *   For file uploads, use `FormData` (see `apiRequestWithFile` in `api.js`).
*   **Tables:**
    *   Implement pagination manually using backend `page` and `size` params.
    *   Handle empty states gracefully.

## 9. Environment Variables
*   Ensure `.env` files are configured correctly.
*   Access variables via `import.meta.env` (e.g., `import.meta.env.VITE_API_URL` - *note: currently hardcoded in api.js, consider refactoring to env var*).
