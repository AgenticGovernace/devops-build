# Semantic Loop DevOps Demonstrator

**A human-and-agent database schema workspace built with React, TypeScript, WebMCP, and provider-neutral AI.**

## Quick Start

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Run the WebMCP workspace without AI credentials
npm run dev

# Optional: emulate the server-side multi-provider AI function
npx netlify dev
```

View the app at `http://localhost:3000`. No provider key is required to load the app or exercise its core WebMCP project-state tools.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [WebMCP Challenge Extension](#webmcp-challenge-extension)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [Project Structure](#project-structure)
- [Development](#development)
- [Build and Deployment](#build-and-deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Semantic Loop DevOps Demonstrator demonstrates a complete "semantic loop" workflow where natural language drives database design, which drives data generation, visualization, and documentation—all powered by AI.

### What It Does

1. **Conversational Schema Generation**: Describe your database in plain English
2. **Interactive Refinement**: Edit schemas visually with click-to-edit controls
3. **Realistic Sample Data**: AI generates contextually appropriate test data
4. **Data Visualization**: Create charts using Vega-Lite with AI assistance
5. **Artifact Export**: Generate SQL, user stories, API docs, and test cases

---

## Features

### 🤖 Provider-Neutral AI Schema Design

- Natural language generation through Gemini, OpenAI, or Anthropic
- Server-side credentials that never enter the browser bundle
- A persistent provider selector shared by every generation workflow
- Multi-turn conversations with context preservation
- File upload support (.txt, .md, .json) for requirements
- Automatic relationship detection (primary keys, foreign keys)

### 🎨 Interactive Schema Editor

- Visual schema cards showing tables and columns
- Click-to-edit column types with inline editing
- Toggle PK/FK constraints with one click
- Natural language schema modifications
- Per-table JSON export

### 📊 Advanced Data Generation

- Realistic sample data with referential integrity
- Customizable row counts (10, 50, 100, or custom)
- User-defined generation criteria
- ISO 8601 date formatting
- JSON and CSV export options

### 📈 Smart Visualizations

- Vega-Lite v5 integration for professional charts
- Conversational chart creation
- AI-generated chart suggestions
- Interactive chart rendering
- Source citations from web searches

### 📦 Development Artifacts

Generate production-ready documentation:

- **SQL DDL**: CREATE TABLE statements (PostgreSQL/MySQL)
- **User Stories**: Product backlog in Gherkin format
- **API Documentation**: OpenAPI-style REST endpoints
- **Test Cases**: BDD scenarios in Gherkin format

### 🎯 Three Layout Modes

- **Tabs**: Horizontal navigation for linear workflows
- **Wizard**: Step-by-step with progress indicator
- **Grid**: Dashboard view with all sections visible

---

## WebMCP Challenge Extension

Semantic Loop exposes its live schema workspace as browser-native WebMCP tools. A compatible agent can work with domain concepts instead of scraping DOM text or guessing where to click, while the person continues to inspect and edit the result through the visual interface.

| Tool                   | Purpose                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `get_project_state`    | Read the current schema, workflow position, row counts, and artifact flags without exposing chat or upload contents. |
| `create_schema`        | Validate and install a complete schema, clear stale derived outputs, and open the Refine view.                       |
| `apply_schema_changes` | Add/remove tables and upsert/remove named columns with bounded, validated edits.                                     |
| `set_sample_data`      | Validate table and column names, apply bounded primitive sample rows, and open the Data view.                        |
| `export_project`       | Deterministically return SQL and JSON file objects and open the Export view; it never uploads or publishes.          |

The tools are registered with `document.modelContext.registerTool` and operate through the same React state boundary as the UI. Use ChatGPT's in-app browser or Chrome with WebMCP enabled to discover and call them.

Run the focused contract suite with `npm run test:run -- tests/webmcp.test.ts`.

For a judge walkthrough, existing-project disclosure, and the under-three-minute demo script, see [the Devpost submission draft](devpost-submission.md) and [challenge provenance](docs/hackathon/provenance.md).

---

Implementation lives in `webmcp/tools.ts`, with registration mounted from `webmcp/useWebMcpTools.ts`.

## Architecture

### Technology Stack

| Layer                 | Technology                                                   |
| --------------------- | ------------------------------------------------------------ |
| **Frontend**          | React 19, TypeScript                                         |
| **Styling**           | Tailwind CSS (via CDN)                                       |
| **State Management**  | React Context + useReducer (Flux pattern)                    |
| **AI Integration**    | Server-side Gemini, OpenAI, and Anthropic gateway            |
| **AI APIs**           | Gemini GenerateContent, OpenAI Responses, Anthropic Messages |
| **Visualization**     | Vega-Lite v5, Vega-Embed                                     |
| **Build Tool**        | Vite                                                         |
| **Code Highlighting** | React Syntax Highlighter                                     |

### Application Flow

```
Human UI ─┐
          ├→ React state/reducer → visible UI → deterministic export
WebMCP ───┘

Optional provider request → `/api/ai` → normalized response → React state/reducer
```

### Core Modules

- **types.ts**: TypeScript interfaces (Schema, AppState, AppAction)
- **constants.ts**: AI prompts and default values
- **store.tsx**: Global state management (Context + Reducer)
- **services/aiService.ts**: Provider-neutral domain generation functions
- **services/aiProvider.ts**: Browser client for the same-origin AI gateway
- **netlify/functions/ai.mts**: Server-side Gemini/OpenAI/Anthropic adapters
- **webmcp/tools.ts**: WebMCP tool contracts, validation, and execution
- **webmcp/useWebMcpTools.ts**: React lifecycle integration for WebMCP registration
- **components/**: React UI components

---

## Installation

### Prerequisites

- Node.js 20.x or higher
- npm 9.x or higher
- Optional: credentials and model configuration for any providers you enable

### Setup Steps

```bash
# Clone the repository
git clone <repository-url>
cd devops-build

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev

# Or run with the Netlify AI function locally
npx netlify dev
```

---

## Configuration

### Environment Variables

The browser stores only the selected provider. Configure production credentials as protected server-side Netlify environment variables:

```env
# Enable only the providers you intend to use
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash

OPENAI_API_KEY=
OPENAI_MODEL=

ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=

# Optional non-secret initial UI selection
VITE_AI_PROVIDER=gemini
```

`OPENAI_MODEL` and `ANTHROPIC_MODEL` are deliberately operator-supplied; the application does not invent or silently change those choices. The existing Gemini default remains available for backward compatibility. Missing provider configuration produces a safe, actionable error while WebMCP remains usable. **Never commit provider credentials to version control.** The web UI has no API-key fields and never saves keys to local storage.

### Secure local development with macOS Keychain

Do not put development keys in `.env` files. Store them in the operating-system credential vault:

```bash
# macOS prompts for the secret without placing it in shell history or process arguments
npm run secrets:keychain -- set openai
npm run secrets:keychain -- set anthropic
npm run secrets:keychain -- set gemini

# Show only whether each key exists, never its value
npm run secrets:keychain -- list

# Load stored keys into only the local Netlify process
npm run dev:secure

# Explicitly delete a stored key
npm run secrets:keychain -- remove openai
```

The helper uses macOS Keychain and exports keys only into the `netlify dev` process. The browser still calls same-origin `/api/ai`; only the server function adds the selected provider credential to an outbound HTTPS authorization header. Deployed functions cannot read a visitor's OS Keychain, so production keys must remain protected Netlify secrets rather than user-supplied browser keys.

### Vite Configuration

Pre-configured in `vite.config.ts`:

- React plugin for JSX
- No provider-secret injection into the browser bundle
- Development server on port 3000
- Path alias (`@` → root directory)

### TypeScript Configuration

Pre-configured in `tsconfig.json`:

- ES2022 target
- Strict type checking
- React JSX transformation
- Decorator support

---

## Usage Guide

### 1. Generate Schema

**Navigate to Schema Tab**:

- Describe your database requirements in the chat
- Example: "Create a blog with users, posts, and comments"
- (Optional) Upload context files
- Click "Generate Schema"

### 2. Refine Schema

**Navigate to Refine Tab** (unlocked after generation):

- **Click column types** to edit inline
- **Toggle PK/FK badges** to modify constraints
- **Use natural language** for complex changes
  - Example: "Add a 'created_at' timestamp to all tables"
- **Export tables** individually as JSON

### 3. Generate Sample Data

**Navigate to Data Tab**:

- Set row count (10, 50, 100, or custom)
- Provide criteria: "Include diverse demographics"
- Click "Generate Data"
- AI creates realistic data with referential integrity

### 4. Visualize Data

**After data generation**:

- Type chart requests: "Bar chart of posts per user"
- Or click AI-generated suggestions
- Iterate through conversation
- Export: Vega-Lite JSON or CSV

### 5. Export Artifacts

**Navigate to Export Tab**:

- Select SQL dialect (PostgreSQL/MySQL)
- Generate: SQL, User Stories, API Docs, Test Cases
- Copy to clipboard or download each artifact

---

## Project Structure

```
devops-build/
├── README.md                   # Comprehensive documentation
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite build configuration
├── index.html                  # Entry HTML with import maps
├── index.tsx                   # Application entry point
├── App.tsx                     # Main component with layouts
├── store.tsx                   # Global state management
├── types.ts                    # Type definitions
├── constants.ts                # AI prompts and defaults
├── components/                 # React UI components
│   ├── Header.tsx              # Navigation header
│   ├── PromptWorkspace.tsx     # Schema generation UI
│   ├── SchemaVisualizer.tsx    # Interactive schema editor
│   ├── DataVisualizer.tsx      # Chart generation UI
│   ├── ArtifactsPanel.tsx      # Artifact export UI
│   ├── StepIndicator.tsx       # Wizard progress
│   └── Loader.tsx              # Loading spinner
├── services/                   # Provider-neutral browser service layer
│   ├── aiService.ts            # Public domain generation API
│   └── aiProvider.ts           # Same-origin gateway client
└── netlify/functions/
    └── ai.mts                  # Server-side provider adapters
```

### Key Files

| File                       | Purpose                                                 |
| -------------------------- | ------------------------------------------------------- |
| `types.ts`                 | All TypeScript interfaces                               |
| `constants.ts`             | AI prompts and configuration                            |
| `store.tsx`                | State management (Context + Reducer)                    |
| `services/aiService.ts`    | Provider-neutral generation functions                   |
| `services/aiProvider.ts`   | Browser-to-function request contract                    |
| `netlify/functions/ai.mts` | Secret-safe provider routing and response normalization |
| `App.tsx`                  | Layout modes and routing                                |

---

## Development

### Code Style

Follows JSF-inspired standards adapted for TypeScript:

- Comprehensive JSDoc documentation
- Strict TypeScript (no `any`)
- Immutable state updates
- Defensive programming
- Single responsibility principle

### State Management

Uses **Flux architecture**:

```typescript
// Dispatch action
dispatch({ type: 'SET_SCHEMA', payload: newSchema });

// Reducer processes
const newState = { ...state, schema: newSchema };

// Components react
const { state } = useAppStore();
```

### Adding Features

**1. Add State Property** (types.ts + store.tsx):

```typescript
// types.ts
export interface AppState {
  newFeature: string | null;
}

export type AppAction =
  | { type: 'SET_NEW_FEATURE'; payload: string | null };

// store.tsx reducer
case 'SET_NEW_FEATURE': return { ...state, newFeature: action.payload };
```

**2. Add AI Function** (`services/aiService.ts`):

```typescript
export const generateNewFeature = async (schema: Schema, provider: AIProvider): Promise<string> => {
  const response = await requestAI({ provider, prompt, temperature: 0.5 });
  return response.text;
};
```

---

## Build and Deployment

### Production Build

```bash
npm run build
```

Creates optimized build in `dist/`:

- Minified bundles
- Asset hashing
- Source maps

### Netlify deployment

The committed `netlify.toml` uses `npm run build`, publishes `dist`, and provides the SPA fallback required for direct routes. Start with a preview deployment:

```bash
npx netlify status
npx netlify deploy
```

After testing the preview in a WebMCP-enabled client, publish the same build to the production URL:

```bash
npx netlify deploy --prod
```

No secret is required for the core WebMCP flow. Configure only the provider keys and model identifiers you intend to enable in Netlify's environment-variable settings. The function reads them through `Netlify.env`; they are never compiled into Vite assets or committed to the repository.

### Other hosting

Any static host that builds with `npm run build`, publishes `dist`, and serves `index.html` as the SPA fallback can host the core application. Optional AI generation additionally requires an equivalent same-origin `/api/ai` server endpoint.

**Docker**:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Troubleshooting

### Common Issues

#### Provider Configuration Errors

**Error**: `<provider> is not configured for this deployment.`

**Solution**:

- The core WebMCP workflow does not require a key.
- Configure the selected provider's API key in Netlify.
- Configure `OPENAI_MODEL` or `ANTHROPIC_MODEL` when enabling those providers, then run `npx netlify dev` locally.

#### Schema Generation Fails

**Error**: `Could not parse the generated schema`

**Solutions**:

- Provide more detailed requirements
- Include example data structures
- Upload context files

#### Visualization Not Rendering

**Solutions**:

- Check browser console for Vega-Lite errors
- Verify sample data was generated
- Try simpler chart types first

#### Build Errors

**Solutions**:

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm run install:dev

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

---

## Documentation

All modules are comprehensively documented with JSDoc comments:

- **types.ts**: Interface and type definitions
- **constants.ts**: Configuration and AI prompts
- **store.tsx**: State management functions
- **aiService.ts**: Provider-neutral domain generation functions
- **aiProvider.ts**: Browser gateway client
- **netlify/functions/ai.mts**: Server-only provider adapters
- **Components**: React component props and behavior

### AI Temperature Settings

| Function          | Temperature | Purpose                 |
| ----------------- | ----------- | ----------------------- |
| Schema Generation | 0.2         | Deterministic structure |
| Schema Refinement | 0.1         | Precise modifications   |
| SQL Generation    | 0.1         | Syntax correctness      |
| Sample Data       | 0.7         | Realistic variety       |
| Visualization     | 1.0         | Maximum creativity      |

---

## Contributing

1. Follow existing code style
2. Add JSDoc documentation
3. Maintain type safety
4. Test thoroughly

---

## License

Licensed under the [Apache License 2.0](LICENSE).

---

## Acknowledgments

- Google Gemini API, OpenAI Responses API, and Anthropic Messages API
- Vega-Lite visualization grammar
- React and Vite teams
- Tailwind CSS

---

**Built with React, TypeScript, WebMCP, and provider-neutral AI**
