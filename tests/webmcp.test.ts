import { describe, expect, test, vi } from 'vitest';
import type { AppAction, AppState } from '../types';
import { createWebMcpTools, registerWebMcpTools } from '../webmcp/tools';
import type { WebMcpDocument, WebMcpTool } from '../webmcp/types';

const baseSchema = {
  description: 'Issue tracking',
  tables: [
    {
      name: 'issues',
      columns: [
        { name: 'id', type: 'INTEGER', isPrimaryKey: true },
        { name: 'title', type: 'VARCHAR(120)' },
      ],
    },
  ],
};

/**
 *
 */
function makeState(): AppState {
  return {
    toasts: [],
    chatHistory: [],
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
    sampleDataPrompt: '',
    sampleDataRowCount: '10',
    generatedSampleData: null,
    visualizationChatHistory: [],
    visualizationSpec: null,
    sqlDialect: 'PostgreSQL',
    visualizationSources: null,
    chartSuggestions: null,
    activeTab: 'Schema',
    layoutTheme: 'Tabs',
    theme: 'dark',
    aiProvider: 'gemini',
  };
}

/**
 *
 */
function harness() {
  let state = makeState();
  /**
   *
   */
  const dispatch = (action: AppAction): void => {
    switch (action.type) {
      case 'SET_SCHEMA':
        state = { ...state, schema: action.payload };
        break;
      case 'SET_GENERATED_SAMPLE_DATA':
        state = { ...state, generatedSampleData: action.payload };
        break;
      case 'SET_GENERATED_SQL':
        state = { ...state, generatedSql: action.payload };
        break;
      case 'SET_SQL_DIALECT':
        state = { ...state, sqlDialect: action.payload };
        break;
      case 'SET_ACTIVE_TAB':
        state = { ...state, activeTab: action.payload };
        break;
      default:
        break;
    }
  };
  const tools = createWebMcpTools({ /**
   *
   */
  getState: () => state, dispatch });
  return { /**
   *
   */
  getState: () => state, /**
   *
   */
  tool: (name: string) => tools.find(tool => tool.name === name)! };
}

describe('WebMCP tools', () => {
  test('registers all top-level tools and aborts/unregisters them during cleanup', async () => {
    const registered: WebMcpTool[] = [];
    const signals: AbortSignal[] = [];
    const unregisterTool = vi.fn();
    const fakeDocument = {
      modelContext: {
        registerTool: vi.fn((tool: WebMcpTool, options?: { signal?: AbortSignal }) => {
          registered.push(tool);
          if (options?.signal) signals.push(options.signal);
        }),
        unregisterTool,
      },
    } as unknown as WebMcpDocument;

    const cleanup = registerWebMcpTools({ getState: makeState, dispatch: vi.fn() }, fakeDocument);
    expect(registered.map(tool => tool.name)).toEqual([
      'get_project_state',
      'create_schema',
      'apply_schema_changes',
      'set_sample_data',
      'export_project',
    ]);
    expect(registered[0].annotations?.readOnlyHint).toBe(true);
    expect(registered.slice(1).every(tool => tool.annotations?.readOnlyHint === false)).toBe(true);

    cleanup();
    expect(signals).toHaveLength(5);
    expect(signals.every(signal => signal.aborted)).toBe(true);
    expect(unregisterTool).toHaveBeenCalledTimes(5);
  });

  test('creates a schema, applies a column change, and exposes current state', async () => {
    const app = harness();
    await app.tool('create_schema').execute(baseSchema);
    expect(app.getState().activeTab).toBe('Refine');
    expect(app.getState().schema?.tables[0].name).toBe('issues');

    const updated = (await app.tool('apply_schema_changes').execute({
      upsertColumns: [{ table: 'issues', column: { name: 'status', type: 'VARCHAR(32)' } }],
    })) as { ok: boolean };
    expect(updated.ok).toBe(true);
    expect(app.getState().schema?.tables[0].columns.map(column => column.name)).toContain('status');

    const stateResult = (await app.tool('get_project_state').execute({})) as {
      tableCount: number;
      columnCount: number;
    };
    expect(stateResult).toMatchObject({ tableCount: 1, columnCount: 3 });
  });

  test('sets validated sample data and prepares deterministic export files', async () => {
    const app = harness();
    await app.tool('create_schema').execute(baseSchema);
    const dataResult = (await app.tool('set_sample_data').execute({
      data: { issues: [{ id: 1, title: 'Ship WebMCP' }] },
    })) as { ok: boolean; rowCounts: Record<string, number> };
    expect(dataResult).toMatchObject({ ok: true, rowCounts: { issues: 1 } });
    expect(app.getState().activeTab).toBe('Data');

    const exportResult = (await app.tool('export_project').execute({
      dialect: 'PostgreSQL',
      includeSampleData: true,
    })) as { ok: boolean; files: Array<{ name: string; content: string }> };
    expect(exportResult.ok).toBe(true);
    expect(exportResult.files.map(file => file.name)).toEqual([
      'schema.json',
      'schema.sql',
      'sample-data.json',
    ]);
    expect(exportResult.files.find(file => file.name === 'schema.sql')?.content).toContain(
      'CREATE TABLE "issues"'
    );
    expect(app.getState()).toMatchObject({ activeTab: 'Export', sqlDialect: 'PostgreSQL' });
  });

  test('returns a structured error without mutating state when input is invalid', async () => {
    const app = harness();
    const before = app.getState();
    const result = (await app.tool('set_sample_data').execute({ data: {} })) as {
      ok: boolean;
      error: { code: string };
    };
    expect(result).toMatchObject({ ok: false, error: { code: 'no_schema' } });
    expect(app.getState()).toBe(before);
  });
});
