import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { clearMockHandlers, MockAIProvider, registerMockHandler } from './mock.js';

describe('MockAIProvider', () => {
  const provider = new MockAIProvider();
  beforeEach(() => clearMockHandlers());

  it('is deterministic for the same request', async () => {
    const request = { task: 'demo.text', messages: [{ role: 'user' as const, content: 'hello' }] };
    const a = await provider.generateText(request);
    const b = await provider.generateText(request);
    expect(a.value).toBe(b.value);
  });

  it('abstains by default rather than inventing an answer', async () => {
    const response = await provider.generateText({
      task: 'unregistered.task',
      messages: [{ role: 'user', content: 'what is our refund policy?' }],
    });
    expect(response.value).toContain("I don't have enough information");
  });

  it('uses a registered fixture when one exists', async () => {
    registerMockHandler('demo.text', () => 'fixture answer');
    const response = await provider.generateText({
      task: 'demo.text',
      messages: [{ role: 'user', content: 'x' }],
    });
    expect(response.value).toBe('fixture answer');
  });

  it('validates fixtures against the caller schema', async () => {
    const schema = z.object({ total: z.number() });
    registerMockHandler('demo.structured', () => ({ total: 'not a number' }));
    await expect(
      provider.generateStructured({
        task: 'demo.structured',
        schemaName: 'Demo',
        schema,
        messages: [{ role: 'user', content: 'x' }],
      }),
    ).rejects.toMatchObject({ code: 'AI_INVALID_OUTPUT' });
  });

  it('fails loudly when a structured task has no fixture, instead of guessing', async () => {
    await expect(
      provider.generateStructured({
        task: 'nobody.registered.this',
        schemaName: 'Demo',
        schema: z.object({ a: z.string() }),
        messages: [{ role: 'user', content: 'x' }],
      }),
    ).rejects.toThrow(/No mock fixture registered/);
  });

  it('reports token usage so budgets behave the same offline', async () => {
    const response = await provider.generateText({
      task: 'demo.text',
      messages: [{ role: 'user', content: 'a fairly long message to embed and count' }],
    });
    expect(response.usage.inputTokens).toBeGreaterThan(0);
    expect(response.mode).toBe('mock');
  });
});
