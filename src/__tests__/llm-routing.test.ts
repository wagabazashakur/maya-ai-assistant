import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock memory.getConfig so we can control provider/model at runtime
vi.mock('../core/memory', () => {
  let cfg: any = {};
  return {
    getConfig: () => cfg,
    // helper for tests
    __setConfig: (c: any) => { cfg = c; }
  } as any;
});

describe('LLM provider routing', () => {
  beforeEach(async () => {
    // Reset mocked config for each test by reassigning via the helper
    const mem = await import('../core/memory');
    (mem as any).__setConfig({});
  });

  it('defaults to gemini provider when not configured', async () => {
    const { getLLM } = await import('../core/llm');
    const llm = getLLM();
    expect(llm.name).toBe('gemini');
  });

  it('uses openai provider when configured and returns stubbed responses', async () => {
    const mem = await import('../core/memory');
    (mem as any).__setConfig({ llm_provider: 'openai', llm_model: 'unit-test-model' });
    const { getLLM } = await import('../core/llm');
    const llm = getLLM();
    expect(llm.name).toBe('openai');

    const txt = await llm.generateText({ prompt: 'hello from test' });
    expect(txt).toMatch(/openai-stub|placeholder/i);

    const jsonStr = await llm.generateContentJSON({ prompt: 'json please', schema: {} });
    const payload = JSON.parse(jsonStr);
    expect(payload.provider).toBe('openai-stub');
    expect(payload.model).toBe('unit-test-model');
  });
});
