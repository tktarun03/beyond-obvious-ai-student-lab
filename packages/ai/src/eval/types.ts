/**
 * A deliberately small evaluation framework.
 *
 * WHY build one instead of importing a library: the point of these projects is
 * that a student can explain what "grounding = 0.82" actually measured. Ninety
 * lines they can read beats a framework they can only configure.
 *
 * The shape is the standard one: cases in, a task that produces output, scorers
 * that turn (output, expected) into a number in [0, 1], and a threshold that
 * decides whether CI is allowed to be green.
 */

export interface EvalCase<TInput, TExpected> {
  readonly id: string;
  /** What this case is actually probing. Shows up in the report. */
  readonly description: string;
  readonly input: TInput;
  readonly expected: TExpected;
  /** Free-form labels — 'multilingual', 'adversarial', 'edge-case'. */
  readonly tags?: readonly string[];
}

export interface ScoreResult {
  /** 0 = wrong, 1 = right. Partial credit is allowed and usually more useful. */
  readonly score: number;
  /** One line explaining the score, shown for failures. */
  readonly detail?: string;
}

export interface Scorer<TOutput, TExpected, TInput = unknown> {
  readonly name: string;
  /** What a low score on this scorer means, for the report legend. */
  readonly description: string;
  score(output: TOutput, expected: TExpected, input: TInput): ScoreResult | Promise<ScoreResult>;
}

export interface EvalSuite<TInput, TExpected, TOutput> {
  readonly name: string;
  readonly description: string;
  readonly cases: readonly EvalCase<TInput, TExpected>[];
  run(input: TInput, caseId: string): Promise<TOutput>;
  readonly scorers: readonly Scorer<TOutput, TExpected, TInput>[];
  /**
   * Minimum mean score per scorer for the run to pass.
   * A threshold that is never enforced is a dashboard, not a test.
   */
  readonly thresholds?: Readonly<Record<string, number>>;
}

export interface CaseResult {
  readonly caseId: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly latencyMs: number;
  readonly scores: Readonly<Record<string, ScoreResult>>;
  readonly error?: string;
}

export interface EvalReport {
  readonly suite: string;
  readonly description: string;
  readonly mode: string;
  readonly model: string;
  readonly startedAt: string;
  readonly caseCount: number;
  readonly errorCount: number;
  readonly results: readonly CaseResult[];
  readonly aggregates: Readonly<Record<string, number>>;
  readonly latency: { count: number; p50: number; p95: number; max: number; mean: number };
  readonly usage: {
    calls: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedUsd: number;
  };
  readonly thresholdFailures: readonly { scorer: string; actual: number; required: number }[];
  readonly passed: boolean;
}
