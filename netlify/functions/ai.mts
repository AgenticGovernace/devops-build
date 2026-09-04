/**
 * Provider-neutral Netlify AI gateway.
 *
 * Secrets are read exclusively from Netlify.env and are never returned to the
 * browser. Upstream failures are deliberately normalized to avoid leaking
 * provider response bodies or request details.
 */

import type { Config } from '@netlify/functions';

type AiProvider = 'gemini' | 'openai' | 'anthropic';

interface AiRequest {
  prompt: string;
  system?: string;
  provider?: AiProvider;
  temperature?: number;
}

interface AiSource {
  title?: string;
  url: string;
}

interface AiResult {
  provider: AiProvider;
  model: string;
  text: string;
  sources?: AiSource[];
}

interface NetlifyEnvironment {
  get(name: string): string | undefined;
}

declare const Netlify: { env: NetlifyEnvironment };

export const config: Config = {
  path: '/api/ai',
  rateLimit: {
    windowLimit: 12,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};

const MAX_BODY_LENGTH = 64_000;
const MAX_PROMPT_LENGTH = 32_000;
const MAX_SYSTEM_LENGTH = 16_000;
const MAX_RESPONSE_LENGTH = 100_000;
const MAX_OUTPUT_TOKENS = 4096;
const UPSTREAM_TIMEOUT_MS = 45_000;
const PROVIDERS = new Set<AiProvider>(['gemini', 'openai', 'anthropic']);

class RequestError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

function json(payload: unknown, status = 200): Response {
  return Response.json(payload, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function env(name: string): string | undefined {
  const value = Netlify.env.get(name)?.trim();
  return value || undefined;
}

function requireEnv(name: string, provider: AiProvider): string {
  const value = env(name);
  if (!value) {
    throw new RequestError(`${provider} is not configured for this deployment.`, 503);
  }
  return value;
}

function validateRequest(
  value: unknown
): Required<Pick<AiRequest, 'prompt' | 'provider'>> & AiRequest {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new RequestError('Request body must be a JSON object.', 400);
  }

  const request = value as AiRequest;
  const provider = request.provider ?? 'gemini';
  if (!PROVIDERS.has(provider)) throw new RequestError('Unsupported AI provider.', 400);

  if (typeof request.prompt !== 'string' || request.prompt.trim().length === 0) {
    throw new RequestError('A non-empty prompt is required.', 400);
  }
  if (request.prompt.length > MAX_PROMPT_LENGTH) {
    throw new RequestError(`Prompt must be at most ${MAX_PROMPT_LENGTH} characters.`, 413);
  }
  if (request.system !== undefined && typeof request.system !== 'string') {
    throw new RequestError('System instructions must be text.', 400);
  }
  if ((request.system?.length ?? 0) > MAX_SYSTEM_LENGTH) {
    throw new RequestError(
      `System instructions must be at most ${MAX_SYSTEM_LENGTH} characters.`,
      413
    );
  }
  if (
    request.temperature !== undefined &&
    (typeof request.temperature !== 'number' ||
      !Number.isFinite(request.temperature) ||
      request.temperature < 0 ||
      request.temperature > 2)
  ) {
    throw new RequestError('Temperature must be a number between 0 and 2.', 400);
  }

  return { ...request, prompt: request.prompt.trim(), provider };
}

async function readRequest(request: Request): Promise<ReturnType<typeof validateRequest>> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';
  if (!contentType.startsWith('application/json')) {
    throw new RequestError('Content-Type must be application/json.', 415);
  }

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_LENGTH) {
    throw new RequestError('Request body is too large.', 413);
  }

  const body = await request.text();
  if (body.length > MAX_BODY_LENGTH) throw new RequestError('Request body is too large.', 413);

  try {
    return validateRequest(JSON.parse(body));
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError('Request body must contain valid JSON.', 400);
  }
}

async function upstreamJson(url: string, init: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
  } catch {
    throw new RequestError('The selected AI provider is temporarily unavailable.', 502);
  }

  if (!response.ok) {
    throw new RequestError('The selected AI provider rejected the request.', 502);
  }

  try {
    return await response.json();
  } catch {
    throw new RequestError('The selected AI provider returned an invalid response.', 502);
  }
}

function normalizedResult(
  provider: AiProvider,
  model: string,
  text: unknown,
  sources?: AiSource[]
): AiResult {
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new RequestError('The selected AI provider returned no text.', 502);
  }

  return {
    provider,
    model,
    text: text.slice(0, MAX_RESPONSE_LENGTH),
    ...(sources?.length ? { sources } : {}),
  };
}

function uniqueSources(sources: AiSource[]): AiSource[] {
  return [
    ...new Map(
      sources.filter(source => /^https?:\/\//.test(source.url)).map(source => [source.url, source])
    ).values(),
  ].slice(0, 20);
}

async function callGemini(request: ReturnType<typeof validateRequest>): Promise<AiResult> {
  const apiKey = requireEnv('GEMINI_API_KEY', 'gemini');
  const model = env('GEMINI_MODEL') ?? 'gemini-2.5-flash';
  const payload = (await upstreamJson(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
        ...(request.system ? { systemInstruction: { parts: [{ text: request.system }] } } : {}),
        ...(request.temperature !== undefined
          ? {
              generationConfig: {
                temperature: request.temperature,
                maxOutputTokens: MAX_OUTPUT_TOKENS,
              },
            }
          : { generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS } }),
      }),
    }
  )) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      groundingMetadata?: { groundingChunks?: Array<{ web?: { uri?: string; title?: string } }> };
    }>;
  };

  const candidate = payload.candidates?.[0];
  const text = candidate?.content?.parts?.map(part => part.text ?? '').join('');
  const sources = uniqueSources(
    (candidate?.groundingMetadata?.groundingChunks ?? []).flatMap(chunk =>
      chunk.web?.uri ? [{ url: chunk.web.uri, title: chunk.web.title }] : []
    )
  );
  return normalizedResult('gemini', model, text, sources);
}

async function callOpenAi(request: ReturnType<typeof validateRequest>): Promise<AiResult> {
  const apiKey = requireEnv('OPENAI_API_KEY', 'openai');
  const model = requireEnv('OPENAI_MODEL', 'openai');
  const payload = (await upstreamJson('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: request.prompt,
      ...(request.system ? { instructions: request.system } : {}),
      max_output_tokens: MAX_OUTPUT_TOKENS,
      ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
    }),
  })) as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: string;
        annotations?: Array<{ type?: string; url?: string; title?: string }>;
      }>;
    }>;
  };

  const content = (payload.output ?? []).flatMap(item => item.content ?? []);
  const text =
    payload.output_text ??
    content
      .filter(item => item.type === 'output_text')
      .map(item => item.text ?? '')
      .join('');
  const sources = uniqueSources(
    content.flatMap(item =>
      (item.annotations ?? []).flatMap(annotation =>
        annotation.url ? [{ url: annotation.url, title: annotation.title }] : []
      )
    )
  );
  return normalizedResult('openai', model, text, sources);
}

async function callAnthropic(request: ReturnType<typeof validateRequest>): Promise<AiResult> {
  const apiKey = requireEnv('ANTHROPIC_API_KEY', 'anthropic');
  const model = requireEnv('ANTHROPIC_MODEL', 'anthropic');
  const payload = (await upstreamJson('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_OUTPUT_TOKENS,
      messages: [{ role: 'user', content: request.prompt }],
      ...(request.system ? { system: request.system } : {}),
    }),
  })) as {
    content?: Array<{
      type?: string;
      text?: string;
      citations?: Array<{ url?: string; title?: string; cited_text?: string }>;
    }>;
  };

  const content = payload.content ?? [];
  const text = content
    .filter(item => item.type === 'text')
    .map(item => item.text ?? '')
    .join('');
  const sources = uniqueSources(
    content.flatMap(item =>
      (item.citations ?? []).flatMap(citation =>
        citation.url ? [{ url: citation.url, title: citation.title }] : []
      )
    )
  );
  return normalizedResult('anthropic', model, text, sources);
}

async function route(request: ReturnType<typeof validateRequest>): Promise<AiResult> {
  switch (request.provider) {
    case 'gemini':
      return callGemini(request);
    case 'openai':
      return callOpenAi(request);
    case 'anthropic':
      return callAnthropic(request);
  }
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405);
  }

  try {
    return json(await route(await readRequest(request)));
  } catch (error) {
    if (error instanceof RequestError) return json({ error: error.message }, error.status);
    return json({ error: 'The AI request could not be completed.' }, 500);
  }
}
