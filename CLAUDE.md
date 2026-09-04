# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DevOps Build is an interactive React application demonstrating a "Semantic Loop DevOps" workflow. It can use Gemini, OpenAI, or Anthropic to generate database schemas from natural-language prompts, supports visual refinement and sample-data generation, creates visualizations, and exports development artifacts (SQL, user stories, API docs, and test cases).

## Development Commands

### Setup

```bash
npm install --legacy-peer-deps
```

### Development Server

```bash
npm run dev
```

The Vite-only UI runs at `http://localhost:3000`. To exercise AI features through the local Netlify Function gateway, run:

```bash
npx netlify dev
```

The local UI and WebMCP tools do not require a provider API key.

For local AI development on macOS, store keys using `npm run secrets:keychain -- set <provider>` and start with `npm run dev:secure`. The helper reads macOS Keychain directly into the Netlify development process. Use `npm run secrets:keychain -- remove <provider>` to delete a stored key. Do not create plaintext `.env` files.

### Build and validation

```bash
npm run validate
npm run build
npm run preview
```

## Architecture

### State Management

The app uses React Context and `useReducer` for global state management:

- `store.tsx` defines the initial state and reducer.
- `types.ts` defines `AppState` and `AppAction`.
- `useAppStore()` exposes state and dispatch.
- `aiProvider` stores only the selected provider name, never credentials.

All updates use dispatched actions, such as `dispatch({ type: 'SET_SCHEMA', payload: schema })`.

### Core State Flow

1. User input calls `generateSchema()` and stores a schema.
2. Visual or conversational edits call `refineSchema()`.
3. `generateSampleData()` creates related example rows.
4. `generateVisualization()` creates Vega-Lite chart specifications.
5. Artifact functions produce SQL, user stories, API docs, and tests.

### Key AI Services

- `services/aiService.ts`: stable application-facing generation API.
- `services/aiProvider.ts`: provider-neutral same-origin browser client.
- `services/geminiService.ts`: legacy-named prompt/response layer retained for compatibility.
- `netlify/functions/ai.mts`: server-side Gemini, OpenAI, and Anthropic adapters.

The generation API includes `generateSchema`, `refineSchema`, `generateSql`, `generateUserStories`, `generateApiDocs`, `generateTestCases`, `generateSampleData`, `generateVisualization`, and `generateChartSuggestions`.

The browser sends normalized requests to `/api/ai`. The function calls Gemini GenerateContent, OpenAI Responses, or Anthropic Messages and returns `{ provider, model, text, sources? }`. JSON responses are normalized by the service layer, including removal of markdown fences.

### Provider Configuration

The Netlify Function reads credentials only from `Netlify.env`:

- `GEMINI_API_KEY`; optional `GEMINI_MODEL` (defaults to `gemini-2.5-flash`).
- `OPENAI_API_KEY` and operator-supplied `OPENAI_MODEL`.
- `ANTHROPIC_API_KEY` and operator-supplied `ANTHROPIC_MODEL`.

`VITE_AI_PROVIDER` may set the initial selector value and is not secret. Never expose API keys through Vite variables, React state, local storage, generated artifacts, or client-visible errors.

Production functions use protected Netlify secrets. A deployed browser cannot access a visitor's OS credential vault, so never add a browser key-entry or bring-your-own-key form.

### Layout Themes

The Header switches between Tabs, Wizard, and Grid layouts. The Header also owns the provider selector. Disable provider changes while a generation request is active.

### Components

- `App.tsx`: main layouts and tab management.
- `PromptWorkspace.tsx`: chat and context-file uploads (`.txt`, `.md`, `.json`).
- `SchemaVisualizer.tsx`: visual schema editor.
- `DataVisualizer.tsx`: Vega-Lite renderer and conversational refinement.
- `ArtifactsPanel.tsx`: generated artifacts and exports.
- `Header.tsx`: layout and AI-provider controls.
- `FeedbackLoop.tsx`: schema-refinement chat.

### Prompts

`constants.ts` contains provider-neutral prompts for schema generation and refinement, artifacts, sample data, and visualization. Structured tasks include explicit JSON formats and interface shapes; preserve those contracts when changing prompts.

## Common Patterns

### Making AI Calls

```typescript
dispatch({ type: 'SET_LOADING', payload: true });
dispatch({ type: 'SET_ERROR', payload: null });

try {
  const result = await aiServiceFunction(params, state.aiProvider);
  dispatch({ type: 'SET_RESULT', payload: result });
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  dispatch({ type: 'SET_ERROR', payload: `Failed: ${message}` });
} finally {
  dispatch({ type: 'SET_LOADING', payload: false });
}
```

### Adding New Artifacts

1. Add the state property and action type in `types.ts`.
2. Add the reducer case in `store.tsx`.
3. Add the generation prompt in `constants.ts`.
4. Create or update the function exposed by `services/aiService.ts`.
5. Pass `state.aiProvider` from the UI call site.
6. Add unit and integration coverage.

### Path Aliasing

The `@/` alias points to the repository root. Example: `import type { Schema } from '@/types'`.

## Error and Data Handling

- Provider failures are normalized; upstream response bodies and secrets must not reach the browser.
- JSON parsing failures should throw descriptive, task-specific errors.
- Sample-data dates and times must be ISO 8601 strings.
- Sample data must preserve foreign-key relationships.
- Vega-Lite output targets v5 and embeds data using the `values` property.
- Provider citations are optional and should be displayed only when returned.

## WebMCP

The `webmcp/` layer exposes safe, in-page tools without provider credentials. Keep destructive-looking actions in preview mode until the user explicitly applies them through the UI, and preserve the existing structured tool contracts and tests.
