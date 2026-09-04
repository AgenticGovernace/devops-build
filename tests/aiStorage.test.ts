import { beforeEach, describe, expect, it } from 'vitest';
import type { AppState } from '../types';
import { loadState, saveState } from '../utils/storage';

const baseState = {
  chatHistory: [],
  schema: null,
  visualizationChatHistory: [],
  sampleDataPrompt: '',
  sampleDataRowCount: '5',
  sqlDialect: 'PostgreSQL',
  layoutTheme: 'Tabs',
  generatedSampleData: null,
  aiProvider: 'anthropic',
} as AppState;

describe('provider preference storage', () => {
  beforeEach(() => localStorage.clear());

  it('persists the provider choice without serializing API keys', () => {
    saveState({
      ...baseState,
      OPENAI_API_KEY: 'must-not-be-stored',
    } as AppState & { OPENAI_API_KEY: string });

    const serialized = localStorage.getItem('devops-build-state') ?? '';
    expect(serialized).toContain('"aiProvider":"anthropic"');
    expect(serialized).not.toContain('must-not-be-stored');
    expect(serialized).not.toContain('API_KEY');
  });

  it('replaces an invalid persisted provider with the safe deployment default', () => {
    localStorage.setItem(
      'devops-build-state',
      JSON.stringify({
        version: 1,
        chatHistory: [],
        schema: null,
        visualizationChatHistory: [],
        sampleDataPrompt: '',
        sampleDataRowCount: '5',
        sqlDialect: 'PostgreSQL',
        layoutTheme: 'Tabs',
        generatedSampleData: null,
        aiProvider: 'unknown-provider',
      })
    );

    expect(loadState()?.aiProvider).toBe('gemini');
  });
});
