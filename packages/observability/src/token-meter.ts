import { AppError } from '@lab/shared';

export interface TokenUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
}

/**
 * Indicative per-million-token prices, used only to print an estimate at the
 * end of an eval run. They are NOT billing figures and they go stale — the
 * point is to make cost visible enough that a student notices when a change
 * makes a run ten times more expensive.
 */
const PRICE_PER_MILLION: Record<string, { input: number; output: number }> = {
  'gemini-2.0-flash': { input: 0.1, output: 0.4 },
  'gemini-2.5-flash': { input: 0.3, output: 2.5 },
  'gemini-2.5-pro': { input: 1.25, output: 10 },
  'text-embedding-004': { input: 0.0, output: 0 },
  mock: { input: 0, output: 0 },
};

export class TokenBudgetExceededError extends AppError {
  constructor(used: number, budget: number) {
    super('AI_BUDGET_EXCEEDED', `Token budget exhausted: ${used}/${budget}`, {
      details: { used, budget },
    });
  }
}

/**
 * Counts tokens across a session and refuses further calls past the budget.
 *
 * WHY a hard stop rather than a warning: the failure mode this prevents is a
 * retry loop in a student's code quietly spending a month of credits overnight.
 * A refused call is a bug report; a silent bill is not.
 */
export class TokenMeter {
  private input = 0;
  private output = 0;
  private calls = 0;

  constructor(private readonly budget = 0) {}

  record(usage: TokenUsage): void {
    this.input += usage.inputTokens;
    this.output += usage.outputTokens;
    this.calls += 1;
  }

  /** Call before dispatching a request. Throws when the budget is spent. */
  assertWithinBudget(): void {
    if (this.budget > 0 && this.total > this.budget) {
      throw new TokenBudgetExceededError(this.total, this.budget);
    }
  }

  get total(): number {
    return this.input + this.output;
  }

  snapshot(model = 'mock'): {
    calls: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedUsd: number;
  } {
    const price = PRICE_PER_MILLION[model] ?? PRICE_PER_MILLION.mock!;
    const estimatedUsd =
      (this.input / 1_000_000) * price.input + (this.output / 1_000_000) * price.output;
    return {
      calls: this.calls,
      inputTokens: this.input,
      outputTokens: this.output,
      totalTokens: this.total,
      estimatedUsd: Math.round(estimatedUsd * 1e6) / 1e6,
    };
  }

  reset(): void {
    this.input = 0;
    this.output = 0;
    this.calls = 0;
  }
}
