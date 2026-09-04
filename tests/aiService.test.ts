import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requestAI } = vi.hoisted(() => ({ requestAI: vi.fn() }));

vi.mock('../services/aiProvider', () => ({
  requestAI,
  /**
   *
   */
  getDefaultAIProvider: () => 'gemini',
}));

const schema = {
  tables: [{ name: 'Users', columns: [{ name: 'id', type: 'INT', isPrimaryKey: true }] }],
};

describe('provider-neutral AI domain service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads without making an AI request', async () => {
    await expect(import('../services/aiService')).resolves.toBeDefined();
    expect(requestAI).not.toHaveBeenCalled();
  });

  it('routes generation through the explicitly selected provider', async () => {
    requestAI.mockResolvedValue({
      provider: 'openai',
      model: 'operator-model',
      text: 'CREATE TABLE Users (id INT);',
    });
    const { generateSql } = await import('../services/aiService');

    await expect(generateSql(schema, 'PostgreSQL', 'openai')).resolves.toBe(
      'CREATE TABLE Users (id INT);'
    );
    expect(requestAI).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'openai', temperature: 0.1 })
    );
  });

  it('keeps Gemini as the backward-compatible default provider', async () => {
    requestAI.mockResolvedValue({
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      text: 'CREATE TABLE Users (id INT);',
    });
    const { generateSql } = await import('../services/aiService');

    await generateSql(schema, 'PostgreSQL');
    expect(requestAI).toHaveBeenCalledWith(expect.objectContaining({ provider: 'gemini' }));
  });
});
