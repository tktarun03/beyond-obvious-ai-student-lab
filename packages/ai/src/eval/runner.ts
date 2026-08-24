import { latencyStats, TokenMeter } from '@lab/observability';
import type { CaseResult, EvalReport, EvalSuite, ScoreResult } from './types.js';

export interface RunEvalOptions {
  /** Meter shared with the provider so the report can print real usage. */
  readonly meter?: TokenMeter;
  readonly model?: string;
  readonly mode?: string;
  /** Run only cases carrying this tag — handy while iterating on one failure. */
  readonly onlyTag?: string;
}

export async function runEval<I, E, O>(
  suite: EvalSuite<I, E, O>,
  options: RunEvalOptions = {},
): Promise<EvalReport> {
  const startedAt = new Date().toISOString();
  const cases = options.onlyTag
    ? suite.cases.filter((c) => c.tags?.includes(options.onlyTag!))
    : suite.cases;

  const results: CaseResult[] = [];
  const latencies: number[] = [];

  for (const testCase of cases) {
    const started = performance.now();
    try {
      const output = await suite.run(testCase.input, testCase.id);
      const latency = performance.now() - started;
      latencies.push(latency);

      const scores: Record<string, ScoreResult> = {};
      for (const scorer of suite.scorers) {
        scores[scorer.name] = await scorer.score(output, testCase.expected, testCase.input);
      }

      results.push({
        caseId: testCase.id,
        description: testCase.description,
        tags: testCase.tags ?? [],
        latencyMs: Math.round(latency),
        scores,
      });
    } catch (error) {
      // A thrown case scores zero on everything rather than aborting the run.
      // A suite that stops at the first error hides how bad things are.
      const scores: Record<string, ScoreResult> = {};
      for (const scorer of suite.scorers) {
        scores[scorer.name] = { score: 0, detail: 'case threw before scoring' };
      }
      results.push({
        caseId: testCase.id,
        description: testCase.description,
        tags: testCase.tags ?? [],
        latencyMs: Math.round(performance.now() - started),
        scores,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const aggregates: Record<string, number> = {};
  for (const scorer of suite.scorers) {
    const values = results.map((r) => r.scores[scorer.name]?.score ?? 0);
    aggregates[scorer.name] = values.length
      ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 1000) / 1000
      : 0;
  }

  const thresholdFailures = Object.entries(suite.thresholds ?? {})
    .map(([scorer, required]) => ({ scorer, required, actual: aggregates[scorer] ?? 0 }))
    .filter((t) => t.actual < t.required);

  return {
    suite: suite.name,
    description: suite.description,
    mode: options.mode ?? process.env.AI_MODE ?? 'mock',
    model: options.model ?? 'unknown',
    startedAt,
    caseCount: results.length,
    errorCount: results.filter((r) => r.error).length,
    results,
    aggregates,
    latency: latencyStats(latencies),
    usage: (options.meter ?? new TokenMeter()).snapshot(options.model ?? 'mock'),
    thresholdFailures,
    passed: thresholdFailures.length === 0 && results.length > 0,
  };
}

const bar = (score: number, width = 20) => {
  const filled = Math.round(score * width);
  return `${'#'.repeat(filled)}${'.'.repeat(width - filled)}`;
};

/** Human-readable report. Printed by every `npm run eval`. */
export function formatReport(report: EvalReport): string {
  const lines: string[] = [];
  lines.push('');
  lines.push(`  ${report.suite}`);
  lines.push(`  ${report.description}`);
  lines.push(
    `  mode=${report.mode}  model=${report.model}  cases=${report.caseCount}  errors=${report.errorCount}`,
  );
  lines.push('');

  lines.push('  SCORES');
  for (const [scorer, value] of Object.entries(report.aggregates)) {
    const required = report.thresholdFailures.find((t) => t.scorer === scorer)?.required;
    const flag = required !== undefined ? `  BELOW THRESHOLD (${required})` : '';
    lines.push(`    ${scorer.padEnd(24)} ${bar(value)} ${value.toFixed(3)}${flag}`);
  }
  lines.push('');

  const failing = report.results.filter((r) => Object.values(r.scores).some((s) => s.score < 1));
  if (failing.length) {
    lines.push('  CASES WITH LOST POINTS');
    for (const result of failing) {
      lines.push(`    ${result.caseId} — ${result.description}`);
      if (result.error) lines.push(`      ! threw: ${result.error}`);
      for (const [scorer, score] of Object.entries(result.scores)) {
        if (score.score < 1) {
          lines.push(
            `      ${scorer}: ${score.score.toFixed(2)}${score.detail ? ` — ${score.detail}` : ''}`,
          );
        }
      }
    }
    lines.push('');
  }

  lines.push(
    `  LATENCY  p50=${report.latency.p50}ms  p95=${report.latency.p95}ms  max=${report.latency.max}ms`,
  );
  lines.push(
    `  USAGE    calls=${report.usage.calls}  tokens=${report.usage.totalTokens}  est=$${report.usage.estimatedUsd.toFixed(4)}`,
  );
  lines.push('');
  lines.push(report.passed ? '  RESULT: PASS' : '  RESULT: FAIL');
  lines.push('');
  return lines.join('\n');
}

/**
 * Prints the report and sets a non-zero exit code when a threshold is missed.
 *
 * WHY exit codes matter: an eval that only prints is a thing people stop
 * reading. An eval that fails the build is a thing people fix.
 */
export function reportAndExit(report: EvalReport): void {
  process.stdout.write(formatReport(report));
  if (!report.passed) process.exitCode = 1;
}
