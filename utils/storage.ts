/**
 * @fileoverview LocalStorage utilities for state persistence.
 *
 * Provides functions to save and load application state from localStorage,
 * ensuring user work persists across browser sessions.
 *
 * @module utils/storage
 * @category Utilities
 */

import type { AppState, Schema, ChatMessage } from '../types';

/** Key used for storing application state in localStorage */
const STORAGE_KEY = 'devops-build-state';

/** Version for state schema migration */
const STORAGE_VERSION = 1;

/**
 * Subset of AppState that should be persisted to localStorage.
 * Excludes transient state like loading flags and errors.
 */
interface PersistedState {
  version: number;
  chatHistory: ChatMessage[];
  schema: Schema | null;
  visualizationChatHistory: ChatMessage[];
  sampleDataPrompt: string;
  sampleDataRowCount: string;
  sqlDialect: 'PostgreSQL' | 'MySQL';
  layoutTheme: 'Tabs' | 'Wizard' | 'Grid';
  generatedSampleData: string | null;
}

/**
 * Saves relevant application state to localStorage.
 *
 * Only persists user-generated content and preferences, not transient
 * state like loading flags, errors, or generated artifacts that can
 * be regenerated.
 *
 * @function saveState
 * @param {AppState} state - The current application state.
 */
export function saveState(state: AppState): void {
  try {
    const persistedState: PersistedState = {
      version: STORAGE_VERSION,
      chatHistory: state.chatHistory,
      schema: state.schema,
      visualizationChatHistory: state.visualizationChatHistory,
      sampleDataPrompt: state.sampleDataPrompt,
      sampleDataRowCount: state.sampleDataRowCount,
      sqlDialect: state.sqlDialect,
      layoutTheme: state.layoutTheme,
      generatedSampleData: state.generatedSampleData,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
  }
}

/**
 * Loads persisted state from localStorage.
 *
 * Returns null if no state is saved, parsing fails, or version mismatch.
 * Validates the loaded data structure before returning.
 *
 * @function loadState
 * @returns {Partial<AppState> | null} The persisted state or null if not available.
 */
export function loadState(): Partial<AppState> | null {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (!serializedState) {
      return null;
    }

    const persistedState: PersistedState = JSON.parse(serializedState);

    // Version check for future migrations
    if (persistedState.version !== STORAGE_VERSION) {
      console.warn('State version mismatch, clearing persisted state');
      clearState();
      return null;
    }

    // Validate critical fields
    if (!Array.isArray(persistedState.chatHistory)) {
      return null;
    }

    return {
      chatHistory: persistedState.chatHistory,
      schema: persistedState.schema,
      visualizationChatHistory: persistedState.visualizationChatHistory || [],
      sampleDataPrompt: persistedState.sampleDataPrompt,
      sampleDataRowCount: persistedState.sampleDataRowCount,
      sqlDialect: persistedState.sqlDialect,
      layoutTheme: persistedState.layoutTheme,
      generatedSampleData: persistedState.generatedSampleData,
    };
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
    return null;
  }
}

/**
 * Clears persisted state from localStorage.
 *
 * @function clearState
 */
export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear state from localStorage:', error);
  }
}

/**
 * Checks if there is persisted state available.
 *
 * @function hasPersistedState
 * @returns {boolean} True if persisted state exists.
 */
export function hasPersistedState(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}
