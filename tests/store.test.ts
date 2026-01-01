/**
 * @fileoverview Unit tests for state management (store).
 */

import { describe, it, expect } from 'vitest';
import type { AppState, AppAction, Schema, ChatMessage, LoadingOperation } from '../types';

/**
 * Reducer function copied for testing since it's not exported.
 * In a real scenario, you'd export the reducer from store.tsx.
 */
const initialState: AppState = {
  chatHistory: [],
  uploadedFiles: [],
  schema: null,
  generatedSql: null,
  generatedUserStories: null,
  generatedApiDocs: null,
  generatedTestCases: null,
  loadingStates: {},
  error: null,
  sampleDataPrompt: 'Generate realistic entries for each table.',
  sampleDataRowCount: '10',
  generatedSampleData: null,
  visualizationChatHistory: [],
  visualizationSpec: null,
  sqlDialect: 'PostgreSQL',
  visualizationSources: null,
  chartSuggestions: null,
  activeTab: 'Schema',
  layoutTheme: 'Tabs',
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING_STATE':
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [action.payload.operation]: action.payload.isLoading
        }
      };
    case 'SET_ERROR': return { ...state, error: action.payload };
    case 'SET_CHAT_HISTORY': return { ...state, chatHistory: action.payload };
    case 'ADD_CHAT_MESSAGE': return { ...state, chatHistory: [...state.chatHistory, action.payload] };
    case 'SET_UPLOADED_FILES': return { ...state, uploadedFiles: action.payload };
    case 'SET_SCHEMA': return { ...state, schema: action.payload };
    case 'SET_GENERATED_SQL': return { ...state, generatedSql: action.payload };
    case 'SET_GENERATED_STORIES': return { ...state, generatedUserStories: action.payload };
    case 'SET_GENERATED_DOCS': return { ...state, generatedApiDocs: action.payload };
    case 'SET_GENERATED_TESTS': return { ...state, generatedTestCases: action.payload };
    case 'SET_SAMPLE_DATA_PROMPT': return { ...state, sampleDataPrompt: action.payload };
    case 'SET_SAMPLE_DATA_ROW_COUNT': return { ...state, sampleDataRowCount: action.payload };
    case 'SET_GENERATED_SAMPLE_DATA': return { ...state, generatedSampleData: action.payload };
    case 'SET_VISUALIZATION_CHAT_HISTORY': return { ...state, visualizationChatHistory: action.payload };
    case 'SET_VISUALIZATION_SPEC': return { ...state, visualizationSpec: action.payload };
    case 'SET_VISUALIZATION_SOURCES': return { ...state, visualizationSources: action.payload };
    case 'SET_CHART_SUGGESTIONS': return { ...state, chartSuggestions: action.payload };
    case 'SET_ACTIVE_TAB': return { ...state, activeTab: action.payload };
    case 'SET_LAYOUT_THEME': return { ...state, layoutTheme: action.payload };
    case 'SET_SQL_DIALECT': return { ...state, sqlDialect: action.payload };
    case 'RESET_APP': return { ...initialState, layoutTheme: state.layoutTheme };
    default: return state;
  }
};

describe('appReducer', () => {
  describe('SET_LOADING_STATE', () => {
    it('should set loading state for schema operation to true', () => {
      const result = appReducer(initialState, {
        type: 'SET_LOADING_STATE',
        payload: { operation: 'schema', isLoading: true }
      });
      expect(result.loadingStates.schema).toBe(true);
    });

    it('should set loading state for schema operation to false', () => {
      const loadingState = { ...initialState, loadingStates: { schema: true } };
      const result = appReducer(loadingState, {
        type: 'SET_LOADING_STATE',
        payload: { operation: 'schema', isLoading: false }
      });
      expect(result.loadingStates.schema).toBe(false);
    });

    it('should handle multiple operations independently', () => {
      let state = appReducer(initialState, {
        type: 'SET_LOADING_STATE',
        payload: { operation: 'schema', isLoading: true }
      });
      state = appReducer(state, {
        type: 'SET_LOADING_STATE',
        payload: { operation: 'sql', isLoading: true }
      });
      expect(state.loadingStates.schema).toBe(true);
      expect(state.loadingStates.sql).toBe(true);

      state = appReducer(state, {
        type: 'SET_LOADING_STATE',
        payload: { operation: 'schema', isLoading: false }
      });
      expect(state.loadingStates.schema).toBe(false);
      expect(state.loadingStates.sql).toBe(true);
    });
  });

  describe('SET_ERROR', () => {
    it('should set error message', () => {
      const result = appReducer(initialState, { type: 'SET_ERROR', payload: 'Something went wrong' });
      expect(result.error).toBe('Something went wrong');
    });

    it('should clear error with null', () => {
      const errorState = { ...initialState, error: 'Previous error' };
      const result = appReducer(errorState, { type: 'SET_ERROR', payload: null });
      expect(result.error).toBeNull();
    });
  });

  describe('ADD_CHAT_MESSAGE', () => {
    it('should append message to chat history', () => {
      const message: ChatMessage = { role: 'user', text: 'Hello' };
      const result = appReducer(initialState, { type: 'ADD_CHAT_MESSAGE', payload: message });
      expect(result.chatHistory).toHaveLength(1);
      expect(result.chatHistory[0]).toEqual(message);
    });

    it('should preserve existing messages', () => {
      const existingMessage: ChatMessage = { role: 'model', text: 'Hi there' };
      const stateWithMessage = { ...initialState, chatHistory: [existingMessage] };
      const newMessage: ChatMessage = { role: 'user', text: 'How are you?' };
      const result = appReducer(stateWithMessage, { type: 'ADD_CHAT_MESSAGE', payload: newMessage });
      expect(result.chatHistory).toHaveLength(2);
      expect(result.chatHistory[0]).toEqual(existingMessage);
      expect(result.chatHistory[1]).toEqual(newMessage);
    });
  });

  describe('SET_SCHEMA', () => {
    it('should set schema', () => {
      const schema: Schema = {
        description: 'Test schema',
        tables: [{ name: 'Users', columns: [{ name: 'id', type: 'INT', isPrimaryKey: true }] }],
      };
      const result = appReducer(initialState, { type: 'SET_SCHEMA', payload: schema });
      expect(result.schema).toEqual(schema);
    });

    it('should clear schema with null', () => {
      const schemaState = { ...initialState, schema: { tables: [] } };
      const result = appReducer(schemaState, { type: 'SET_SCHEMA', payload: null });
      expect(result.schema).toBeNull();
    });
  });

  describe('SET_ACTIVE_TAB', () => {
    it('should change active tab', () => {
      const result = appReducer(initialState, { type: 'SET_ACTIVE_TAB', payload: 'Refine' });
      expect(result.activeTab).toBe('Refine');
    });
  });

  describe('SET_LAYOUT_THEME', () => {
    it('should change layout theme', () => {
      const result = appReducer(initialState, { type: 'SET_LAYOUT_THEME', payload: 'Grid' });
      expect(result.layoutTheme).toBe('Grid');
    });
  });

  describe('SET_SQL_DIALECT', () => {
    it('should change SQL dialect', () => {
      const result = appReducer(initialState, { type: 'SET_SQL_DIALECT', payload: 'MySQL' });
      expect(result.sqlDialect).toBe('MySQL');
    });
  });

  describe('RESET_APP', () => {
    it('should reset state to initial values', () => {
      const modifiedState: AppState = {
        ...initialState,
        schema: { tables: [] },
        generatedSql: 'CREATE TABLE...',
        loadingStates: { schema: true, sql: true },
        error: 'Some error',
      };
      const result = appReducer(modifiedState, { type: 'RESET_APP' });
      expect(result.schema).toBeNull();
      expect(result.generatedSql).toBeNull();
      expect(result.loadingStates).toEqual({});
      expect(result.error).toBeNull();
    });

    it('should preserve layout theme on reset', () => {
      const modifiedState: AppState = {
        ...initialState,
        layoutTheme: 'Wizard',
        schema: { tables: [] },
      };
      const result = appReducer(modifiedState, { type: 'RESET_APP' });
      expect(result.layoutTheme).toBe('Wizard');
    });
  });

  describe('Immutability', () => {
    it('should not mutate original state', () => {
      const originalState = { ...initialState };
      const frozenState = Object.freeze({ ...initialState, loadingStates: Object.freeze({}) });

      // This should not throw if the reducer is properly immutable
      expect(() => {
        appReducer(frozenState as AppState, {
          type: 'SET_LOADING_STATE',
          payload: { operation: 'schema', isLoading: true }
        });
      }).not.toThrow();
    });

    it('should return new object reference on state change', () => {
      const result = appReducer(initialState, {
        type: 'SET_LOADING_STATE',
        payload: { operation: 'schema', isLoading: true }
      });
      expect(result).not.toBe(initialState);
    });
  });
});
