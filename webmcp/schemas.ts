import type { JsonSchema } from './types';

const nameSchema = {
  type: 'string',
  minLength: 1,
  maxLength: 64,
  pattern: '^[A-Za-z_][A-Za-z0-9_ -]*$',
} as const;

const columnSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'type'],
  properties: {
    name: nameSchema,
    type: { type: 'string', minLength: 1, maxLength: 64 },
    description: { type: 'string', minLength: 1, maxLength: 300 },
    isPrimaryKey: { type: 'boolean' },
    isForeignKey: { type: 'boolean' },
    foreignKeyTo: {
      type: 'object',
      additionalProperties: false,
      required: ['table', 'column'],
      properties: { table: nameSchema, column: nameSchema },
    },
  },
} as const;

const tableSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'columns'],
  properties: {
    name: nameSchema,
    description: { type: 'string', minLength: 1, maxLength: 300 },
    columns: { type: 'array', minItems: 1, maxItems: 100, items: columnSchema },
  },
} as const;

export const emptyInputSchema: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {},
};

export const createSchemaInputSchema: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['tables'],
  properties: {
    description: { type: 'string', minLength: 1, maxLength: 500 },
    tables: { type: 'array', minItems: 1, maxItems: 25, items: tableSchema },
  },
};

export const applySchemaChangesInputSchema: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    description: { type: 'string', minLength: 1, maxLength: 500 },
    addTables: { type: 'array', maxItems: 10, items: tableSchema },
    removeTables: { type: 'array', maxItems: 10, items: nameSchema },
    upsertColumns: {
      type: 'array',
      maxItems: 50,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['table', 'column'],
        properties: { table: nameSchema, column: columnSchema },
      },
    },
    removeColumns: {
      type: 'array',
      maxItems: 50,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['table', 'column'],
        properties: { table: nameSchema, column: nameSchema },
      },
    },
  },
  anyOf: [
    { required: ['description'] },
    { required: ['addTables'] },
    { required: ['removeTables'] },
    { required: ['upsertColumns'] },
    { required: ['removeColumns'] },
  ],
};

export const setSampleDataInputSchema: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      maxProperties: 25,
      additionalProperties: {
        type: 'array',
        maxItems: 1000,
        items: {
          type: 'object',
          maxProperties: 100,
          additionalProperties: {
            type: ['string', 'number', 'boolean', 'null'],
          },
        },
      },
    },
  },
};

export const exportProjectInputSchema: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    dialect: { type: 'string', enum: ['PostgreSQL', 'MySQL'] },
    includeSampleData: { type: 'boolean', default: true },
  },
};
