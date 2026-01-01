# TODO.md - Semantic Loop DevOps Demonstrator

> Working queue for fixes and enhancements. Generated from comprehensive code review.

---

## Completed (Sprint 1)

### ~~BUG-001: Missing index.css file~~ ✅
- **Status:** COMPLETED
- **Resolution:** Created `index.css` with custom animations, scrollbar styling, and Vega chart theme overrides.

### ~~SEC-001: XSS vulnerability via dangerouslySetInnerHTML~~ ✅
- **Status:** COMPLETED
- **Resolution:** Added DOMPurify library and sanitization in `CollapsibleStory` component with restricted allowed tags/attributes.

### ~~ARCH-002: No error boundary~~ ✅
- **Status:** COMPLETED
- **Resolution:** Created `components/ErrorBoundary.tsx` with error display, retry, and reload functionality. Integrated in `index.tsx`.

### ~~TEST-001: No unit tests~~ ✅
- **Status:** COMPLETED
- **Resolution:** Set up Vitest with React Testing Library. Created tests for utilities, reducer, and ErrorBoundary component.

### ~~CODE-001: Duplicate downloadFile function~~ ✅
- **Status:** COMPLETED
- **Resolution:** Extracted to `utils/download.ts` with `downloadFile()` and `jsonToCsv()` functions. Updated all 3 components to use shared utility.

---

## Completed (Sprint 2)

### ~~ARCH-001: Single isLoading state for all operations~~ ✅
- **Status:** COMPLETED
- **Resolution:** Replaced single `isLoading` boolean with a `loadingStates` object for granular, per-operation loading status.

### ~~ARCH-003: No state persistence~~ ✅
- **Status:** COMPLETED
- **Resolution:** Implemented state persistence to `localStorage` via `utils/storage.ts` helpers. State is loaded on init and saved on change.

### ~~DEV-001: No linting configuration~~ ✅
- **Status:** COMPLETED
- **Resolution:** Added `eslint.config.js` and `.prettierrc` for standardized, automated linting and code formatting.

### ~~SEC-002: No input sanitization on user prompts~~ ✅
- **Status:** COMPLETED
- **Resolution:** Integrated `DOMPurify` in `services/geminiService.ts` to sanitize all user-provided text before API submission.

### ~~SEC-003: No rate limiting on API calls~~ ✅
- **Status:** COMPLETED
- **Resolution:** Implemented a client-side `rateLimitedApiCall` wrapper in `geminiService.ts` to enforce a cooldown between requests.

### ~~ARCH-004: No confirmation dialogs~~ ✅
- **Status:** COMPLETED
- **Resolution:** Added a `window.confirm` dialog to the "Start Over" button to prevent accidental data loss.

### ~~UX-003: Dropdown menu accessibility~~ ✅
- **Status:** COMPLETED
- **Resolution:** Implemented full keyboard navigation, focus management, and ARIA attributes for the view selector dropdown menu.

### ~~UX-004: No undo/redo for schema refinements~~ ✅
- **Status:** COMPLETED
- **Resolution:** Added `schemaHistory` array and `currentSchemaIndex` to the app state, with `UNDO_SCHEMA_CHANGE` and `REDO_SCHEMA_CHANGE` actions in the reducer.

---

## Completed (Sprint 3)

### ~~BUG-004: Empty PromptInput.tsx file~~ ✅
- **Status:** COMPLETED
- **Resolution:** Integrated file upload functionality directly into `ChatInput.tsx` and removed the separate `FileUpload.tsx` component.

### ~~TEST-002: No integration tests~~ ✅
- **Status:** COMPLETED
- **Resolution:** Added a new integration test for the schema generation workflow, including assertions for file uploads.

### ~~DEV-003: No CI/CD pipeline~~ ✅
- **Status:** COMPLETED
- **Resolution:** Created a GitHub Actions workflow (`.github/workflows/ci.yml`) to run linting, tests, and build on push/PR to the main branch.

### ~~TEST-003: No E2E tests~~ ✅
- **Status:** COMPLETED
- **Resolution:** Set up Playwright for end-to-end testing, including a configuration file, example test, and `test:e2e` script.

### ~~FEAT-002: Save/Load projects~~ ✅
- **Status:** COMPLETED
- **Resolution:** Implemented "Save Project" and "Load Project" buttons in the header to download and upload the project state as a JSON file.

---

## Completed (Sprint 4)

### ~~ARCH-005: Errors not cleared between operations~~ ✅
- **Status:** COMPLETED
- **Resolution:** Added `SET_ERROR: null` dispatch to the start of all artifact generation functions in `ArtifactsPanel.tsx`.

### ~~UX-005: Row count input lacks validation~~ ✅
- **Status:** COMPLETED
- **Resolution:** Added `min`/`max` attributes and a clamping `onChange` handler to the row count input field in `App.tsx`.

### ~~UX-006: No full schema export~~ ✅
- **Status:** COMPLETED
- **Resolution:** Added an "Export All" button to `SchemaVisualizer.tsx` to download the complete schema as a JSON file.

### ~~CODE-002: Dead/unused component files~~ ✅
- **Status:** COMPLETED
- **Resolution:** Removed unused `FeedbackLoop.tsx` and `ExportView.tsx` files and associated documentation references.

### ~~BUG-003: Comment/code mismatch in generateVisualization~~ ✅
- **Status:** COMPLETED
- **Resolution:** Corrected the comment in `geminiService.ts` to match the array slice value (25).

---

## Completed (Sprint 5)

### ~~BUG-002: Missing favicon.svg~~ ✅
- **Status:** COMPLETED
- **Resolution:** Added a placeholder `favicon.svg` to the project root to resolve the missing icon error.

### ~~UX-002: No toast notifications~~ ✅
- **Status:** COMPLETED
- **Resolution:** Implemented a toast notification system and integrated it with the Save/Load project features.

### ~~PERF-003: Tailwind CSS via CDN~~ ✅
- **Status:** COMPLETED
- **Resolution:** Migrated from the Tailwind CSS CDN to a more performant build-time integration with Vite.

### ~~DEV-002: No pre-commit hooks~~ ✅
- **Status:** COMPLETED
- **Resolution:** Set up Husky and lint-staged to automatically run ESLint and Prettier on staged files before each commit.

### ~~CODE-004: Missing explicit return types~~ ✅
- **Status:** COMPLETED
- **Resolution:** Added explicit return type annotations to all functions and components that were missing them, improving type safety.

---

---

## Completed (Sprint 6)

### ~~FEAT-001: Dark/Light mode toggle~~ ✅
- **Status:** COMPLETED
- **Resolution:** Implemented a dark/light mode toggle button in the header, with state management and dynamic class application to the root element.

### ~~PERF-002: No code splitting~~ ✅
- **Status:** COMPLETED
- **Resolution:** Implemented code splitting for tab components using `React.lazy` and `Suspense` to improve initial load time.

### ~~FEAT-004: Multi-table CSV export~~ ✅
- **Status:** COMPLETED
- **Resolution:** Added a feature to export all sample data tables as a single ZIP file containing multiple CSVs, using the `jszip` library.

### ~~FEAT-006: Copy schema as different formats~~ ✅
- **Status:** COMPLETED
- **Resolution:** Added a feature to copy the schema in different formats (TypeScript, Prisma) using a new `transformSchema` service and UI controls in the `SchemaVisualizer`.

---

## Remaining Tasks

### Code Quality Issues

### CODE-003: Inconsistent JSDoc documentation
- **Files:** Various components
- **Priority:** Low
- **Description:** Some files have comprehensive JSDoc (types.ts, constants.ts, geminiService.ts) while components lack documentation.
- **Fix:** Add JSDoc comments to all exported components and functions.

---

## UI/UX Enhancements

### UX-001: No skeleton loading states
- **Priority:** Low
- **Description:** Only spinner loaders are used. Skeleton screens would provide better UX.
- **Fix:** Implement skeleton components for schema cards, data tables, etc.

---

## Performance Optimizations

### PERF-001: No React.memo or useMemo usage
- **Files:** All components
- **Priority:** Low
- **Description:** Components re-render on every state change without memoization.
- **Fix:** Add React.memo to pure components and useMemo/useCallback for expensive operations.

---

## DevOps & Tooling

### DEV-004: TypeScript could be stricter
- **File:** `tsconfig.json`
- **Priority:** Low
- **Description:** Some strict TypeScript options are not enabled.
- **Fix:** Consider enabling `noImplicitReturns`, `noFallthroughCasesInSwitch`, `strictNullChecks`.

---

## Feature Requests

### FEAT-003: Schema version history
- **Priority:** Low
- **Description:** Track schema changes over time with ability to revert.

### FEAT-005: Keyboard shortcuts
- **Priority:** Low
- **Description:** Add keyboard shortcuts for common actions (generate, refine, export).

---

## Task Statistics

| Category | Total | Completed | Next Sprint | Remaining | Critical | High | Medium | Low |
|----------|-------|-----------|-------------|-----------|----------|------|--------|-----|
| **Bugs** | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| **Security** | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| **Code Quality** | 4 | 3 | 0 | 1 | 0 | 0 | 0 | 1 |
| **Architecture** | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 0 |
| **UX/UI** | 6 | 5 | 0 | 1 | 0 | 0 | 0 | 1 |
| **Performance** | 3 | 2 | 0 | 1 | 0 | 0 | 0 | 1 |
| **Testing** | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| **DevOps** | 4 | 3 | 0 | 1 | 0 | 0 | 0 | 1 |
| **Features** | 6 | 4 | 0 | 2 | 0 | 0 | 0 | 2 |
| **TOTAL** | **38** | **32** | **0** | **6** | **0** | **0** | **0** | **6** |

### Progress Summary
- **Completed:** 32 tasks
- **Next Sprint:** 0 tasks
- **Remaining:** 6 tasks
- **Critical:** 0 tasks
- **High:** 0 tasks
- **Medium:** 0 tasks
- **Low:** 6 tasks

---

*Last updated: 2025-12-17*
*Sprints 1, 2, 3, 4 & 5 completed: 28 tasks*
*Generated by: Claude Code review (and updated by Gemini)*
