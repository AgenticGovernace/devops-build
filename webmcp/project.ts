import type { AppAction, AppState, Column, Schema, SQLDialect, Table } from '../types';
import type { Dispatch } from 'react';

const MAX_SAMPLE_DATA_CHARS = 250_000;
const NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_ -]*$/;

/**
 *
 */
export class WebMcpInputError extends Error {
  /**
   *
   */
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'WebMcpInputError';
  }
}

/**
 *
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 *
 */
function assertOnlyKeys(value: Record<string, unknown>, allowed: string[], path: string): void {
  const unexpected = Object.keys(value).filter(key => !allowed.includes(key));
  if (unexpected.length > 0) {
    throw new WebMcpInputError('invalid_input', `${path} has unsupported field: ${unexpected[0]}`);
  }
}

/**
 *
 */
function readString(
  value: unknown,
  path: string,
  maxLength: number,
  options: { optional?: boolean; name?: boolean } = {}
): string | undefined {
  if (value === undefined && options.optional) return undefined;
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maxLength) {
    throw new WebMcpInputError(
      'invalid_input',
      `${path} must be a non-empty string no longer than ${maxLength} characters.`
    );
  }
  const normalized = value.trim();
  if (options.name && !NAME_PATTERN.test(normalized)) {
    throw new WebMcpInputError(
      'invalid_input',
      `${path} must start with a letter or underscore and contain only letters, numbers, spaces, underscores, or hyphens.`
    );
  }
  return normalized;
}

/**
 *
 */
function parseColumn(value: unknown, path: string): Column {
  if (!isRecord(value)) {
    throw new WebMcpInputError('invalid_input', `${path} must be an object.`);
  }
  assertOnlyKeys(
    value,
    ['name', 'type', 'description', 'isPrimaryKey', 'isForeignKey', 'foreignKeyTo'],
    path
  );
  const name = readString(value.name, `${path}.name`, 64, { name: true }) as string;
  const type = readString(value.type, `${path}.type`, 64) as string;
  const description = readString(value.description, `${path}.description`, 300, {
    optional: true,
  });
  if (value.isPrimaryKey !== undefined && typeof value.isPrimaryKey !== 'boolean') {
    throw new WebMcpInputError('invalid_input', `${path}.isPrimaryKey must be boolean.`);
  }
  if (value.isForeignKey !== undefined && typeof value.isForeignKey !== 'boolean') {
    throw new WebMcpInputError('invalid_input', `${path}.isForeignKey must be boolean.`);
  }

  let foreignKeyTo: Column['foreignKeyTo'];
  if (value.foreignKeyTo !== undefined) {
    if (!isRecord(value.foreignKeyTo)) {
      throw new WebMcpInputError('invalid_input', `${path}.foreignKeyTo must be an object.`);
    }
    assertOnlyKeys(value.foreignKeyTo, ['table', 'column'], `${path}.foreignKeyTo`);
    foreignKeyTo = {
      table: readString(value.foreignKeyTo.table, `${path}.foreignKeyTo.table`, 64, {
        name: true,
      }) as string,
      column: readString(value.foreignKeyTo.column, `${path}.foreignKeyTo.column`, 64, {
        name: true,
      }) as string,
    };
  }
  if (value.isForeignKey === true && !foreignKeyTo) {
    throw new WebMcpInputError(
      'invalid_input',
      `${path}.foreignKeyTo is required when isForeignKey is true.`
    );
  }

  const isPrimaryKey = typeof value.isPrimaryKey === 'boolean' ? value.isPrimaryKey : undefined;
  const isForeignKey = typeof value.isForeignKey === 'boolean' ? value.isForeignKey : undefined;

  return {
    name,
    type,
    ...(description === undefined ? {} : { description }),
    ...(isPrimaryKey === undefined ? {} : { isPrimaryKey }),
    ...(foreignKeyTo
      ? { isForeignKey: true, foreignKeyTo }
      : isForeignKey === undefined
        ? {}
        : { isForeignKey }),
  };
}

/**
 *
 */
function parseTable(value: unknown, path: string): Table {
  if (!isRecord(value)) {
    throw new WebMcpInputError('invalid_input', `${path} must be an object.`);
  }
  assertOnlyKeys(value, ['name', 'description', 'columns'], path);
  const name = readString(value.name, `${path}.name`, 64, { name: true }) as string;
  const description = readString(value.description, `${path}.description`, 300, {
    optional: true,
  });
  if (!Array.isArray(value.columns) || value.columns.length < 1 || value.columns.length > 100) {
    throw new WebMcpInputError('invalid_input', `${path}.columns must contain 1 to 100 columns.`);
  }
  const columns = value.columns.map((column, index) =>
    parseColumn(column, `${path}.columns[${index}]`)
  );
  const names = new Set<string>();
  for (const column of columns) {
    const comparable = column.name.toLowerCase();
    if (names.has(comparable)) {
      throw new WebMcpInputError(
        'invalid_input',
        `${path} contains duplicate column ${column.name}.`
      );
    }
    names.add(comparable);
  }
  if (!columns.some(column => column.isPrimaryKey)) {
    throw new WebMcpInputError('invalid_input', `${path} must include at least one primary key.`);
  }
  return {
    name,
    columns,
    ...(description === undefined ? {} : { description }),
  };
}

/**
 *
 */
export function parseSchemaInput(value: unknown): Schema {
  if (!isRecord(value)) {
    throw new WebMcpInputError('invalid_input', 'Input must be an object.');
  }
  assertOnlyKeys(value, ['description', 'tables'], 'input');
  const description = readString(value.description, 'description', 500, { optional: true });
  if (!Array.isArray(value.tables) || value.tables.length < 1 || value.tables.length > 25) {
    throw new WebMcpInputError('invalid_input', 'tables must contain 1 to 25 tables.');
  }
  const tables = value.tables.map((table, index) => parseTable(table, `tables[${index}]`));
  validateSchema({ tables, ...(description === undefined ? {} : { description }) });
  return { tables, ...(description === undefined ? {} : { description }) };
}

/**
 *
 */
function validateSchema(schema: Schema): void {
  const tableNames = new Set<string>();
  for (const table of schema.tables) {
    const comparable = table.name.toLowerCase();
    if (tableNames.has(comparable)) {
      throw new WebMcpInputError('invalid_input', `Schema contains duplicate table ${table.name}.`);
    }
    tableNames.add(comparable);
  }
  for (const table of schema.tables) {
    for (const column of table.columns) {
      if (!column.foreignKeyTo) continue;
      const target = schema.tables.find(candidate => candidate.name === column.foreignKeyTo?.table);
      if (
        !target ||
        !target.columns.some(candidate => candidate.name === column.foreignKeyTo?.column)
      ) {
        throw new WebMcpInputError(
          'invalid_foreign_key',
          `${table.name}.${column.name} references missing ${column.foreignKeyTo.table}.${column.foreignKeyTo.column}.`
        );
      }
    }
  }
}

/**
 *
 */
export function applySchemaChanges(schema: Schema | null, input: unknown): Schema {
  if (!schema) {
    throw new WebMcpInputError('no_schema', 'Create a schema before applying changes.');
  }
  if (!isRecord(input)) {
    throw new WebMcpInputError('invalid_input', 'Input must be an object.');
  }
  const allowed = ['description', 'addTables', 'removeTables', 'upsertColumns', 'removeColumns'];
  assertOnlyKeys(input, allowed, 'input');
  if (!Object.keys(input).some(key => allowed.includes(key))) {
    throw new WebMcpInputError('invalid_input', 'Provide at least one schema change.');
  }

  const next: Schema = structuredClone(schema);
  if (input.description !== undefined) {
    next.description = readString(input.description, 'description', 500) as string;
  }

  const removeTables = input.removeTables ?? [];
  if (!Array.isArray(removeTables) || removeTables.length > 10) {
    throw new WebMcpInputError('invalid_input', 'removeTables must contain at most 10 names.');
  }
  for (const [index, tableValue] of removeTables.entries()) {
    const tableName = readString(tableValue, `removeTables[${index}]`, 64, {
      name: true,
    }) as string;
    const before = next.tables.length;
    next.tables = next.tables.filter(table => table.name !== tableName);
    if (next.tables.length === before) {
      throw new WebMcpInputError('not_found', `Table ${tableName} does not exist.`);
    }
  }

  const addTables = input.addTables ?? [];
  if (!Array.isArray(addTables) || addTables.length > 10) {
    throw new WebMcpInputError('invalid_input', 'addTables must contain at most 10 tables.');
  }
  addTables.forEach((table, index) => next.tables.push(parseTable(table, `addTables[${index}]`)));

  const upsertColumns = input.upsertColumns ?? [];
  if (!Array.isArray(upsertColumns) || upsertColumns.length > 50) {
    throw new WebMcpInputError('invalid_input', 'upsertColumns must contain at most 50 entries.');
  }
  upsertColumns.forEach((change, index) => {
    if (!isRecord(change)) {
      throw new WebMcpInputError('invalid_input', `upsertColumns[${index}] must be an object.`);
    }
    assertOnlyKeys(change, ['table', 'column'], `upsertColumns[${index}]`);
    const tableName = readString(change.table, `upsertColumns[${index}].table`, 64, {
      name: true,
    }) as string;
    const table = next.tables.find(candidate => candidate.name === tableName);
    if (!table) throw new WebMcpInputError('not_found', `Table ${tableName} does not exist.`);
    const column = parseColumn(change.column, `upsertColumns[${index}].column`);
    const columnIndex = table.columns.findIndex(candidate => candidate.name === column.name);
    if (columnIndex >= 0) table.columns[columnIndex] = column;
    else table.columns.push(column);
  });

  const removeColumns = input.removeColumns ?? [];
  if (!Array.isArray(removeColumns) || removeColumns.length > 50) {
    throw new WebMcpInputError('invalid_input', 'removeColumns must contain at most 50 entries.');
  }
  removeColumns.forEach((change, index) => {
    if (!isRecord(change)) {
      throw new WebMcpInputError('invalid_input', `removeColumns[${index}] must be an object.`);
    }
    assertOnlyKeys(change, ['table', 'column'], `removeColumns[${index}]`);
    const tableName = readString(change.table, `removeColumns[${index}].table`, 64, {
      name: true,
    }) as string;
    const columnName = readString(change.column, `removeColumns[${index}].column`, 64, {
      name: true,
    }) as string;
    const table = next.tables.find(candidate => candidate.name === tableName);
    if (!table) throw new WebMcpInputError('not_found', `Table ${tableName} does not exist.`);
    const before = table.columns.length;
    table.columns = table.columns.filter(column => column.name !== columnName);
    if (table.columns.length === before) {
      throw new WebMcpInputError('not_found', `Column ${tableName}.${columnName} does not exist.`);
    }
  });

  if (next.tables.length < 1 || next.tables.length > 25) {
    throw new WebMcpInputError('invalid_input', 'The schema must contain 1 to 25 tables.');
  }
  next.tables.forEach((table, index) => {
    if (table.columns.length < 1 || !table.columns.some(column => column.isPrimaryKey)) {
      throw new WebMcpInputError(
        'invalid_input',
        `tables[${index}] must retain at least one column and one primary key.`
      );
    }
  });
  validateSchema(next);
  return next;
}

/**
 *
 */
export function parseSampleData(input: unknown, schema: Schema | null): string {
  if (!schema)
    throw new WebMcpInputError('no_schema', 'Create a schema before setting sample data.');
  if (!isRecord(input)) throw new WebMcpInputError('invalid_input', 'Input must be an object.');
  assertOnlyKeys(input, ['data'], 'input');
  if (!isRecord(input.data)) {
    throw new WebMcpInputError('invalid_input', 'data must be an object keyed by table name.');
  }
  if (Object.keys(input.data).length > 25) {
    throw new WebMcpInputError('invalid_input', 'data can contain at most 25 tables.');
  }
  let totalRows = 0;
  for (const [tableName, rows] of Object.entries(input.data)) {
    const table = schema.tables.find(candidate => candidate.name === tableName);
    if (!table) throw new WebMcpInputError('not_found', `Table ${tableName} does not exist.`);
    if (!Array.isArray(rows)) {
      throw new WebMcpInputError('invalid_input', `data.${tableName} must be an array.`);
    }
    totalRows += rows.length;
    if (rows.length > 1000 || totalRows > 1000) {
      throw new WebMcpInputError('invalid_input', 'Sample data is limited to 1000 total rows.');
    }
    const columnNames = new Set(table.columns.map(column => column.name));
    rows.forEach((row, rowIndex) => {
      if (!isRecord(row)) {
        throw new WebMcpInputError(
          'invalid_input',
          `data.${tableName}[${rowIndex}] must be an object.`
        );
      }
      if (Object.keys(row).length > 100) {
        throw new WebMcpInputError(
          'invalid_input',
          `data.${tableName}[${rowIndex}] has too many fields.`
        );
      }
      for (const [field, value] of Object.entries(row)) {
        if (!columnNames.has(field)) {
          throw new WebMcpInputError(
            'invalid_input',
            `${tableName}.${field} is not in the schema.`
          );
        }
        if (value !== null && !['string', 'number', 'boolean'].includes(typeof value)) {
          throw new WebMcpInputError(
            'invalid_input',
            `${tableName}.${field} must be a string, number, boolean, or null.`
          );
        }
      }
    });
  }
  const serialized = JSON.stringify(input.data, null, 2);
  if (serialized.length > MAX_SAMPLE_DATA_CHARS) {
    throw new WebMcpInputError(
      'invalid_input',
      'Serialized sample data exceeds 250,000 characters.'
    );
  }
  return serialized;
}

/**
 *
 */
function quoteIdentifier(identifier: string, dialect: SQLDialect): string {
  const quote = dialect === 'MySQL' ? '`' : '"';
  return `${quote}${identifier.replaceAll(quote, quote + quote)}${quote}`;
}

/**
 *
 */
function safeSqlType(rawType: string, dialect: SQLDialect): string {
  const normalized = rawType.trim().replace(/\s+/g, ' ').toUpperCase();
  const safePatterns = [
    /^(?:SMALLINT|INTEGER|INT|BIGINT|SERIAL|BIGSERIAL|REAL|DOUBLE PRECISION)$/,
    /^(?:DECIMAL|NUMERIC)\(\d{1,3}(?:,\s*\d{1,3})?\)$/,
    /^(?:CHAR|VARCHAR)\(\d{1,5}\)$/,
    /^(?:TEXT|BOOLEAN|BOOL|DATE|TIME|TIMESTAMP|TIMESTAMP WITH TIME ZONE|TIMESTAMP WITHOUT TIME ZONE)$/,
    /^(?:JSON|JSONB|UUID|BYTEA|BLOB)$/,
  ];
  if (safePatterns.some(pattern => pattern.test(normalized))) return normalized;
  if (normalized === 'STRING') return dialect === 'MySQL' ? 'TEXT' : 'TEXT';
  if (normalized === 'NUMBER') return dialect === 'MySQL' ? 'DOUBLE' : 'DOUBLE PRECISION';
  return 'TEXT';
}

/**
 *
 */
export function generateDeterministicSql(schema: Schema, dialect: SQLDialect): string {
  return schema.tables
    .map(table => {
      const columns = table.columns.map(column => {
        const parts = [
          `  ${quoteIdentifier(column.name, dialect)}`,
          safeSqlType(column.type, dialect),
        ];
        if (column.isPrimaryKey) parts.push('PRIMARY KEY');
        if (column.foreignKeyTo) {
          parts.push(
            `REFERENCES ${quoteIdentifier(column.foreignKeyTo.table, dialect)} (${quoteIdentifier(column.foreignKeyTo.column, dialect)})`
          );
        }
        return parts.join(' ');
      });
      return `CREATE TABLE ${quoteIdentifier(table.name, dialect)} (\n${columns.join(',\n')}\n);`;
    })
    .join('\n\n');
}

/**
 *
 */
export function countRows(serializedData: string | null): Record<string, number> {
  if (!serializedData) return {};
  try {
    const parsed: unknown = JSON.parse(serializedData);
    if (!isRecord(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([table, rows]) => [table, Array.isArray(rows) ? rows.length : 0])
    );
  } catch {
    return {};
  }
}

/**
 *
 */
export function invalidateDerivedArtifacts(dispatch: Dispatch<AppAction>): void {
  dispatch({ type: 'SET_GENERATED_SQL', payload: null });
  dispatch({ type: 'SET_GENERATED_STORIES', payload: null });
  dispatch({ type: 'SET_GENERATED_DOCS', payload: null });
  dispatch({ type: 'SET_GENERATED_TESTS', payload: null });
  dispatch({ type: 'SET_GENERATED_SAMPLE_DATA', payload: null });
  dispatch({ type: 'SET_VISUALIZATION_SPEC', payload: null });
  dispatch({ type: 'SET_VISUALIZATION_SOURCES', payload: null });
  dispatch({ type: 'SET_CHART_SUGGESTIONS', payload: null });
}

/**
 *
 */
export function summarizeState(state: AppState): Record<string, unknown> {
  const rowCounts = countRows(state.generatedSampleData);
  return {
    ok: true,
    activeTab: state.activeTab,
    dialect: state.sqlDialect,
    schema: state.schema,
    tableCount: state.schema?.tables.length ?? 0,
    columnCount: state.schema?.tables.reduce((sum, table) => sum + table.columns.length, 0) ?? 0,
    sampleData: {
      available: state.generatedSampleData !== null,
      rowCounts,
      totalRows: Object.values(rowCounts).reduce((sum, count) => sum + count, 0),
    },
    artifacts: {
      sql: state.generatedSql !== null,
      userStories: state.generatedUserStories !== null,
      apiDocs: state.generatedApiDocs !== null,
      testCases: state.generatedTestCases !== null,
    },
  };
}
