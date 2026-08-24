import { describe, expect, it } from 'vitest';
import { TokenMeter } from '@lab/observability';
import { loadEnv } from '@lab/validation';
import { createAIProvider } from './factory.js';

const testEnv = (values: Record<string, string>) => values as unknown as NodeJS.ProcessEnv;

const mockEnv = loadEnv(testEnv({ SESSION_SECRET: 'a-sufficiently-long-secret-value' }));

describe('createAIProvider', () => {
  it('returns an instrumented mock provider by default', () => {
    const provider = createAIProvider({ env: mockEnv });
    expect(provider.mode).toBe('mock');
    expect(provider.name).toContain('mock');
  });

  it('records token usage through the shared meter', async () => {
    const meter = new TokenMeter();
    const provider = createAIProvider({ env: mockEnv, meter });
    await provider.generateText({
      task: 'demo',
      messages: [{ role: 'user', content: 'hello there' }],
    });
    expect(meter.snapshot().calls).toBe(1);
    expect(meter.snapshot().totalTokens).toBeGreaterThan(0);
  });

  it('refuses to call once the budget is spent', async () => {
    const meter = new TokenMeter(1);
    const provider = createAIProvider({ env: mockEnv, meter });
    await provider.generateText({ task: 'demo', messages: [{ role: 'user', content: 'hello' }] });
    await expect(
      provider.generateText({ task: 'demo', messages: [{ role: 'user', content: 'again' }] }),
    ).rejects.toMatchObject({ code: 'AI_BUDGET_EXCEEDED' });
  });
});
