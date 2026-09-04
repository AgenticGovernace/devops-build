import type { AppAction, AppState } from '../types';
import type { Dispatch } from 'react';

export interface JsonSchema {
  [key: string]: unknown;
}

export interface WebMcpToolAnnotations {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
  consequentialHint?: boolean;
}

export interface WebMcpExecuteOptions {
  signal?: AbortSignal;
}

export interface WebMcpTool {
  name: string;
  title?: string;
  description: string;
  inputSchema: JsonSchema;
  annotations?: WebMcpToolAnnotations;
  execute: (
    input: Record<string, unknown>,
    options?: WebMcpExecuteOptions
  ) => unknown | Promise<unknown>;
}

export interface WebMcpModelContext {
  registerTool: (
    tool: WebMcpTool,
    options?: { signal?: AbortSignal; exposedTo?: string[] }
  ) => void | Promise<void>;
  // Some early implementations expose an explicit unregister method. The
  // current draft uses the registration AbortSignal instead.
  unregisterTool?: (name: string) => void | Promise<void>;
}

export interface WebMcpAdapter {
  getState: () => AppState;
  dispatch: Dispatch<AppAction>;
}

export type WebMcpDocument = Document & { modelContext?: WebMcpModelContext };
