/**
 * @fileoverview Type definitions for the Semantic Loop DevOps Demonstrator application.
 *
 * This file defines all TypeScript interfaces and types used throughout the application,
 * including database schema structures, application state, and action types for the reducer pattern.
 *
 * @module types
 * @category Core
 */

/**
 * Represents a single column in a database table.
 *
 * @interface Column
 * @property {string} name - The name of the column (e.g., "UserID", "Email").
 * @property {string} type - The SQL data type (e.g., "INT", "VARCHAR(255)", "TIMESTAMP").
 * @property {string} [description] - Optional human-readable description of the column's purpose.
 * @property {boolean} [isPrimaryKey] - Indicates if this column is the primary key for the table.
 * @property {boolean} [isForeignKey] - Indicates if this column references another table's primary key.
 * @property {Object} [foreignKeyTo] - Foreign key relationship details, if applicable.
 * @property {string} [foreignKeyTo.table] - The name of the referenced table.
 * @property {string} [foreignKeyTo.column] - The name of the referenced column.
 */
export interface Column {
  name: string;
  type: string;
  description?: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  foreignKeyTo?: {
    table: string;
    column: string;
  };
}

/**
 * Represents a database table with its columns and metadata.
 *
 * @interface Table
 * @property {string} name - The name of the table (e.g., "Users", "Posts").
 * @property {string} [description] - Optional human-readable description of the table's purpose.
 * @property {Column[]} columns - Array of column definitions for this table. Must contain at least one column.
 *
 * @invariant At least one column must have isPrimaryKey set to true for referential integrity.
 */
export interface Table {
  name: string;
  description?: string;
  columns: Column[];
}

/**
 * Represents a complete database schema with multiple tables and relationships.
 *
 * @interface Schema
 * @property {string} [description] - Optional high-level description of the entire schema's purpose and domain.
 * @property {Table[]} tables - Array of table definitions. Must contain at least one table.
 *
 * @invariant Foreign key relationships must reference valid tables and columns within the schema.
 */
export interface Schema {
  description?: string;
  tables: Table[];
}

/**
 * Represents a single message in a conversational AI chat history.
 *
 * @interface ChatMessage
 * @property {'user' | 'model'} role - The sender of the message. 'user' for human input, 'model' for AI responses.
 * @property {string} text - The content of the message. Must not be empty.
 */
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

/**
 * Represents a file uploaded by the user to provide context for schema generation.
 *
 * @interface UploadedFile
 * @property {string} name - The original filename with extension (e.g., "requirements.txt", "schema.json").
 * @property {string} content - The complete text content of the file read as UTF-8.
 */
export interface UploadedFile {
  name: string;
  content: string;
}

/**
 * SQL dialect selector for generating database-specific DDL statements.
 *
 * @typedef {('PostgreSQL' | 'MySQL')} SQLDialect
 */
export type SQLDialect = 'PostgreSQL' | 'MySQL';

/**
 * Navigation tab identifiers for the application's workflow stages.
 *
 * @typedef {('Schema' | 'Refine' | 'Data' | 'Export')} AppTab
 *
 * - **Schema**: Initial schema creation through conversational AI
 * - **Refine**: Visual schema editing and refinement
 * - **Data**: Sample data generation and visualization
 * - **Export**: Artifact generation (SQL, user stories, API docs, tests)
 */
export type AppTab = 'Schema' | 'Refine' | 'Data' | 'Export';

/**
 * Layout theme options for the application's user interface.
 *
 * @typedef {('Tabs' | 'Wizard' | 'Grid')} LayoutTheme
 *
 * - **Tabs**: Traditional horizontal tab navigation
 * - **Wizard**: Step-by-step guided workflow with progress indicator
 * - **Grid**: Dashboard view with all sections visible simultaneously
 */
export type LayoutTheme = 'Tabs' | 'Wizard' | 'Grid';

/**
 * Color theme for the application UI.
 *
 * @typedef {('light' | 'dark')} Theme
 */
export type Theme = 'light' | 'dark';

/**
 * Identifies specific async operations for granular loading state tracking.
 *
 * @typedef {string} LoadingOperation
 *
 * - **schema**: Initial schema generation
 * - **refine**: Schema refinement
 * - **sampleData**: Sample data generation
 * - **visualization**: Chart/visualization generation
 * - **sql**: SQL DDL generation
 * - **stories**: User stories generation
 * - **apiDocs**: API documentation generation
 * - **testCases**: Test cases generation
 */
export type LoadingOperation =
  | 'schema'
  | 'refine'
  | 'sampleData'
  | 'visualization'
  | 'sql'
  | 'stories'
  | 'apiDocs'
  | 'testCases';

/**
 * Tracks loading state for multiple concurrent operations.
 * Each key is a LoadingOperation, value is true if that operation is in progress.
 *
 * @typedef {Partial<Record<LoadingOperation, boolean>>} LoadingState
 */
export type LoadingState = Partial<Record<LoadingOperation, boolean>>;

/**
 * Global application state managed by the React Context + useReducer pattern.
 *
 * @interface AppState
 *
 * @property {ChatMessage[]} chatHistory - Conversation history for schema generation.
 * @property {UploadedFile[]} uploadedFiles - Context files uploaded by the user.
 * @property {Schema | null} schema - The current database schema, or null if not yet generated.
 * @property {string | null} generatedSql - Generated SQL CREATE TABLE statements, or null if not generated.
 * @property {string | null} generatedUserStories - Generated markdown-formatted user stories, or null if not generated.
 * @property {string | null} generatedApiDocs - Generated API documentation in markdown format, or null if not generated.
 * @property {string | null} generatedTestCases - Generated Gherkin-format test cases, or null if not generated.
 * @property {LoadingState} loadingStates - Tracks which specific operations are currently loading.
 * @property {string | null} error - Current error message to display to the user, or null if no error.
 * @property {string} sampleDataPrompt - User's custom criteria for sample data generation.
 * @property {string} sampleDataRowCount - Target number of rows for sample data generation (stored as string for input binding).
 * @property {string | null} generatedSampleData - Generated sample data as JSON string, or null if not generated.
 * @property {ChatMessage[]} visualizationChatHistory - Separate conversation history for chart generation.
 * @property {object | null} visualizationSpec - Vega-Lite specification object for the current chart, or null if not generated.
 * @property {SQLDialect} sqlDialect - Currently selected SQL dialect (PostgreSQL or MySQL).
 * @property {{uri: string; title: string}[] | null} visualizationSources - Google Search grounding sources for chart generation, or null if not available.
 * @property {string[] | null} chartSuggestions - AI-generated chart suggestions based on current data, or null if not generated.
 * @property {AppTab} activeTab - Currently active navigation tab.
 * @property {LayoutTheme} layoutTheme - Currently active layout theme.
 * @property {Theme} theme - Currently active color theme.
 *
 * @invariant When schema changes, all dependent artifacts (SQL, stories, docs, tests, data, visualizations) must be invalidated.
 */
export interface AppState {
  toasts: ToastMessage[];
  chatHistory: ChatMessage[];
  uploadedFiles: UploadedFile[];
  schema: Schema | null;
  schemaHistory: Schema[];
  currentSchemaIndex: number;
  generatedSql: string | null;
  generatedUserStories: string | null;
  generatedApiDocs: string | null;
  generatedTestCases: string | null;
  loadingStates: LoadingState;
  error: string | null;
  sampleDataPrompt: string;
  sampleDataRowCount: string;
  generatedSampleData: string | null;
  visualizationChatHistory: ChatMessage[];
  visualizationSpec: object | null;
  sqlDialect: SQLDialect;
  visualizationSources: { uri: string; title: string }[] | null;
  chartSuggestions: string[] | null;
  activeTab: AppTab;
  layoutTheme: LayoutTheme;
  theme: Theme;
}

/**
 * Defines the structure for a toast notification message.
 *
 * @interface ToastMessage
 */
export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

/**
 * Defines the structure of a saved project file.
 * Contains all user-generated content that can be exported and re-imported.
 *
 * @interface ProjectFile
 */
export interface ProjectFile {
  version: number;
  chatHistory: ChatMessage[];
  uploadedFiles: UploadedFile[];
  schema: Schema | null;
  sampleDataPrompt: string;
  sampleDataRowCount: string;
  generatedSampleData: string | null;
  visualizationChatHistory: ChatMessage[];
  sqlDialect: SQLDialect;
}

/**
 * Discriminated union type representing all possible state mutations in the application.
 *
 * @typedef {Object} AppAction
 *
 * Each action type corresponds to a specific state mutation operation.
 * Actions follow the Flux Standard Action pattern with a `type` discriminator and a `payload` field.
 *
 * @property {'ADD_TOAST'} type - Adds a new toast notification.
 * @property {Omit<ToastMessage, 'id'>} payload - The toast message to add.
 *
 * @property {'REMOVE_TOAST'} type - Removes a toast notification by its ID.
 * @property {string} payload - The ID of the toast to remove.
 *
 * @property {'LOAD_PROJECT'} type - Replaces the current state with data from a loaded project file.
 * @property {ProjectFile} payload - The project data to load.
 *
 * @property {'SET_LOADING_STATE'} type - Sets loading state for a specific operation.
 * @property {{ operation: LoadingOperation; isLoading: boolean }} payload - Operation identifier and loading state.
 *
 * @property {'SET_ERROR'} type - Sets or clears the error message.
 * @property {string | null} payload - Error message or null to clear.
 *
 * @property {'SET_CHAT_HISTORY'} type - Replaces the entire chat history.
 * @property {ChatMessage[]} payload - New chat history array.
 *
 * @property {'ADD_CHAT_MESSAGE'} type - Appends a single message to chat history.
 * @property {ChatMessage} payload - Message to append.
 *
- * @property {'SET_UPLOADED_FILES'} type - Replaces the uploaded files array.
 * @property {UploadedFile[]} payload - New uploaded files array.
 *
 * @property {'SET_SCHEMA'} type - Sets or clears the current schema.
 * @property {Schema | null} payload - New schema or null.
 *
 * @property {'UNDO_SCHEMA_CHANGE'} type - Reverts to the previous schema in the history.
 * @property {'REDO_SCHEMA_CHANGE'} type - Moves forward to the next schema in the history.
 *
 * @property {'SET_GENERATED_SQL'} type - Sets or clears generated SQL.
 * @property {string | null} payload - Generated SQL string or null.
 *
 * @property {'SET_GENERATED_STORIES'} type - Sets or clears generated user stories.
 * @property {string | null} payload - Generated stories markdown or null.
 *
 * @property {'SET_GENERATED_DOCS'} type - Sets or clears generated API documentation.
 * @property {string | null} payload - Generated docs markdown or null.
 *
 * @property {'SET_GENERATED_TESTS'} type - Sets or clears generated test cases.
 * @property {string | null} payload - Generated Gherkin tests or null.
 *
 * @property {'SET_SAMPLE_DATA_PROMPT'} type - Updates the sample data generation prompt.
 * @property {string} payload - New prompt text.
 *
 * @property {'SET_SAMPLE_DATA_ROW_COUNT'} type - Updates the target row count for sample data.
 * @property {string} payload - New row count as string.
 *
 * @property {'SET_GENERATED_SAMPLE_DATA'} type - Sets or clears generated sample data.
 * @property {string | null} payload - Generated data JSON string or null.
 *
 * @property {'SET_VISUALIZATION_CHAT_HISTORY'} type - Replaces the visualization chat history.
 * @property {ChatMessage[]} payload - New chat history array.
 *
 * @property {'SET_VISUALIZATION_SPEC'} type - Sets or clears the Vega-Lite visualization spec.
 * @property {object | null} payload - Vega-Lite spec object or null.
 *
 * @property {'SET_VISUALIZATION_SOURCES'} type - Sets or clears grounding sources for visualizations.
 * @property {{uri: string; title: string}[] | null} payload - Source citations array or null.
 *
 * @property {'SET_CHART_SUGGESTIONS'} type - Sets or clears AI-generated chart suggestions.
 * @property {string[] | null} payload - Array of suggestion strings or null.
 *
 * @property {'SET_ACTIVE_TAB'} type - Changes the active navigation tab.
 * @property {AppTab} payload - New active tab identifier.
 *
 * @property {'SET_LAYOUT_THEME'} type - Changes the layout theme.
 * @property {LayoutTheme} payload - New layout theme identifier.
 *
 * @property {'SET_THEME'} type - Changes the color theme.
 * @property {Theme} payload - New theme identifier.
 *
 * @property {'SET_SQL_DIALECT'} type - Changes the SQL dialect for code generation.
 * @property {SQLDialect} payload - New SQL dialect.
 *
 * @property {'RESET_APP'} type - Resets the application to initial state (preserves layout theme).
 *
 * @example
 * // Dispatch a loading action
 * dispatch({ type: 'SET_LOADING', payload: true });
 *
 * @example
 * // Dispatch a schema update action
 * dispatch({ type: 'SET_SCHEMA', payload: newSchemaObject });
 *
 * @example
 * // Reset the application
 * dispatch({ type: 'RESET_APP' });
 */
export type AppAction =
  | { type: 'ADD_TOAST'; payload: Omit<ToastMessage, 'id'> }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'LOAD_PROJECT'; payload: ProjectFile }
  | { type: 'SET_LOADING_STATE'; payload: { operation: LoadingOperation; isLoading: boolean } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CHAT_HISTORY'; payload: ChatMessage[] }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_UPLOADED_FILES'; payload: UploadedFile[] }
  | { type: 'SET_SCHEMA'; payload: Schema | null }
  | { type: 'UNDO_SCHEMA_CHANGE' }
  | { type: 'REDO_SCHEMA_CHANGE' }
  | { type: 'SET_GENERATED_SQL'; payload: string | null }
  | { type: 'SET_GENERATED_STORIES'; payload: string | null }
  | { type: 'SET_GENERATED_DOCS'; payload: string | null }
  | { type: 'SET_GENERATED_TESTS'; payload: string | null }
  | { type: 'SET_SAMPLE_DATA_PROMPT'; payload: string }
  | { type: 'SET_SAMPLE_DATA_ROW_COUNT'; payload: string }
  | { type: 'SET_GENERATED_SAMPLE_DATA'; payload: string | null }
  | { type: 'SET_VISUALIZATION_CHAT_HISTORY'; payload: ChatMessage[] }
  | { type: 'SET_VISUALIZATION_SPEC'; payload: object | null }
  | { type: 'SET_VISUALIZATION_SOURCES'; payload: { uri: string; title: string }[] | null }
  | { type: 'SET_CHART_SUGGESTIONS'; payload: string[] | null }
  | { type: 'SET_ACTIVE_TAB'; payload: AppTab }
  | { type: 'SET_LAYOUT_THEME'; payload: LayoutTheme }
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'SET_SQL_DIALECT'; payload: SQLDialect }
  | { type: 'RESET_APP' };
