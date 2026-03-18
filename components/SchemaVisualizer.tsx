import React, { useState, useEffect, useRef } from 'react';
import type { Table, Column } from '../types';
import { useAppStore, isOperationLoading } from '../store';
import { refineSchema, transformSchema } from '../services/geminiService';
import { downloadFile } from '../utils/download';

/**
 *
 */
const EditableColumnType: React.FC<{
  tableName: string;
  columnName: string;
  currentType: string;
  onRefine: (prompt: string) => void;
  isLoading: boolean;
}> = ({ tableName, columnName, currentType, onRefine, isLoading }): JSX.Element => {
  const [isEditing, setIsEditing] = useState(false);
  const [type, setType] = useState(currentType);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setType(currentType);
  }, [currentType]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  /**
   *
   */
  const handleBlur = (): void => {
    setIsEditing(false);
    if (type.trim() && type !== currentType) {
      onRefine(`Change the type of column "${columnName}" in table "${tableName}" to ${type}.`);
    } else {
      setType(currentType);
    }
  };

  /**
   *
   */
  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setType(currentType);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={type}
        onChange={e => setType(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="font-mono text-xs bg-brand-border p-1 rounded-md text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
        size={Math.max(type.length, 8)}
        disabled={isLoading}
      />
    );
  }

  return (
    <span
      onClick={() => !isLoading && setIsEditing(true)}
      className={`font-mono text-xs text-brand-text-secondary ${!isLoading ? 'hover:text-brand-accent hover:underline cursor-pointer' : 'cursor-not-allowed'}`}
      title="Click to edit type"
    >
      {currentType}
    </span>
  );
};

/**
 *
 */
const ColumnItem: React.FC<{
  column: Column;
  tableName: string;
  onRefine: (prompt: string) => void;
  isLoading: boolean;
}> = ({ column, tableName, onRefine, isLoading }): JSX.Element => {
  /**
   *
   */
  const handlePkToggle = (): void => {
    if (isLoading) return;
    const action = column.isPrimaryKey ? 'Remove the primary key constraint from' : 'Make';
    const target = column.isPrimaryKey
      ? `column "${column.name}" in table "${tableName}"`
      : `"${column.name}" the primary key for table "${tableName}"`;
    onRefine(`${action} ${target}.`);
  };

  /**
   *
   */
  const handleFkToggle = (): void => {
    if (isLoading) return;
    const action = column.isForeignKey
      ? 'Remove the foreign key constraint from'
      : 'Add a foreign key constraint to';
    onRefine(`${action} column "${column.name}" in table "${tableName}".`);
  };

  return (
    <div className="flex items-center justify-between p-2.5 border-t border-brand-border/50">
      <div className="flex items-center space-x-3">
        <span className="font-mono text-sm text-brand-text-primary">{column.name}</span>
        <button
          onClick={handlePkToggle}
          disabled={isLoading}
          className={`text-xs font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${column.isPrimaryKey ? 'text-yellow-400 bg-yellow-900/50 hover:bg-yellow-800/50' : 'text-gray-500 bg-gray-700/50 hover:bg-yellow-900/50 hover:text-yellow-400'}`}
          title={column.isPrimaryKey ? 'Remove Primary Key' : 'Make Primary Key'}
        >
          PK
        </button>
        <button
          onClick={handleFkToggle}
          disabled={isLoading}
          className={`text-xs font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${column.isForeignKey ? 'text-sky-400 bg-sky-900/50 hover:bg-sky-800/50' : 'text-gray-500 bg-gray-700/50 hover:bg-sky-900/50 hover:text-sky-400'}`}
          title={column.isForeignKey ? 'Remove Foreign Key' : 'Make Foreign Key'}
        >
          FK
        </button>
      </div>
      <EditableColumnType
        tableName={tableName}
        columnName={column.name}
        currentType={column.type}
        onRefine={onRefine}
        isLoading={isLoading}
      />
    </div>
  );
};

/**
 *
 */
const TableCard: React.FC<{
  table: Table;
  onRefine: (prompt: string) => void;
  isLoading: boolean;
}> = ({ table, onRefine, isLoading }): JSX.Element => {
  const [exportFormat, setExportFormat] = useState('TypeScript');
  /**
   *
   */
  const handleExport = async (): Promise<void> => {
    if (!table) return;
    const transformedSchema = await transformSchema({ tables: [table] }, exportFormat);
    navigator.clipboard.writeText(transformedSchema);
  };

  return (
    <div className="bg-brand-primary border border-brand-border rounded-lg shadow-md flex-shrink-0 w-80">
      <div className="p-3 border-b border-brand-border bg-brand-secondary/30 rounded-t-lg flex justify-between items-center">
        <div>
          <h3 className="font-bold text-lg text-brand-accent">{table.name}</h3>
          {table.description && (
            <p className="text-xs text-brand-text-secondary mt-1">{table.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={exportFormat}
            onChange={e => setExportFormat(e.target.value)}
            className="bg-brand-primary border border-brand-border rounded-md px-2 py-1 text-xs"
          >
            <option>TypeScript</option>
            <option>Prisma</option>
          </select>
          <button
            onClick={handleExport}
            title={`Copy ${table.name} schema as ${exportFormat}`}
            className="p-1.5 text-brand-text-secondary hover:bg-brand-border hover:text-brand-accent rounded-md transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m-6 4h6m-6 4h6m-6-8h6"
              />
            </svg>
          </button>
        </div>
      </div>
      <div>
        {table.columns.map(col => (
          <ColumnItem
            key={col.name}
            column={col}
            tableName={table.name}
            onRefine={onRefine}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
};

/**
 *
 */
export const SchemaVisualizer: React.FC = (): JSX.Element | null => {
  const { state, dispatch } = useAppStore();
  const { schema, loadingStates, error, chatHistory } = state;
  const isLoading = isOperationLoading(loadingStates, 'refine');
  const [refinementPrompt, setRefinementPrompt] = useState('');

  if (!schema) return null;

  /**
   *
   */
  const handleRefineSchema = async (prompt: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'refine', isLoading: true } });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const newSchema = await refineSchema(schema, prompt, chatHistory);
      dispatch({ type: 'SET_SCHEMA', payload: newSchema });

      // Clear dependent artifacts on schema change
      dispatch({ type: 'SET_GENERATED_SQL', payload: null });
      dispatch({ type: 'SET_GENERATED_STORIES', payload: null });
      dispatch({ type: 'SET_GENERATED_DOCS', payload: null });
      dispatch({ type: 'SET_GENERATED_TESTS', payload: null });
      dispatch({ type: 'SET_GENERATED_SAMPLE_DATA', payload: null });
      dispatch({ type: 'SET_VISUALIZATION_SPEC', payload: null });
    } catch (e) {
      const error = e instanceof Error ? e.message : 'An unknown error occurred.';
      dispatch({ type: 'SET_ERROR', payload: `Failed to refine schema: ${error}` });
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'refine', isLoading: false } });
    }
  };

  /**
   *
   */
  const handleRefinementSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (refinementPrompt.trim() && !isLoading) {
      handleRefineSchema(refinementPrompt);
      setRefinementPrompt('');
    }
  };

  /**
   *
   */
  const handleExportAll = (): void => {
    if (!schema) return;
    const content = JSON.stringify(schema, null, 2);
    navigator.clipboard.writeText(content);
    dispatch({
      type: 'ADD_TOAST',
      payload: { message: 'Schema copied to clipboard!', type: 'success' },
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-brand-text-primary mb-1">
            Visualize & Refine Schema
          </h2>
          <p className="text-brand-text-secondary mb-6">
            {schema.description || 'Here is the generated schema for your application.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportAll}
            className="px-4 py-2 bg-brand-border text-brand-text-secondary text-sm font-semibold rounded-md hover:bg-brand-secondary-hover hover:text-white transition duration-200 flex items-center gap-2"
            title="Copy full schema as JSON"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m-6 4h6m-6 4h6m-6-8h6"
              />
            </svg>
            <span>Copy All</span>
          </button>
          <button
            onClick={() =>
              downloadFile(JSON.stringify(schema, null, 2), 'schema.json', 'application/json')
            }
            className="px-4 py-2 bg-brand-border text-brand-text-secondary text-sm font-semibold rounded-md hover:bg-brand-secondary-hover hover:text-white transition duration-200 flex items-center gap-2"
            title="Export full schema as JSON"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>Export All</span>
          </button>
        </div>
      </div>
      <div className="flex-1 pb-6 -mx-6 px-6 overflow-x-auto flex space-x-6 items-start">
        {schema.tables.map(table => (
          <TableCard
            key={table.name}
            table={table}
            onRefine={handleRefineSchema}
            isLoading={isLoading}
          />
        ))}
      </div>

      <div className="pt-6 border-t border-brand-border flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold">Refine Schema</h3>
          <div className="flex gap-2">
            <button
              onClick={() => dispatch({ type: 'UNDO_SCHEMA_CHANGE' })}
              disabled={state.currentSchemaIndex <= 0}
              className="px-3 py-1 text-sm bg-brand-border text-brand-text-secondary rounded-md hover:bg-brand-secondary-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Undo
            </button>
            <button
              onClick={() => dispatch({ type: 'REDO_SCHEMA_CHANGE' })}
              disabled={state.currentSchemaIndex >= state.schemaHistory.length - 1}
              className="px-3 py-1 text-sm bg-brand-border text-brand-text-secondary rounded-md hover:bg-brand-secondary-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Redo
            </button>
          </div>
        </div>
        <p className="text-brand-text-secondary mb-3 text-sm">
          Use natural language to make changes, or click directly on the schema above.
        </p>
        <form onSubmit={handleRefinementSubmit} className="flex gap-2">
          <input
            type="text"
            value={refinementPrompt}
            onChange={e => setRefinementPrompt(e.target.value)}
            className="w-full p-2 bg-brand-primary border border-brand-border rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none text-brand-text-primary placeholder-brand-text-secondary"
            placeholder="E.g., Add a 'last_login' timestamp to the Users table."
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !refinementPrompt.trim()}
            className="px-4 py-2 bg-brand-accent text-white font-semibold rounded-md hover:bg-brand-accent-hover disabled:bg-brand-border disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? '...' : 'Refine'}
          </button>
        </form>
        {error && <p className="text-brand-danger text-sm mt-2">{error}</p>}
      </div>
    </div>
  );
};
