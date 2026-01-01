# GEMINI.md

This document provides a comprehensive overview of the `devops-build` project, its architecture, and development practices.

## Project Overview

`devops-build` is a web-based tool for generating database schemas, sample data, and related artifacts using the Gemini API. It provides a user-friendly interface with a step-by-step workflow to guide users through the process of schema creation, refinement, data generation, and artifact export.

The application is built as a single-page application (SPA) using the following technologies:

*   **Frontend:** React, TypeScript, and Tailwind CSS
*   **Build Tool:** Vite
*   **Testing:** Vitest for unit tests and Playwright for end-to-end tests
*   **State Management:** React Context and `useReducer` hook
*   **API Interaction:** `geminiService` for communicating with the Gemini API

## Building and Running

### Prerequisites

*   Node.js and npm (or a compatible package manager)
*   A Gemini API key

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the root of the project and add your Gemini API key:
    ```
    GEMINI_API_KEY=<your-api-key>
    ```

### Running the Application

*   To start the development server:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

*   To build the application for production:
    ```bash
    npm run build
    ```

*   To preview the production build:
    ```bash
    npm run preview
    ```

### Testing

*   To run unit tests:
    ```bash
    npm run test
    ```
    or
    ```bash
    npm run test:run
    ```

*   To run unit tests with coverage:
    ```bash
    npm run test:coverage
    ```

*   To run end-to-end tests:
    ```bash
    npm run test:e2e
    ```

## Development Conventions

### Code Style

The project uses ESLint and Prettier to enforce a consistent code style. It is recommended to install the ESLint and Prettier extensions for your code editor to get real-time feedback.

*   To check for linting errors:
    ```bash
    npm run lint
    ```

*   To automatically fix linting errors:
    ```bash
    npm run lint:fix
    ```

*   To format the code:
    ```bash
    npm run format
    ```

*   To check for formatting issues:
    ```bash
    npm run format:check
    ```

### State Management

The application uses a global state management solution based on React's `useReducer` and `useContext` hooks. The entire application state is stored in a single object, and all state mutations are handled by a reducer function.

*   The state is defined in `store.tsx`.
*   The `useAppStore` hook provides access to the state and the `dispatch` function.
*   The application state is persisted to `localStorage` to provide a seamless user experience between sessions.

### Component Structure

The UI is built with React components, which are located in the `components` directory. The main application component is `App.tsx`, which orchestrates the UI and the application's workflow.

### API Interaction

All communication with the Gemini API is handled by the `geminiService.ts` module. This service provides functions for generating schemas, sample data, and other artifacts.
