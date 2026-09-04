import type { AppAction, SQLDialect } from '../types';
import type { Dispatch } from 'react';
import {
  applySchemaChanges,
  countRows,
  generateDeterministicSql,
  invalidateDerivedArtifacts,
  parseSampleData,
  parseSchemaInput,
  summarizeState,
  WebMcpInputError,
} from './project';
import {
  applySchemaChangesInputSchema,
  createSchemaInputSchema,
  emptyInputSchema,
  exportProjectInputSchema,
  setSampleDataInputSchema,
} from './schemas';
import type { WebMcpAdapter, WebMcpDocument, WebMcpTool } from './types';

/**
 *
 */
function success(summary: string, details: Record<string, unknown> = {}): Record<string, unknown> {
  return { ok: true, summary, ...details };
}

/**
 *
 */
function failure(error: unknown): Record<string, unknown> {
  if (error instanceof WebMcpInputError) {
    return { ok: false, error: { code: error.code, message: error.message } };
  }
  console.error('WebMCP tool failed:', error);
  return {
    ok: false,
    error: { code: 'internal_error', message: 'The page could not complete the tool action.' },
  };
}

/**
 *
 */
function visibleSchemaUpdate(
  dispatch: Dispatch<AppAction>,
  schema: ReturnType<typeof parseSchemaInput>
): void {
  invalidateDerivedArtifacts(dispatch);
  dispatch({ type: 'SET_ERROR', payload: null });
  dispatch({ type: 'SET_SCHEMA', payload: schema });
  dispatch({ type: 'SET_ACTIVE_TAB', payload: 'Refine' });
}

/**
 *
 */
function guarded(
  handler: (
    input: Record<string, unknown>
  ) => Record<string, unknown> | Promise<Record<string, unknown>>
): WebMcpTool['execute'] {
  return async (input, options) => {
    if (options?.signal?.aborted) throw options.signal.reason;
    try {
      return await handler(input);
    } catch (error) {
      return failure(error);
    }
  };
}

/**
 *
 */
export function createWebMcpTools(adapter: WebMcpAdapter): WebMcpTool[] {
  return [
    {
      name: 'get_project_state',
      title: 'Get project state',
      description:
        'Read the schema workflow state visible on this page, including the schema, row counts, and artifact availability. Does not return chat history or uploaded-file contents.',
      inputSchema: emptyInputSchema,
      annotations: { readOnlyHint: true, untrustedContentHint: true, consequentialHint: false },
      execute: guarded(() => summarizeState(adapter.getState())),
    },
    {
      name: 'create_schema',
      title: 'Create database schema',
      description:
        'Create a validated database schema as a new visible revision, clear derived data and artifacts, and open the Refine view.',
      inputSchema: createSchemaInputSchema,
      annotations: { readOnlyHint: false, untrustedContentHint: true, consequentialHint: false },
      execute: guarded(input => {
        const schema = parseSchemaInput(input);
        visibleSchemaUpdate(adapter.dispatch, schema);
        return success(`Created ${schema.tables.length} tables and opened the Refine view.`, {
          tableNames: schema.tables.map(table => table.name),
        });
      }),
    },
    {
      name: 'apply_schema_changes',
      title: 'Apply schema changes',
      description:
        'Apply named table and column additions, updates, or removals to the current schema. Clears derived data and artifacts and opens the Refine view.',
      inputSchema: applySchemaChangesInputSchema,
      annotations: { readOnlyHint: false, untrustedContentHint: true, consequentialHint: false },
      execute: guarded(input => {
        const schema = applySchemaChanges(adapter.getState().schema, input);
        visibleSchemaUpdate(adapter.dispatch, schema);
        return success(
          `Applied schema changes. The schema now has ${schema.tables.length} tables.`,
          { tableNames: schema.tables.map(table => table.name) }
        );
      }),
    },
    {
      name: 'set_sample_data',
      title: 'Set sample data',
      description:
        'Validate and replace sample rows for current schema tables, then open the Data view so the user can inspect the result.',
      inputSchema: setSampleDataInputSchema,
      annotations: { readOnlyHint: false, untrustedContentHint: true, consequentialHint: false },
      execute: guarded(input => {
        const data = parseSampleData(input, adapter.getState().schema);
        adapter.dispatch({ type: 'SET_GENERATED_SAMPLE_DATA', payload: data });
        adapter.dispatch({ type: 'SET_VISUALIZATION_SPEC', payload: null });
        adapter.dispatch({ type: 'SET_VISUALIZATION_SOURCES', payload: null });
        adapter.dispatch({ type: 'SET_CHART_SUGGESTIONS', payload: null });
        adapter.dispatch({ type: 'SET_ERROR', payload: null });
        adapter.dispatch({ type: 'SET_ACTIVE_TAB', payload: 'Data' });
        const rowCounts = countRows(data);
        return success(
          `Set ${Object.values(rowCounts).reduce((sum, count) => sum + count, 0)} sample rows and opened the Data view.`,
          { rowCounts }
        );
      }),
    },
    {
      name: 'export_project',
      title: 'Export project artifacts',
      description:
        'Build deterministic SQL and JSON artifacts from the current page state, store the SQL in the visible Export view, and return the file contents. This does not upload or publish anything.',
      inputSchema: exportProjectInputSchema,
      annotations: { readOnlyHint: false, untrustedContentHint: true, consequentialHint: false },
      execute: guarded(input => {
        const state = adapter.getState();
        if (!state.schema) {
          throw new WebMcpInputError('no_schema', 'Create a schema before exporting the project.');
        }
        if (
          input.dialect !== undefined &&
          input.dialect !== 'PostgreSQL' &&
          input.dialect !== 'MySQL'
        ) {
          throw new WebMcpInputError('invalid_input', 'dialect must be PostgreSQL or MySQL.');
        }
        if (input.includeSampleData !== undefined && typeof input.includeSampleData !== 'boolean') {
          throw new WebMcpInputError('invalid_input', 'includeSampleData must be boolean.');
        }
        const dialect = (input.dialect ?? state.sqlDialect) as SQLDialect;
        const sql = generateDeterministicSql(state.schema, dialect);
        const files: Array<{ name: string; mediaType: string; content: string }> = [
          {
            name: 'schema.json',
            mediaType: 'application/json',
            content: JSON.stringify(state.schema, null, 2),
          },
          { name: 'schema.sql', mediaType: 'application/sql', content: sql },
        ];
        if (input.includeSampleData !== false && state.generatedSampleData) {
          files.push({
            name: 'sample-data.json',
            mediaType: 'application/json',
            content: state.generatedSampleData,
          });
        }
        if (state.generatedUserStories) {
          files.push({
            name: 'stories.md',
            mediaType: 'text/markdown',
            content: state.generatedUserStories,
          });
        }
        if (state.generatedApiDocs) {
          files.push({
            name: 'api-docs.md',
            mediaType: 'text/markdown',
            content: state.generatedApiDocs,
          });
        }
        if (state.generatedTestCases) {
          files.push({
            name: 'tests.feature',
            mediaType: 'text/plain',
            content: state.generatedTestCases,
          });
        }
        adapter.dispatch({ type: 'SET_SQL_DIALECT', payload: dialect });
        adapter.dispatch({ type: 'SET_GENERATED_SQL', payload: sql });
        adapter.dispatch({ type: 'SET_ERROR', payload: null });
        adapter.dispatch({ type: 'SET_ACTIVE_TAB', payload: 'Export' });
        return success(`Prepared ${files.length} files and opened the Export view.`, {
          dialect,
          files,
        });
      }),
    },
  ];
}

/**
 *
 */
export function registerWebMcpTools(
  adapter: WebMcpAdapter,
  targetDocument: WebMcpDocument = document as WebMcpDocument
): () => void {
  const modelContext = targetDocument.modelContext;
  if (typeof modelContext?.registerTool !== 'function') return () => undefined;

  const controller = new AbortController();
  const tools = createWebMcpTools(adapter);
  const registrations = tools.map(tool =>
    Promise.resolve(modelContext.registerTool(tool, { signal: controller.signal })).catch(error => {
      if (!controller.signal.aborted) {
        console.warn(`Unable to register WebMCP tool ${tool.name}:`, error);
      }
    })
  );
  void Promise.all(registrations);

  return () => {
    controller.abort();
    if (typeof modelContext.unregisterTool === 'function') {
      for (const tool of tools) {
        void Promise.resolve(modelContext.unregisterTool(tool.name)).catch(() => undefined);
      }
    }
  };
}
