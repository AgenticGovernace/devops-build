import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('provider-neutral AI browser client', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('defaults to Gemini and sends only provider-neutral request data', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ provider: 'gemini', model: 'gemini-2.5-flash', text: 'done' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
    vi.stubGlobal('fetch', fetchMock);
    const { requestAI } = await import('../services/aiProvider');

    await expect(requestAI({ prompt: 'Build a schema' })).resolves.toMatchObject({
      provider: 'gemini',
      text: 'done',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/ai',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ prompt: 'Build a schema', provider: 'gemini' }),
      })
    );
  });

  it('exposes the deployment provider default', async () => {
    const { getDefaultAIProvider } = await import('../services/aiProvider');
    expect(getDefaultAIProvider()).toBe('gemini');
  });

  it('rejects malformed provider citations before the UI can consume them', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            provider: 'openai',
            model: 'operator-model',
            text: 'done',
            sources: [{ title: 'missing URL' }],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    const { requestAI } = await import('../services/aiProvider');

    await expect(requestAI({ prompt: 'Hello', provider: 'openai' })).rejects.toThrow(
      'invalid source citations'
    );
  });

  it('returns a safe gateway error without requiring a provider SDK', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'openai is not configured for this deployment.' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    const { requestAI } = await import('../services/aiProvider');

    await expect(requestAI({ prompt: 'Hello', provider: 'openai' })).rejects.toThrow(
      'openai is not configured for this deployment.'
    );
  });
});
