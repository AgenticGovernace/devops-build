# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Semantic Loop DevOps Demonstrator** - An AI-powered database schema design and development artifacts generator. This React/TypeScript application uses Google's Gemini AI to create a complete workflow from natural language descriptions to database schemas, sample data, visualizations, and development artifacts.

Original AI Studio app: https://ai.studio/apps/drive/1VMqOjzKJjeegdGYObBUwx2f4LBCwn7CT

## Development Commands

### Core Commands
```bash
# Install dependencies
npm install

# Run development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm preview
```

### Testing
```bash
# Run unit tests in watch mode
npm test

# Run all unit tests once
npm run test:run

# Run unit tests with coverage
npm run test:coverage

# Run E2E tests (Playwright)
npm run test:e2e
```

Test files:
- Unit tests: `tests/**/*.{test,spec}.{ts,tsx}` (Vitest + React Testing Library)
- E2E tests: `e2e/**/*.spec.ts` (Playwright)
- Test setup: `tests/setup.ts`

### Linting and Formatting
```bash
# Lint TypeScript/React files
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting without changes
npm run format:check
```

**Pre-commit hooks**: Husky runs `lint-staged` automatically, which formats and lints changed files before commit.

### Environment Setup
Create `.env.local` in the project root:
```env
GEMINI_API_KEY=your_api_key_here
```

The API key is injected via Vite config as `process.env.API_KEY` and `process.env.GEMINI_API_KEY`.

## Architecture

### State Management (Flux Pattern)

This application uses **React Context + useReducer** (NOT Redux) implementing the Flux architecture pattern:

- **store.tsx**: Exports `AppProvider` and `useAppStore()` hook
- **types.ts**: Defines all `AppAction` discriminated union types
- **State updates**: Always immutable via spread syntax in reducer

```typescript
// Access state and dispatch
const { state, dispatch } = useAppStore();

// Dispatch actions
dispatch({ type: 'SET_SCHEMA', payload: newSchema });
dispatch({ type: 'SET_LOADING', payload: true });
```

All state mutations flow through the reducer - never mutate state directly.

### AI Service Layer

**services/geminiService.ts** is the single source of truth for all Gemini AI interactions:

- `generateSchema()` - Creates database schemas from natural language
- `refineSchema()` - Modifies existing schemas via conversation
- `generateSql()` - Produces DDL for PostgreSQL or MySQL
- `generateSampleData()` - Creates realistic test data with referential integrity
- `generateVisualization()` - Creates Vega-Lite chart specs with Google Search grounding
- `generateChartSuggestions()` - Suggests relevant visualizations
- `generateUserStories()` - Produces Gherkin-format product backlog
- `generateApiDocs()` - Generates OpenAPI-style REST documentation
- `generateTestCases()` - Creates BDD scenarios in Gherkin format

### AI Temperature Settings

Different functions use carefully tuned temperatures for specific outcomes:

| Function | Temperature | Rationale |
|----------|------------|-----------|
| Schema generation/refinement | 0.1-0.2 | Deterministic structure |
| SQL/Test/Docs generation | 0.1 | Syntax correctness |
| Sample data | 0.7 | Realistic variety |
| Visualization | 1.0 | Creative chart suggestions |

### Core Data Structures

All TypeScript interfaces are defined in **types.ts**:

- `Schema` → `Table[]` → `Column[]` (with PK/FK relationships)
- `ChatMessage` - Conversational history (role: 'user' | 'model')
- `AppState` - Complete application state
- `AppAction` - Discriminated union of all state mutations
- `SQLDialect` - 'PostgreSQL' | 'MySQL'
- `LayoutTheme` - 'Tabs' | 'Wizard' | 'Grid'

### Component Organization

```
components/
├── Header.tsx           - Navigation and layout theme switcher
├── PromptWorkspace.tsx  - Schema generation chat interface
├── SchemaVisualizer.tsx - Interactive schema editor (click-to-edit)
├── DataVisualizer.tsx   - Chart generation and display
├── ArtifactsPanel.tsx   - SQL/stories/docs/tests export
├── StepIndicator.tsx    - Wizard mode progress indicator
├── ChatInput.tsx          - Reusable chat input with file upload integration
└── Loader.tsx           - Loading spinner
```

### Application Workflow

The app has a linear workflow unlocking stages progressively:

1. **Schema Tab** - Generate initial schema via natural language
2. **Refine Tab** - Edit schema visually (unlocked after generation)
3. **Data Tab** - Generate sample data + visualizations (unlocked after schema exists)
4. **Export Tab** - Generate SQL/stories/docs/tests artifacts (unlocked after schema exists)

Navigation managed via `state.activeTab` and three layout modes (Tabs/Wizard/Grid).

## File Organization Principles

- **Root level**: Entry points (`index.tsx`, `App.tsx`), config files, core state/types
- **components/**: All React UI components (no nested directories)
- **services/**: Service layer (currently only geminiService.ts)
- **No nested structure** - Flat component hierarchy for easy discovery

## Key Implementation Details

### Schema Editing

**SchemaVisualizer.tsx** provides inline editing capabilities:
- Click column type → Edit inline
- Click PK/FK badge → Toggle constraint
- JSON export per-table

### JSON Parsing & Cleaning

AI responses are cleaned via `cleanJsonString()` in geminiService.ts to strip markdown code fences before parsing. This handles LLM responses wrapped in ```json ... ```.

### Vega-Lite Integration

Visualizations use **vega-embed v6** with:
- Google Search grounding for accurate Vega-Lite v5 specs
- Source citations displayed below charts
- AI-generated chart suggestions based on data
- Interactive chart rendering with full Vega-Lite capabilities

### Tailwind CSS Usage

Styling uses **Tailwind CSS v4** with the Vite plugin (`@tailwindcss/vite`):
- Configuration: `tailwind.config.ts`
- Dark mode: `class` strategy (toggle via className)
- Built at compile-time (not CDN)
- Content scanning: `./index.html` and `./**/*.{js,ts,jsx,tsx}`

## Code Style Standards

Follows JSF (JavaScript Framework) inspired conventions adapted for TypeScript:

- **JSDoc documentation required** - ESLint enforces JSDoc on all functions/methods/classes
- **Strict TypeScript** - `no-explicit-any` warned by ESLint
- **Explicit return types** - Required by `@typescript-eslint/explicit-function-return-type`
- **Immutable state updates** - Always use spread syntax in reducer
- **React Hooks rules** - Enforced by `react-hooks/rules-of-hooks` and `exhaustive-deps`
- **No console.log** - Only `console.warn` and `console.error` allowed
- **Defensive programming** with error boundaries
- **Single responsibility principle**

All linting rules are enforced via:
- ESLint config: `eslint.config.js` (flat config format)
- Prettier integration: `eslint-config-prettier`
- Pre-commit hooks: Husky + lint-staged

## Common Modification Patterns

### Adding New State Property

1. Add to `AppState` interface in **types.ts**
2. Add action type to `AppAction` discriminated union
3. Add case to reducer in **store.tsx**
4. Initialize in `initialState` object

### Adding New AI Function

1. Define prompt constant in **constants.ts**
2. Implement function in **services/geminiService.ts** using `ai.models.generateContent()`
3. Set appropriate temperature for use case
4. Handle JSON cleaning/parsing if structured output
5. Update state via dispatch in calling component

### Adding New Artifact Type

Follow the pattern of existing artifacts (SQL, user stories, API docs, test cases):
1. Add state property for artifact
2. Create prompt in constants.ts
3. Add generation function in geminiService.ts
4. Add UI in ArtifactsPanel.tsx with copy/download

## Vite Configuration Notes

**vite.config.ts** includes:
- React plugin for JSX transformation
- Tailwind CSS v4 plugin (`@tailwindcss/vite`)
- Environment variable injection (GEMINI_API_KEY → `process.env.API_KEY` and `process.env.GEMINI_API_KEY`)
- Path alias (`@/*` → root directory)
- Dev server on port 3000, host 0.0.0.0

**vitest.config.ts** for unit testing:
- jsdom environment for React component testing
- Setup file: `tests/setup.ts`
- Coverage: v8 provider with text/json/html reporters
- Path alias matches Vite config

## TypeScript Configuration

**tsconfig.json** settings:
- Target: ES2022
- Decorator support enabled
- JSX: react-jsx (React 19)
- Strict type checking enabled
- Module resolution: bundler

## Security Considerations

- Never commit `.env.local` to version control
- API key validation occurs in geminiService.ts initialization
- File upload limited to .txt, .md, .json (enforced in UI)

## Testing Strategy

### Unit Tests (Vitest + React Testing Library)
- Location: `tests/**/*.{test,spec}.{ts,tsx}`
- Setup: `tests/setup.ts` configures `@testing-library/jest-dom`
- Coverage: V8 provider with text/json/html output
- Run in watch mode during development: `npm test`

Example tests:
- `store.test.ts` - State management reducer logic
- `App.integration.test.tsx` - Component integration tests
- `ErrorBoundary.test.tsx` - Error handling
- `utils.test.ts` - Utility functions

### E2E Tests (Playwright)
- Location: `e2e/**/*.spec.ts`
- Config: `playwright.config.ts`
- Auto-starts dev server on port 3000
- Desktop Chrome only (customizable in config)
- Example: `schema-generation.spec.ts` - Full user workflow

### Writing New Tests
When adding new functionality:
1. Write unit tests for pure functions and utilities
2. Write integration tests for component behavior
3. Add E2E tests for critical user workflows
4. Ensure JSDoc on test functions explains what's being tested

## Dependencies of Note

- **@google/genai**: Official Google Generative AI SDK (not @google-cloud/aiplatform)
- **react**: v19 (latest) with new JSX transform
- **vega-embed**: v6 for Vega-Lite chart rendering
- **react-syntax-highlighter**: Code block display in export panel
- **vite**: Build tool with fast HMR
- **vitest**: Unit testing framework (Vite-native)
- **@playwright/test**: E2E testing framework
- **@testing-library/react**: v16 for React 19 compatibility
- **tailwindcss**: v4 with Vite plugin
- **dompurify**: Sanitization for user-generated content
- **jszip**: ZIP archive generation for exports

## Application State Flow

```
User Input → Component → dispatch(action) → Reducer → New State → Re-render
                ↓
        AI Service Call (geminiService.ts)
                ↓
        Response Processing → dispatch(action)
```

All async operations follow pattern:
1. `dispatch({ type: 'SET_LOADING', payload: true })`
2. Call AI service function
3. `dispatch({ type: 'SET_RESULT', payload: result })`
4. `dispatch({ type: 'SET_LOADING', payload: false })`
5. Handle errors with `dispatch({ type: 'SET_ERROR', payload: errorMsg })`
