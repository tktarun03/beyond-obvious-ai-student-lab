import { describe, expect, it } from 'vitest';
import { TokenBudgetExceededError, TokenMeter } from './token-meter.js';

describe('TokenMeter', () => {
  it('accumulates usage across calls', () => {
    const meter = new TokenMeter();
    meter.record({ inputTokens: 100, outputTokens: 50 });
    meter.record({ inputTokens: 20, outputTokens: 5 });
    expect(meter.snapshot().totalTokens).toBe(175);
    expect(meter.snapshot().calls).toBe(2);
  });

  it('refuses further work once the budget is spent', () => {
    const meter = new TokenMeter(100);
    meter.record({ inputTokens: 90, outputTokens: 20 });
    expect(() => meter.assertWithinBudget()).toThrow(TokenBudgetExceededError);
  });

  it('treats a zero budget as unlimited', () => {
    const meter = new TokenMeter(0);
    meter.record({ inputTokens: 10_000_000, outputTokens: 0 });
    expect(() => meter.assertWithinBudget()).not.toThrow();
  });

  it('estimates cost as zero in mock mode', () => {
    const meter = new TokenMeter();
    meter.record({ inputTokens: 1000, outputTokens: 1000 });
    expect(meter.snapshot('mock').estimatedUsd).toBe(0);
    expect(meter.snapshot('gemini-2.0-flash').estimatedUsd).toBeGreaterThan(0);
  });
});
