/**
 * @fileoverview Global state management using React Context and useReducer pattern.
 *
 * This module provides centralized application state and state mutation functions
 * using the Flux architecture pattern. All components access global state through
 * the useAppStore hook, ensuring unidirectional data flow.
 *
 * @module store
 * @category State Management
 */

import React, { createContext, useContext, useReducer, useEffect, Dispatch } from 'react';
import { AppState, AppAction, LoadingState, LoadingOperation } from './types';
import {
  INITIAL_CHAT_HISTORY,
  DEFAULT_SAMPLE_DATA_PROMPT,
  DEFAULT_SAMPLE_DATA_ROW_COUNT,
} from './constants';
import { saveState, loadState, clearState } from './utils/storage';

/**
 * Default application state values.
 *
 * Sets up the starting conditions for:
 * - Empty or example chat history
 * - No generated artifacts
 * - Default sample data configuration
 * - Default UI settings (Tab layout, PostgreSQL dialect)
 *
 * @constant {AppState}
 */
const defaultState: AppState = {
  toasts: [],
  chatHistory: INITIAL_CHAT_HISTORY,
  uploadedFiles: [],
  schema: null,
  schemaHistory: [],
  currentSchemaIndex: -1,
  generatedSql: null,
  generatedUserStories: null,
  generatedApiDocs: null,
  generatedTestCases: null,
  loadingStates: {},
  error: null,
  sampleDataPrompt: DEFAULT_SAMPLE_DATA_PROMPT,
  sampleDataRowCount: DEFAULT_SAMPLE_DATA_ROW_COUNT,
  generatedSampleData: null,
  visualizationChatHistory: [],
  visualizationSpec: null,
  sqlDialect: 'PostgreSQL',
  visualizationSources: null,
  chartSuggestions: null,
  activeTab: 'Schema',
  layoutTheme: 'Tabs',
  theme: 'dark',
};

/**
 * Creates initial state by merging default state with persisted state.
 *
 * @function getInitialState
 * @returns {AppState} The initial application state.
 */
const getInitialState = (): AppState => {
  const persisted = loadState();
  if (persisted) {
    const history = persisted.schema ? [persisted.schema] : [];
    return {
      ...defaultState,
      ...persisted,
      schemaHistory: history,
      currentSchemaIndex: history.length - 1,
      // Always start with schema tab if schema exists, otherwise go to appropriate tab
      activeTab: persisted.schema ? 'Refine' : 'Schema',
    };
  }
  // If no persisted state, check for user's system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return { ...defaultState, theme: 'dark' };
  }
  return { ...defaultState, theme: 'light' };
};

const initialState: AppState = getInitialState();

/**
 * Checks if a specific operation is currently loading.
 *
 * @function isOperationLoading
 * @param {LoadingState} loadingStates - The current loading states object.
 * @param {LoadingOperation} operation - The operation to check.
 * @returns {boolean} True if the operation is loading.
 */
export const isOperationLoading = (
  loadingStates: LoadingState,
  operation: LoadingOperation
): boolean => {
  return loadingStates[operation] === true;
};

/**
 * Checks if any operation is currently loading.
 *
 * @function isAnyLoading
 * @param {LoadingState} loadingStates - The current loading states object.
 * @returns {boolean} True if any operation is loading.
 */
export const isAnyLoading = (loadingStates: LoadingState): boolean => {
  return Object.values(loadingStates).some(v => v === true);
};

/**
 * Pure reducer function for application state mutations.
 *
 * Implements the Flux Standard Action pattern with discriminated union types.
 * Each action type triggers a specific state transformation while maintaining immutability.
 *
 * @function appReducer
 * @param {AppState} state - The current application state (never mutated directly).
 * @param {AppAction} action - The action describing the state mutation to perform.
 * @returns {AppState} A new state object with the requested changes applied.
 *
 * @example
 * // Set loading state for schema operation
 * const newState = appReducer(currentState, { type: 'SET_LOADING_STATE', payload: { operation: 'schema', isLoading: true } });
 *
 * @example
 * // Update schema and preserve other state
 * const newState = appReducer(currentState, { type: 'SET_SCHEMA', payload: schemaObject });
 *
 * @invariant All state updates must return a new object using spread syntax to maintain immutability.
 */
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, { ...action.payload, id: crypto.randomUUID() }],
      };
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter(t => t.id !== action.payload),
      };
    case 'LOAD_PROJECT': {
      const { payload } = action;
      const newSchemaHistory = payload.schema ? [payload.schema] : [];
      return {
        ...defaultState, // Start from a clean state
        toasts: [], // Also clear toasts
        layoutTheme: state.layoutTheme, // Persist user's layout theme
        theme: state.theme, // Persist user's theme
        chatHistory: payload.chatHistory,
        uploadedFiles: payload.uploadedFiles,
        schema: payload.schema,
        sampleDataPrompt: payload.sampleDataPrompt,
        sampleDataRowCount: payload.sampleDataRowCount,
        generatedSampleData: payload.generatedSampleData,
        visualizationChatHistory: payload.visualizationChatHistory,
        sqlDialect: payload.sqlDialect,
        schemaHistory: newSchemaHistory,
        currentSchemaIndex: newSchemaHistory.length - 1,
        activeTab: payload.schema ? 'Refine' : 'Schema',
      };
    }
    case 'SET_LOADING_STATE':
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [action.payload.operation]: action.payload.isLoading,
        },
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_CHAT_HISTORY':
      return { ...state, chatHistory: action.payload };
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatHistory: [...state.chatHistory, action.payload] };
    case 'SET_UPLOADED_FILES':
      return { ...state, uploadedFiles: action.payload };
    case 'SET_SCHEMA': {
      const newSchema = action.payload;
      if (newSchema) {
        const newHistory = [
          ...state.schemaHistory.slice(0, state.currentSchemaIndex + 1),
          newSchema,
        ];
        return {
          ...state,
          schema: newSchema,
          schemaHistory: newHistory,
          currentSchemaIndex: newHistory.length - 1,
        };
      }
      return { ...state, schema: null, schemaHistory: [], currentSchemaIndex: -1 };
    }
    case 'UNDO_SCHEMA_CHANGE': {
      if (state.currentSchemaIndex > 0) {
        const newIndex = state.currentSchemaIndex - 1;
        return {
          ...state,
          schema: state.schemaHistory[newIndex],
          currentSchemaIndex: newIndex,
        };
      }
      return state;
    }
    case 'REDO_SCHEMA_CHANGE': {
      if (state.currentSchemaIndex < state.schemaHistory.length - 1) {
        const newIndex = state.currentSchemaIndex + 1;
        return {
          ...state,
          schema: state.schemaHistory[newIndex],
          currentSchemaIndex: newIndex,
        };
      }
      return state;
    }
    case 'SET_GENERATED_SQL':
      return { ...state, generatedSql: action.payload };
    case 'SET_GENERATED_STORIES':
      return { ...state, generatedUserStories: action.payload };
    case 'SET_GENERATED_DOCS':
      return { ...state, generatedApiDocs: action.payload };
    case 'SET_GENERATED_TESTS':
      return { ...state, generatedTestCases: action.payload };
    case 'SET_SAMPLE_DATA_PROMPT':
      return { ...state, sampleDataPrompt: action.payload };
    case 'SET_SAMPLE_DATA_ROW_COUNT':
      return { ...state, sampleDataRowCount: action.payload };
    case 'SET_GENERATED_SAMPLE_DATA':
      return { ...state, generatedSampleData: action.payload };
    case 'SET_VISUALIZATION_CHAT_HISTORY':
      return { ...state, visualizationChatHistory: action.payload };
    case 'SET_VISUALIZATION_SPEC':
      return { ...state, visualizationSpec: action.payload };
    case 'SET_VISUALization_SOURCES':
      return { ...state, visualizationSources: action.payload };
    case 'SET_CHART_SUGGESTIONS':
      return { ...state, chartSuggestions: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_LAYOUT_THEME':
      return { ...state, layoutTheme: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_SQL_DIALECT':
      return { ...state, sqlDialect: action.payload };
    case 'RESET_APP':
      clearState(); // Clear persisted state on reset
      return {
        ...defaultState,
        layoutTheme: state.layoutTheme,
        theme: state.theme,
        schemaHistory: [],
        currentSchemaIndex: -1,
      };
    default:
      return state;
  }
};

/**
 * React Context providing global state and dispatch function to component tree.
 *
 * Initialized as undefined to enable runtime checks that components are properly
 * wrapped in AppProvider. Provides both the current state and the dispatch function.
 *
 * @constant {React.Context}
 * @private
 */
const AppContext = createContext<{ state: AppState; dispatch: Dispatch<AppAction> } | undefined>(
  undefined
);

/**
 * Provider component wrapping the application to supply global state.
 *
 * Must wrap the entire React component tree (or relevant subtree) to enable
 * child components to access global state via the useAppStore hook.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components that will have access to global state.
 * @returns {JSX.Element} Provider component with state management initialized.
 *
 * @example
 * ```tsx
 * <AppProvider>
 *   <App />
 * </AppProvider>
 * ```
 */
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }): JSX.Element => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Persist state to localStorage on changes
  useEffect(() => {
    // Debounce saves to avoid excessive writes
    const timeoutId = setTimeout(() => {
      saveState(state);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [state]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
};

/**
 * Custom React hook for accessing global application state and dispatch function.
 *
 * This hook provides a type-safe way to access the centralized state store from
 * any component within the AppProvider tree. It includes runtime validation to
 * ensure proper usage within a provider boundary.
 *
 * @function useAppStore
 * @returns {{state: AppState, dispatch: Dispatch<AppAction>}} Object containing current state and dispatch function.
 * @throws {Error} If called outside of an AppProvider context.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { state, dispatch } = useAppStore();
 *
 *   // Access state
 *   const schema = state.schema;
 *
 *   // Dispatch actions
 *   dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'schema', isLoading: true } });
 *
 *   return <div>{schema?.description}</div>;
 * }
 * ```
 */
export const useAppStore = (): { state: AppState; dispatch: Dispatch<AppAction> } => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
};
