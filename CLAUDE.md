# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DevOps Build is an interactive React application demonstrating "Semantic Loop DevOps" workflow. It uses Google's Gemini API to generate database schemas from natural language prompts, allows visual refinement, generates sample data, creates visualizations, and exports development artifacts (SQL, user stories, API docs, test cases).

## Development Commands

### Setup
```bash
npm install
```

### Environment Configuration
Set `GEMINI_API_KEY` in `.env.local` to your Gemini API key before running the app.

### Development Server
```bash
npm run dev
```
Runs on `http://localhost:3000` (configured in vite.config.ts)

### Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Architecture

### State Management
The app uses React Context + useReducer pattern for global state management:
- **store.tsx**: Defines `AppState`, `AppAction`, and `appReducer`
- **State Provider**: `AppProvider` wraps the entire app (App.tsx:266)
- **Hook**: `useAppStore()` provides access to `state` and `dispatch`

All state updates are performed through dispatched actions (e.g., `dispatch({ type: 'SET_SCHEMA', payload: schema })`).

### Core State Flow
1. **Schema Generation**: User describes schema → `generateSchema()` called → schema stored in state
2. **Schema Refinement**: User edits schema visually or via prompts → `refineSchema()` called → schema updated
3. **Sample Data**: User generates data based on schema → `generateSampleData()` called → data stored
4. **Visualization**: Data visualized using Vega-Lite specs → `generateVisualization()` generates chart specs
5. **Artifacts Export**: Schema exported as SQL, user stories, API docs, or test cases

### Key Services (services/geminiService.ts)
All Gemini API interactions are centralized here:
- `generateSchema()`: Creates schema from chat history and uploaded files
- `refineSchema()`: Updates existing schema based on user prompts
- `generateSql()`: Converts schema to SQL CREATE statements (supports PostgreSQL/MySQL)
- `generateUserStories()`: Creates user stories from schema
- `generateApiDocs()`: Generates API documentation
- `generateTestCases()`: Creates Gherkin test cases
- `generateSampleData()`: Generates realistic sample data respecting foreign key relationships
- `generateVisualization()`: Creates Vega-Lite chart specs with grounding search
- `generateChartSuggestions()`: Suggests relevant visualizations

**Important**: All services use `gemini-2.5-flash` model. Response parsing uses `cleanJsonString()` to strip markdown code fences.

### Layout Themes
The app supports three layout modes (controlled via `layoutTheme` state):
- **Tabs**: Traditional tabbed interface (default)
- **Wizard**: Step-by-step guided workflow with back/next navigation
- **Grid**: 2x2 panel layout showing all steps simultaneously

Toggle between layouts in Header component.

### Type System (types.ts)
Core interfaces:
- `Schema`: Contains `tables` array and optional description
- `Table`: Has `name`, `description`, and `columns` array
- `Column`: Includes `name`, `type`, `description`, and foreign key relationships
- `AppState`: Complete application state including schema, chat history, generated artifacts
- `AppAction`: Union type of all possible reducer actions

### Environment Variables
Vite configuration (vite.config.ts:14-15) exposes `GEMINI_API_KEY` as both:
- `process.env.API_KEY`
- `process.env.GEMINI_API_KEY`

The service uses `process.env.API_KEY` (geminiService.ts:7).

### Components Structure
- **App.tsx**: Main component with three layout renderers and tab management
- **PromptWorkspace.tsx**: Chat interface with file upload (supports .txt, .md, .json)
- **SchemaVisualizer.tsx**: Visual schema editor with inline editing capabilities
- **DataVisualizer.tsx**: Vega-Lite chart renderer with conversational refinement
- **ArtifactsPanel.tsx**: Exports SQL, user stories, API docs, test cases
- **Header.tsx**: App header with layout theme switcher
- **FeedbackLoop.tsx**: Refinement chat interface for schema modifications

### Constants & Prompts (constants.ts)
Contains all Gemini API system prompts:
- Schema generation/refinement prompts with TypeScript interface definitions
- Artifact generation prompts (SQL, user stories, API docs, tests)
- Data generation and visualization prompts with specific formatting requirements
- Initial chat history and defaults

**Critical Detail**: All prompts include explicit JSON formatting requirements and schema interfaces to ensure consistent responses.

## Common Patterns

### Making API Calls
```typescript
dispatch({ type: 'SET_LOADING', payload: true });
dispatch({ type: 'SET_ERROR', payload: null });

try {
  const result = await geminiServiceFunction(params);
  dispatch({ type: 'SET_RESULT', payload: result });
} catch (e) {
  const error = e instanceof Error ? e.message : 'Unknown error';
  dispatch({ type: 'SET_ERROR', payload: `Failed: ${error}` });
} finally {
  dispatch({ type: 'SET_LOADING', payload: false });
}
```

### Adding New Artifacts
1. Add state property to `AppState` in types.ts
2. Add action type to `AppAction` union in types.ts
3. Add reducer case in store.tsx
4. Create generation prompt in constants.ts
5. Create service function in geminiService.ts
6. Add UI in ArtifactsPanel.tsx or new component

### Path Aliasing
The project uses `@/` alias pointing to root directory (tsconfig.json:21-24, vite.config.ts:18-20).
Example: `import { schema } from '@/types'`

## API Integration

### Gemini API Usage
- Model: `gemini-2.5-flash`
- Response format: JSON with `responseMimeType: "application/json"` for structured outputs
- Temperature varies by use case (0.1-1.0)
- Visualization uses Google Search grounding tool for up-to-date Vega-Lite syntax

### Error Handling
- JSON parsing failures log the raw response and throw descriptive errors
- All API errors are caught and displayed via the global `error` state
- User-facing error messages include context (e.g., "Failed to generate schema: ...")

## Special Considerations

### Data Type Handling
When generating sample data, all date/time types must be ISO 8601 strings (SAMPLE_DATA_PROMPT:165).

### Vega-Lite Integration
- Charts use Vega-Lite v5
- Data is embedded directly in specs using `values` property
- Visualization prompt explicitly requires using search to ensure valid modern syntax (VISUALIZATION_PROMPT:173)

### Foreign Key Consistency
Sample data generation must maintain referential integrity across tables.

### File Upload Limitations
Only .txt, .md, and .json files are supported for context (PromptWorkspace.tsx:25).
