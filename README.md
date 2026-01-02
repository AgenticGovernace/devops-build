# Semantic Loop DevOps Demonstrator

**An AI-powered database schema design and development artifacts generator built with React, TypeScript, and Google's Gemini AI.**
## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set your Gemini API key in .env.local
echo "GEMINI_API_KEY=your_api_key_here" > .env.local

# 3. Run the development server
npm run dev
```

View your app at `http://localhost:3000`

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
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

### 🤖 AI-Powered Schema Design
- Natural language database schema generation using Google Gemini AI
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
- Google Search grounding for accurate specifications
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

## Architecture

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript |
| **Styling** | Tailwind CSS (via CDN) |
| **State Management** | React Context + useReducer (Flux pattern) |
| **AI Integration** | Google Gemini AI (gemini-2.5-flash) |
| **Visualization** | Vega-Lite v5, Vega-Embed |
| **Build Tool** | Vite |
| **Code Highlighting** | React Syntax Highlighter |

### Application Flow

```
User Input → State Dispatch → AI Service → Response Processing → State Update → UI Render
```

### Core Modules

- **types.ts**: TypeScript interfaces (Schema, AppState, AppAction)
- **constants.ts**: AI prompts and default values
- **store.tsx**: Global state management (Context + Reducer)
- **services/geminiService.ts**: All AI API interactions
- **components/**: React UI components

---

## Installation

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Setup Steps

```bash
# Clone the repository
git clone <repository-url>
cd devops-build

# Install dependencies
npm install

# Create environment file
cat > .env.local <<EOF
GEMINI_API_KEY=your_api_key_here
EOF

# Start development server
npm run dev
```

---

## Configuration

### Environment Variables

Create `.env.local` in the project root:

```env
# Required: Google Gemini API Key
GEMINI_API_KEY=your_api_key_here
```

**Security**: Never commit `.env.local` to version control.

### Vite Configuration

Pre-configured in `vite.config.ts`:
- React plugin for JSX
- Environment variable injection
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
└── services/                   # Service layer
    └── geminiService.ts        # Gemini AI integration
```

### Key Files

| File | Purpose |
|------|---------|
| `types.ts` | All TypeScript interfaces |
| `constants.ts` | AI prompts and configuration |
| `store.tsx` | State management (Context + Reducer) |
| `geminiService.ts` | All AI API interactions |
| `App.tsx` | Layout modes and routing |

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

**2. Add AI Function** (geminiService.ts):
```typescript
export const generateNewFeature = async (schema: Schema): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { temperature: 0.5 }
  });
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

### Deployment Options

**Vercel** (Recommended):
```bash
npm install -g vercel
vercel
```

**Netlify**:
```bash
npm install -g netlify-cli
netlify deploy --prod
```

**Docker**:
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
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

#### API Key Errors
**Error**: `API_KEY environment variable not set`

**Solution**:
- Verify `.env.local` exists with `GEMINI_API_KEY=your_key`
- Restart dev server after adding key

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
npm install

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
- **geminiService.ts**: AI integration functions
- **Components**: React component props and behavior

### AI Temperature Settings

| Function | Temperature | Purpose |
|----------|------------|---------|
| Schema Generation | 0.2 | Deterministic structure |
| Schema Refinement | 0.1 | Precise modifications |
| SQL Generation | 0.1 | Syntax correctness |
| Sample Data | 0.7 | Realistic variety |
| Visualization | 1.0 | Maximum creativity |

---

## Contributing

1. Follow existing code style
2. Add JSDoc documentation
3. Maintain type safety
4. Test thoroughly

---

## License

[Insert License Information]

---

## Acknowledgments

- Google Gemini AI
- Vega-Lite visualization grammar
- React and Vite teams
- Tailwind CSS

---

**Built with React, TypeScript, and Google Gemini AI**
