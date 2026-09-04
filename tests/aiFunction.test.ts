import { beforeEach, describe, expect, it, vi } from 'vitest';

const envValues = new Map<string, string>();

describe('provider-neutral Netlify AI function', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    envValues.clear();
    vi.stubGlobal('Netlify', {
      env: { /**
       *
       */
      get: (name: string) => envValues.get(name) },
    });
  });

  /**
   *
   */
  async function invoke(body: unknown, method = 'POST'): Promise<Response> {
    const { default: handler } = await import('../netlify/functions/ai.mts');
    return handler(
      new Request('https://example.test/api/ai', {
        method,
        headers: { 'Content-Type': 'application/json' },
        ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
      })
    );
  }

  it('validates methods, content, and bounded prompts', async () => {
    expect((await invoke({}, 'GET')).status).toBe(405);
    expect((await invoke({ provider: 'unknown', prompt: 'hello' })).status).toBe(400);
    expect((await invoke({ provider: 'gemini', prompt: 'x'.repeat(32_001) })).status).toBe(413);
  });

  it('requires server-side provider configuration without leaking environment values', async () => {
    envValues.set('OPENAI_API_KEY', 'top-secret-value');
    const response = await invoke({ provider: 'openai', prompt: 'hello' });
    const body = await response.text();

    expect(response.status).toBe(503);
    expect(body).toContain('openai is not configured');
    expect(body).not.toContain('top-secret-value');
  });

  it('normalizes OpenAI output and uses the operator-supplied model', async () => {
    envValues.set('OPENAI_API_KEY', 'openai-secret');
    envValues.set('OPENAI_MODEL', 'operator-model');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          output_text: 'normalized answer',
          output: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await invoke({ provider: 'openai', prompt: 'hello' });
    await expect(response.json()).resolves.toEqual({
      provider: 'openai',
      model: 'operator-model',
      text: 'normalized answer',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/responses',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer openai-secret' }),
        body: expect.stringContaining('"max_output_tokens":4096'),
      })
    );
  });

  it('normalizes Anthropic text without returning the API key', async () => {
    envValues.set('ANTHROPIC_API_KEY', 'anthropic-secret');
    envValues.set('ANTHROPIC_MODEL', 'operator-claude-model');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ content: [{ type: 'text', text: 'anthropic answer' }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await invoke({ provider: 'anthropic', prompt: 'hello', temperature: 0.7 });
    const text = await response.text();
    expect(text).toContain('anthropic answer');
    expect(text).not.toContain('anthropic-secret');
    const requestBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(requestBody).toMatchObject({ max_tokens: 4096 });
    expect(requestBody).not.toHaveProperty('temperature');
  });

  it('preserves the existing Gemini model default', async () => {
    envValues.set('GEMINI_API_KEY', 'gemini-secret');
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ candidates: [{ content: { parts: [{ text: 'gemini answer' }] } }] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
    vi.stubGlobal('fetch', fetchMock);

    const response = await invoke({ prompt: 'hello' });
    await expect(response.json()).resolves.toMatchObject({
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      text: 'gemini answer',
    });
    expect(fetchMock.mock.calls[0]?.[0]).not.toContain('gemini-secret');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.not.stringContaining('?key='),
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-goog-api-key': 'gemini-secret' }),
        body: expect.stringContaining('"maxOutputTokens":4096'),
      })
    );
  });
});
