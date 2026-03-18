/**
 * @fileoverview Google Gemini AI service integration layer.
 *
 * This module encapsulates all interactions with Google's Gemini AI API for:
 * - Database schema generation and refinement
 * - SQL code generation for multiple dialects
 * - Development artifact generation (user stories, API docs, test cases)
 * - Sample data generation with realistic values
 * - Data visualization specification generation using Vega-Lite
 * - Chart suggestion recommendations
 *
 * All functions use structured prompts from constants.ts and handle JSON parsing,
 * error recovery, and response cleaning.
 *
 * @module services/geminiService
 * @category Services
 * @requires @google/genai
 */

import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import DOMPurify from 'dompurify';
import type { Schema, ChatMessage, UploadedFile, SQLDialect } from '../types';
import {
  SCHEMA_GENERATION_PROMPT,
  SQL_GENERATION_PROMPT,
  USER_STORIES_PROMPT,
  SAMPLE_DATA_PROMPT,
  VISUALIZATION_PROMPT,
  SCHEMA_REFINEMENT_PROMPT,
  CHART_SUGGESTIONS_PROMPT,
  API_DOCS_PROMPT,
  TEST_CASES_PROMPT,
} from '../constants';

if (!process.env.API_KEY) {
  throw new Error('API_KEY environment variable not set');
}

/**
 * Singleton instance of the Google Gemini AI client.
 * Initialized with API key from environment variables.
 *
 * @constant {GoogleGenAI}
 * @private
 */
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const REQUEST_COOLDOWN = 1000; // 1 second
let lastRequestTime = 0;

/**
 *
 */
async function rateLimitedApiCall<T>(apiCall: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < REQUEST_COOLDOWN) {
    const waitTime = REQUEST_COOLDOWN - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
  return apiCall();
}

/**
 * Sanitizes user input to prevent injection attacks.
 *
 * @function sanitizeInput
 * @param {string} input - The user-provided string.
 * @returns {string} The sanitized string.
 * @private
 */
function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input);
}

/**
 * Removes markdown code fence formatting from AI-generated JSON responses.
 *
 * Many LLMs wrap JSON responses in markdown code blocks (```json ... ```).
 * This function strips those wrappers to extract the raw JSON string.
 *
 * @function cleanJsonString
 * @param {string} jsonStr - The potentially wrapped JSON string from AI response.
 * @returns {string} The cleaned JSON string without markdown formatting.
 *
 * @example
 * const cleaned = cleanJsonString('```json\n{"key": "value"}\n```');
 * // Returns: '{"key": "value"}'
 *
 * @private
 */
function cleanJsonString(jsonStr: string): string {
  let cleaned = jsonStr.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = cleaned.match(fenceRegex);
  if (match && match[2]) {
    cleaned = match[2].trim();
  }
  return cleaned;
}

/**
 * Generates a complete database schema from conversational input and uploaded files.
 *
 * Combines chat history and file contents into a comprehensive context, then prompts
 * Gemini AI to generate a structured JSON schema conforming to the Schema interface.
 *
 * @async
 * @function generateSchema
 * @param {ChatMessage[]} chatHistory - Array of conversation messages providing context and requirements.
 * @param {UploadedFile[]} files - Array of uploaded context files (.txt, .md, .json) to inform schema design.
 * @returns {Promise<Schema>} A Promise resolving to the generated Schema object.
 * @throws {Error} If the API request fails or the response cannot be parsed as a valid schema.
 *
 * @example
 * const schema = await generateSchema(
 *   [{ role: 'user', text: 'Create a blog schema with users and posts' }],
 *   [{ name: 'requirements.txt', content: 'Users need authentication...' }]
 * );
 *
 * @see SCHEMA_GENERATION_PROMPT for the full system prompt used
 *
 * Configuration:
 * - Model: gemini-2.5-flash
 * - Temperature: 0.2 (deterministic output)
 * - Response format: application/json (structured output mode)
 */
export const generateSchema = async (
  chatHistory: ChatMessage[],
  files: UploadedFile[]
): Promise<Schema> => {
  return rateLimitedApiCall(async () => {
    let context = '';

    if (files.length > 0) {
      context += 'The user has provided the following files as context:\n\n';
      files.forEach(file => {
        context += `--- FILE: ${file.name} ---\n${sanitizeInput(file.content)}\n\n`;
      });
    }

    context += 'The user has provided the following conversation history:\n\n';
    chatHistory.forEach(message => {
      context += `${message.role.toUpperCase()}: ${sanitizeInput(message.text)}\n`;
    });

    const latestUserPrompt =
      chatHistory.filter(m => m.role === 'user').pop()?.text ||
      'Generate a schema based on the provided context.';

    const fullPrompt = `${SCHEMA_GENERATION_PROMPT}\n${context}\nRequest: "${sanitizeInput(latestUserPrompt)}"`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const cleanedText = cleanJsonString(response.text);

    try {
      const parsedData = JSON.parse(cleanedText);
      if (!parsedData.tables || !Array.isArray(parsedData.tables)) {
        throw new Error("Invalid schema format received from API. 'tables' array is missing.");
      }
      return parsedData as Schema;
    } catch (e) {
      console.error('Failed to parse JSON response:', cleanedText);
      const error = e instanceof Error ? e.message : 'Unknown parsing error';
      throw new Error(`Could not parse the generated schema. Details: ${error}`);
    }
  });
};

/**
 * Iteratively refines an existing schema based on natural language modifications.
 *
 * Uses full conversation history for context and applies the requested changes
 * while maintaining schema integrity (primary keys, foreign key relationships).
 *
 * @async
 * @function refineSchema
 * @param {Schema} currentSchema - The existing schema to be modified.
 * @param {string} prompt - Natural language description of desired changes (e.g., "Add a timestamp column to Users table").
 * @param {ChatMessage[]} chatHistory - Full conversation history for context preservation.
 * @returns {Promise<Schema>} A Promise resolving to the updated Schema object.
 * @throws {Error} If the API request fails or the response cannot be parsed as a valid schema.
 *
 * @example
 * const refinedSchema = await refineSchema(
 *   currentSchema,
 *   'Add a "last_login" TIMESTAMP column to the Users table',
 *   chatHistory
 * );
 *
 * Configuration:
 * - Model: gemini-2.5-flash
 * - Temperature: 0.1 (highly deterministic for precision)
 * - Response format: application/json
 */
export const refineSchema = async (
  currentSchema: Schema,
  prompt: string,
  chatHistory: ChatMessage[]
): Promise<Schema> => {
  return rateLimitedApiCall(async () => {
    const historyText = chatHistory
      .map(m => `${m.role.toUpperCase()}: ${sanitizeInput(m.text)}`)
      .join('\n');
    const promptWithContext = SCHEMA_REFINEMENT_PROMPT.replace('{chat_history}', historyText);
    const fullPrompt = `${promptWithContext}\n${JSON.stringify(currentSchema, null, 2)}\n\nUser Request: "${sanitizeInput(prompt)}"`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const cleanedText = cleanJsonString(response.text);

    try {
      const parsedData = JSON.parse(cleanedText);
      if (!parsedData.tables || !Array.isArray(parsedData.tables)) {
        throw new Error("Invalid schema format received from API. 'tables' array is missing.");
      }
      return parsedData as Schema;
    } catch (e) {
      console.error('Failed to parse JSON response for schema refinement:', cleanedText);
      const error = e instanceof Error ? e.message : 'Unknown parsing error';
      throw new Error(`Could not parse the refined schema. Details: ${error}`);
    }
  });
};

/**
 * Generates SQL CREATE TABLE statements from a schema for a specific dialect.
 *
 * @async
 * @function generateSql
 * @param {Schema} schema - The database schema to convert to SQL.
 * @param {SQLDialect} dialect - Target SQL dialect ('PostgreSQL' or 'MySQL').
 * @returns {Promise<string>} SQL DDL statements with primary and foreign key constraints.
 * @throws {Error} If the API request fails.
 *
 * Configuration:
 * - Model: gemini-2.5-flash
 * - Temperature: 0.1 (deterministic SQL generation)
 */
export const generateSql = async (schema: Schema, dialect: SQLDialect): Promise<string> => {
  return rateLimitedApiCall(async () => {
    const fullPrompt = `${SQL_GENERATION_PROMPT}\n\nDialect: ${dialect}\n\nJSON Schema:\n${JSON.stringify(schema, null, 2)}`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        temperature: 0.1,
      },
    });

    return response.text
      .replace(/```sql\n/g, '')
      .replace(/```/g, '')
      .trim();
  });
};

/**
 * Generates user stories in markdown format from a schema.
 *
 * @async
 * @function generateUserStories
 * @param {Schema} schema - The database schema to base stories on.
 * @returns {Promise<string>} Markdown-formatted user stories with ### headers.
 * Temperature: 0.5 (moderate creativity for story generation)
 */
export const generateUserStories = async (schema: Schema): Promise<string> => {
  return rateLimitedApiCall(async () => {
    const fullPrompt = `${USER_STORIES_PROMPT}\n${JSON.stringify(schema, null, 2)}`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        temperature: 0.5,
      },
    });

    return response.text
      .replace(/```markdown\n/g, '')
      .replace(/```/g, '')
      .trim();
  });
};

/**
 * Generates RESTful API documentation from a schema.
 * @async @param {Schema} schema @returns {Promise<string>} OpenAPI-style markdown documentation.
 * Temperature: 0.3
 */
export const generateApiDocs = async (schema: Schema): Promise<string> => {
  return rateLimitedApiCall(async () => {
    const fullPrompt = `${API_DOCS_PROMPT}\n${JSON.stringify(schema, null, 2)}`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        temperature: 0.3,
      },
    });

    return response.text
      .replace(/```markdown\n/g, '')
      .replace(/```/g, '')
      .trim();
  });
};

/**
 * Generates Gherkin-format BDD test cases from a schema.
 * @async @param {Schema} schema @returns {Promise<string>} Gherkin test scenarios.
 * Temperature: 0.5
 */
export const generateTestCases = async (schema: Schema): Promise<string> => {
  return rateLimitedApiCall(async () => {
    const fullPrompt = `${TEST_CASES_PROMPT}\n${JSON.stringify(schema, null, 2)}`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        temperature: 0.5,
      },
    });

    return response.text
      .replace(/```(gherkin|markdown)?\n/g, '')
      .replace(/```/g, '')
      .trim();
  });
};

/**
 * Generates realistic JSON sample data for all tables in a schema.
 * @async @param {Schema} schema @param {string} prompt - User criteria (row count, realism requirements).
 * @returns {Promise<string>} JSON string with table names as keys and row arrays as values.
 * Temperature: 0.7 (creative data generation)
 */
export const generateSampleData = async (schema: Schema, prompt: string): Promise<string> => {
  return rateLimitedApiCall(async () => {
    const fullPrompt = `${SAMPLE_DATA_PROMPT}\n"${sanitizeInput(prompt)}"\n\nJSON Schema:\n${JSON.stringify(schema, null, 2)}`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    return cleanJsonString(response.text);
  });
};

/**
 * Generates Vega-Lite chart specifications with Google Search grounding.
 * @async
 * @param {Schema} schema @param {string} data - JSON sample data
 * @param {ChatMessage[]} chatHistory - Conversation for iterative refinement.
 * @returns {Promise<{spec: object, sources: {uri: string, title: string}[] | undefined}>}
 * Vega-Lite spec object and grounding source citations.
 * Temperature: 1.0 (maximum creativity for visual design)
 */
export const generateVisualization = async (
  schema: Schema,
  data: string,
  chatHistory: ChatMessage[]
): Promise<{ spec: object; sources: { uri: string; title: string }[] | undefined }> => {
  return rateLimitedApiCall(async () => {
    const dataPreview = JSON.stringify(
      JSON.parse(data),
      (key, value) => {
        if (Array.isArray(value)) {
          return value.slice(0, 25); // Limit array previews to 25 items
        }
        return value;
      },
      2
    );

    const historyText = chatHistory
      .map(m => `${m.role.toUpperCase()}: ${sanitizeInput(m.text)}`)
      .join('\n');

    let fullPrompt = VISUALIZATION_PROMPT.replace('{schema}', JSON.stringify(schema, null, 2));
    fullPrompt = fullPrompt.replace('{data}', dataPreview);
    fullPrompt = fullPrompt.replace('{chat_history}', historyText);

    const dataPart = { text: `\n\nFull data for embedding: \n${data}` };
    const promptPart = { text: fullPrompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [promptPart, dataPart] },
      config: {
        temperature: 1.0,
        tools: [{ googleSearch: {} }],
      },
    });

    const cleanedText = cleanJsonString(response.text);

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = groundingChunks
      ?.map(chunk => chunk.web)
      .filter((web): web is { uri: string; title: string } => !!web && !!web.uri && !!web.title)
      .map(({ uri, title }) => ({ uri, title }));

    try {
      const spec = JSON.parse(cleanedText);
      return { spec, sources };
    } catch (e) {
      console.error('Failed to parse JSON response for visualization:', cleanedText);
      const error = e instanceof Error ? e.message : 'Unknown parsing error';
      throw new Error(`Could not parse the generated Vega-Lite spec. Details: ${error}`);
    }
  });
};

/**
 * Generates 3-4 actionable chart visualization suggestions based on schema and data.
 * @async
 * @param {Schema} schema @param {string} data @param {object | null} [currentSpec] - Current chart for context-aware suggestions.
 * @returns {Promise<string[]>} Array of chart suggestion strings as commands.
 * Temperature: 0.6 (balanced creativity)
 */
export const generateChartSuggestions = async (
  schema: Schema,
  data: string,
  currentSpec?: object | null
): Promise<string[]> => {
  return rateLimitedApiCall(async () => {
    const dataPreview = JSON.stringify(
      JSON.parse(data),
      (key, value) => {
        if (Array.isArray(value)) return value.slice(0, 5);
        return value;
      },
      2
    );

    let fullPrompt = CHART_SUGGESTIONS_PROMPT.replace('{schema}', JSON.stringify(schema, null, 2));
    fullPrompt = fullPrompt.replace('{data}', dataPreview);
    fullPrompt = fullPrompt.replace(
      '{current_spec}',
      currentSpec ? JSON.stringify(currentSpec, null, 2) : 'N/A'
    );

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.6,
      },
    });

    const cleanedText = cleanJsonString(response.text);
    try {
      const parsed = JSON.parse(cleanedText);
      if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
        return parsed.suggestions;
      }
      return [];
    } catch (e) {
      console.error('Failed to parse chart suggestions:', cleanedText, e);
      return []; // Return empty array on failure to avoid crashing the app
    }
  });
};

/**
 * Transforms a schema to a different format (e.g., TypeScript, Prisma).
 * @async
 * @param {Schema} schema - The database schema to transform.
 * @param {string} targetFormat - The target format (e.g., 'TypeScript', 'Prisma').
 * @returns {Promise<string>} The transformed schema as a string.
 * Temperature: 0.1 (deterministic output)
 */
export const transformSchema = async (schema: Schema, targetFormat: string): Promise<string> => {
  return rateLimitedApiCall(async () => {
    const fullPrompt = `Transform the following JSON schema into ${targetFormat} format.\n\nJSON Schema:\n${JSON.stringify(
      schema,
      null,
      2
    )}`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        temperature: 0.1,
      },
    });

    return response.text.trim();
  });
};
