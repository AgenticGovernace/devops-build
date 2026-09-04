/**
 * Provider-neutral browser client for the server-side AI gateway.
 *
 * Provider credentials deliberately never enter this module. The browser only
 * selects a provider and sends the request to the same-origin Netlify function.
 */

import type { AIProvider } from '../types';

export type { AIProvider } from '../types';

export interface AIRequest {
  prompt: string;
  system?: string;
  provider?: AIProvider;
  temperature?: number;
}

export interface AISource {
  title?: string;
  url: string;
}

export interface AIResult {
  provider: AIProvider;
  model: string;
  text: string;
  sources?: AISource[];
}

const PROVIDERS = new Set<AIProvider>(['gemini', 'openai', 'anthropic']);

/**
 *
 */
export function isAIProvider(value: unknown): value is AIProvider {
  return typeof value === 'string' && PROVIDERS.has(value as AIProvider);
}

/**
 *
 */
function configuredProvider(): unknown {
  return (import.meta as ImportMeta & { env?: Record<string, unknown> }).env?.VITE_AI_PROVIDER;
}

/**
 * Resolves the deployment's initial provider selection. The application owns
 * user preference persistence and passes its current selection to requestAI.
 */
export function getDefaultAIProvider(): AIProvider {
  const deploymentDefault = configuredProvider();
  return isAIProvider(deploymentDefault) ? deploymentDefault : 'gemini';
}

/** Sends a provider-neutral request to the same-origin AI gateway. */
export async function requestAI(request: AIRequest, signal?: AbortSignal): Promise<AIResult> {
  if (typeof request.prompt !== 'string' || request.prompt.trim().length === 0) {
    throw new Error('An AI prompt is required.');
  }

  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...request, provider: request.provider ?? getDefaultAIProvider() }),
    signal,
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('The AI service returned an unreadable response.');
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : 'The AI request failed.';
    throw new Error(message);
  }

  if (
    typeof payload !== 'object' ||
    payload === null ||
    !isAIProvider((payload as Partial<AIResult>).provider) ||
    typeof (payload as Partial<AIResult>).model !== 'string' ||
    typeof (payload as Partial<AIResult>).text !== 'string'
  ) {
    throw new Error('The AI service returned an invalid response.');
  }

  const sources = (payload as Partial<AIResult>).sources;
  if (
    sources !== undefined &&
    (!Array.isArray(sources) ||
      sources.some(
        source =>
          typeof source !== 'object' ||
          source === null ||
          typeof source.url !== 'string' ||
          (source.title !== undefined && typeof source.title !== 'string')
      ))
  ) {
    throw new Error('The AI service returned invalid source citations.');
  }

  return payload as AIResult;
}
