/**
 * @fileoverview Application-wide constants, default values, and AI prompt templates.
 *
 * This file centralizes all configuration constants used throughout the application,
 * including default chat histories, sample data configuration, and comprehensive
 * prompt templates for AI-powered code generation features.
 *
 * @module constants
 * @category Configuration
 */

import type { Schema, ChatMessage } from './types';

/**
 * Initial conversation history preloaded when the application starts.
 * Provides an example prompt to guide users on the expected input format.
 *
 * @constant {ChatMessage[]}
 */
export const INITIAL_CHAT_HISTORY: ChatMessage[] = [
    { role: 'user', text: 'Create a schema for a grant application system with applicants, reviewers, grants, and scores.' }
];

/**
 * Default prompt text for sample data generation criteria.
 * Instructs the AI to maintain referential integrity across tables.
 *
 * @constant {string}
 */
export const DEFAULT_SAMPLE_DATA_PROMPT = 'Generate realistic entries for each table, ensuring foreign keys are consistent.';

/**
 * Default number of rows to generate for each table in sample data.
 * Stored as a string for direct binding to number input fields.
 *
 * @constant {string}
 */
export const DEFAULT_SAMPLE_DATA_ROW_COUNT = '10';

/**
 * Example schema structure embedded in AI prompts to guide response formatting.
 * Demonstrates a simple blog application with Users and Posts tables.
 *
 * @constant {Schema}
 * @private
 */
const exampleSchema: Schema = {
  description: "A simple schema for a blog application with users and their posts.",
  tables: [
    {
      name: "Users",
      description: "Stores user account information.",
      columns: [
        { name: "UserID", type: "INT", description: "Unique identifier for the user.", isPrimaryKey: true },
        { name: "Username", type: "VARCHAR(50)", description: "User's unique username." },
        { name: "Email", type: "VARCHAR(100)", description: "User's email address." },
        { name: "CreatedAt", type: "TIMESTAMP", description: "Timestamp of account creation." }
      ]
    },
    {
      name: "Posts",
      description: "Stores blog posts created by users.",
      columns: [
        { name: "PostID", type: "INT", description: "Unique identifier for the post.", isPrimaryKey: true },
        { name: "AuthorID", type: "INT", description: "FK to the Users table.", isForeignKey: true, foreignKeyTo: { table: "Users", column: "UserID" } },
        { name: "Title", type: "VARCHAR(255)", description: "The title of the post." },
        { name: "Content", type: "TEXT", description: "The main body of the post." },
        { name: "PublishedAt", type: "TIMESTAMP", description: "Timestamp of when the post was published." }
      ]
    }
  ]
};

/**
 * System prompt for initial database schema generation via Gemini AI.
 *
 * Instructs the AI to act as a database architect and generate a valid JSON schema
 * conforming to the application's TypeScript interfaces. Includes:
 * - Interface definitions for Column, Table, and Schema
 * - Example schema output (blog application)
 * - Requirements for standard SQL types and foreign key relationships
 * - JSON formatting constraints (no markdown fences or extra text)
 *
 * @constant {string}
 */
export const SCHEMA_GENERATION_PROMPT = `
You are an expert database architect. Your task is to generate a database schema based on a user's request.
The output MUST be a valid JSON object that strictly adheres to the following TypeScript interface:

export interface Column {
  name: string;
  type: string; // e.g., INT, VARCHAR(255), TEXT, TIMESTAMP, BOOLEAN, DECIMAL(10, 2)
  description?: string;
  isPrimaryKey?: boolean; // true if this column is the primary key
  isForeignKey?: boolean; // true if this column is a foreign key
  foreignKeyTo?: {
    table: string; // The table this foreign key references
    column: string; // The column this foreign key references
  };
}

export interface Table {
  name: string;
  description?: string;
  columns: Column[];
}

export interface Schema {
  description?: string; // A high-level overview of the database schema's purpose.
  tables: Table[];
}

Here is an example of a valid JSON output for a simple blog:
${JSON.stringify(exampleSchema, null, 2)}

- ALWAYS use standard SQL data types.
- Ensure every table has a primary key.
- Correctly identify relationships and define foreign keys.
- Include a high-level 'description' field for the schema itself, explaining its purpose.
- Do NOT include any text, explanations, or markdown formatting (like \`\`\`json) outside of the main JSON object. The entire response must be the JSON object itself.

Now, generate a schema for the following request:
`;

/**
 * System prompt for refining an existing database schema via Gemini AI.
 *
 * Allows users to iteratively modify a generated schema using natural language.
 * The AI receives:
 * - The current schema as JSON
 * - Full conversation history for context
 * - The latest refinement request
 *
 * Output must be a complete updated schema maintaining referential integrity.
 *
 * @constant {string}
 * @note Contains placeholders {chat_history} for runtime substitution
 */
export const SCHEMA_REFINEMENT_PROMPT = `
You are an expert database architect. Your task is to refine an existing database schema based on a user's request.
The user will provide the current schema as a JSON object and a text prompt with instructions for changes.
You MUST output a new, valid JSON object that reflects the requested changes and strictly adheres to the following TypeScript interface:

export interface Column {
  name: string;
  type: string;
  description?: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  foreignKeyTo?: { table: string; column: string; };
}

export interface Table {
  name: string;
  description?: string;
  columns: Column[];
}

export interface Schema {
  description?: string;
  tables: Table[];
}

- Analyze the current schema and the user's request carefully, using the conversation history for full context.
- Apply the changes logically (e.g., adding/removing columns, renaming tables, changing types).
- Ensure the entire new schema is valid. Every table must still have a primary key. Foreign key relationships should be maintained or updated correctly.
- Do NOT include any text, explanations, or markdown formatting (like \`\`\`json) outside of the main JSON object. The entire response must be the JSON object itself.

Conversation History (for context):
---
{chat_history}
---

Current Schema:
`;

/**
 * System prompt for generating SQL CREATE TABLE statements from a schema.
 *
 * Converts the JSON schema representation into executable SQL DDL statements
 * for the specified dialect (PostgreSQL or MySQL). Includes:
 * - Primary key constraints
 * - Foreign key constraints with ON DELETE CASCADE
 * - Standard SQL syntax compatible with the target dialect
 *
 * @constant {string}
 */
export const SQL_GENERATION_PROMPT = `
You are an expert SQL developer. Based on the following JSON schema representation, generate the corresponding SQL 'CREATE TABLE' statements for the specified dialect.
- Use standard SQL syntax that is compatible with the requested dialect.
- Include primary key constraints.
- Include foreign key constraints with ON DELETE CASCADE.
- The SQL should be well-formatted.
- Do not include any explanations, only the raw SQL code.
`;

/**
 * System prompt for generating user stories from a database schema.
 *
 * Creates product backlog-style user stories based on the implied functionality
 * of the database schema. Stories follow the format:
 * "As a [role], I want to [action] so that [benefit]."
 *
 * Critical: Each story must be prefixed with '###' for parsing and collapsible UI rendering.
 *
 * @constant {string}
 */
export const USER_STORIES_PROMPT = `
You are an expert product manager. Based on the following JSON schema representation for a software application, generate a list of user stories in Markdown format.
- The stories should cover the main functionalities implied by the schema.
- Use the format: "As a [user role], I want to [action] so that [benefit]."
- Group stories by feature or table where applicable.
- **Crucially, format each individual story with a level 3 Markdown header (###).** For example: '### As a user, I want to log in.' This formatting is essential for parsing.
- The output should be clear, concise, and ready for a development team's backlog.

JSON Schema:
`;

/**
 * System prompt for generating RESTful API documentation from a schema.
 *
 * Creates OpenAPI/Swagger-style documentation with:
 * - CRUD endpoints for each table (GET, POST, PUT, DELETE)
 * - Request/response body examples in JSON
 * - Path parameters and query strings
 * - Markdown formatting for readability
 *
 * @constant {string}
 */
export const API_DOCS_PROMPT = `
You are an expert backend engineer. Based on the following JSON schema, generate API documentation in Markdown format.
- For each table, create basic CRUD (Create, Read, Update, Delete) endpoints.
- Use an OpenAPI/Swagger-like structure. Define paths, methods (GET, POST, PUT, DELETE), parameters, and example request/response bodies in JSON format.
- The documentation should be clear and ready for a developer to implement the API.
- Use Markdown formatting (headers, code blocks for JSON examples, etc.).
- Do not include any explanations, only the raw Markdown documentation.

JSON Schema:
`;

/**
 * System prompt for generating Gherkin-format test cases from a schema.
 *
 * Creates BDD-style test scenarios using Gherkin syntax:
 * - Feature, Scenario, Given, When, Then keywords
 * - Coverage of CRUD operations for each table
 * - Edge cases and validation scenarios
 * - Format suitable for Cucumber/SpecFlow execution
 *
 * @constant {string}
 */
export const TEST_CASES_PROMPT = `
You are an expert QA engineer. Based on the following JSON schema, generate a set of basic test cases in Gherkin format.
- The test cases should cover the main CRUD (Create, Read, Update, Delete) functionalities for each table.
- Use the 'Feature', 'Scenario', 'Given', 'When', 'Then' keywords.
- Write clear, concise, and actionable test scenarios.
- Format the output as plain text or Markdown, suitable for a '.feature' file.
- Do not include any explanations, only the raw Gherkin content.

JSON Schema:
`;

/**
 * System prompt for generating realistic sample data from a schema.
 *
 * Produces JSON-formatted sample data with:
 * - Table names as object keys
 * - Arrays of row objects as values
 * - Adherence to data types and constraints
 * - ISO 8601 date formatting for temporal types
 * - Consistent foreign key relationships
 * - Configurable row counts and custom criteria
 *
 * @constant {string}
 */
export const SAMPLE_DATA_PROMPT = `
You are an expert data engineer. Based on the following JSON schema, generate realistic sample data.
- The output MUST be a valid JSON string.
- The JSON should be an object where each key is a table name, and the value is an array of objects representing rows.
- Generate a reasonable number of rows for each table to demonstrate relationships, as specified in the user criteria.
- Adhere to the data types specified in the schema.
- For any column with a date or time data type (like DATETIME, TIMESTAMP, DATE), generate the data as a string in ISO 8601 format (e.g., "YYYY-MM-DDTHH:mm:ssZ"). This is crucial for compatibility.
- Foreign key relationships must be consistent.
- The data should be plausible and reflect the user's criteria.

User Criteria:
`;

/**
 * System prompt for generating Vega-Lite chart specifications from sample data.
 *
 * Creates interactive data visualizations using:
 * - Vega-Lite v5 specification format
 * - Embedded data values from sample dataset
 * - Google Search grounding for accuracy and best practices
 * - Conversation history for iterative refinement
 * - Schema context for understanding data types and relationships
 *
 * Temperature: 1.0 (maximum creativity for visual design)
 *
 * @constant {string}
 * @note Contains placeholders {schema}, {data}, {chat_history} for runtime substitution
 */
export const VISUALIZATION_PROMPT = `
You are an expert data visualization specialist. Your task is to generate or refine a Vega-Lite specification for a chart based on a conversational request.
- **CRITICAL**: The chart will be rendered using Vega-Lite v5. You MUST use your search capabilities to ensure the generated Vega-Lite JSON is valid and uses modern, up-to-date syntax and features according to the latest Vega-Lite v5 specification.
- The output MUST be a valid JSON object representing a Vega-Lite spec, including the '$schema' property pointing to the correct Vega-Lite v5 schema URL (e.g., "https://vega.github.io/schema/vega-lite/v5.json").
- Do NOT include any text, explanations, or markdown formatting (like \`\`\`json) outside of the main JSON object.
- The chart should effectively visualize the provided sample data based on the user's latest request, taking into account the conversation history for context.
- Use the provided schema to understand data types and relationships.
- The data for the chart should be embedded directly in the spec using the 'values' property. The data format is an array of objects.

Schema:
---
{schema}
---

Sample Data (first 5 rows of each table shown for context):
---
{data}
---

Conversation History:
---
{chat_history}
---

Based on the full conversation, generate a new Vega-Lite spec that addresses the last user message.
`;

/**
 * System prompt for generating actionable chart visualization suggestions.
 *
 * Analyzes schema and sample data to recommend 3-4 insightful visualizations.
 * Suggestions are:
 * - Phrased as direct commands for the visualization AI
 * - Context-aware of existing visualization (if any)
 * - Focused on uncovering patterns and relationships in the data
 * - Returned as a JSON array of strings
 *
 * Temperature: 0.6 (balanced creativity and relevance)
 *
 * @constant {string}
 * @note Contains placeholders {schema}, {data}, {current_spec} for runtime substitution
 */
export const CHART_SUGGESTIONS_PROMPT = `
You are an expert data analyst. Your task is to suggest relevant and insightful chart visualizations based on a database schema, sample data, and the current chart (if any).
- Analyze the provided schema and data to understand the entities and their relationships.
- Generate 3-4 concise and actionable chart suggestions. The suggestions should be phrased as commands for a data visualization AI.
- For example: "Create a bar chart showing the count of posts per user", or "Generate a scatter plot of Grant Amount vs. Reviewer Score".
- If a current visualization is provided, suggest refinements or alternative visualizations that could provide more insight.
- The output MUST be a valid JSON object that strictly adheres to the following TypeScript interface:
  { "suggestions": string[] }
- Do NOT include any text, explanations, or markdown formatting outside of the main JSON object.

Schema:
---
{schema}
---

Sample Data (first 5 rows of each table shown for context):
---
{data}
---

Current Visualization Spec (if available):
---
{current_spec}
---

Now, generate your suggestions.
`;