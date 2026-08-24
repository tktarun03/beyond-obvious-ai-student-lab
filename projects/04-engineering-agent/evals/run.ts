import { exactMatch, reportAndExit, runEval, type EvalSuite } from '@lab/ai';

const suite: EvalSuite<string, string, string> = {
  name: 'engineering-agent-smoke',
  description: 'Checks that the engineering agent separates tests, edits, and review output.',
  cases: [
    {
      id: 'test-failure',
      description: 'Classifies a failing assertion as a test investigation.',
      input: 'vitest failed expected 200 received 500',
      expected: 'investigate_test_failure',
    },
    {
      id: 'review-request',
      description: 'Classifies an explicit review request as code review.',
      input: 'review this pull request for regressions',
      expected: 'code_review',
    },
  ],
  run: async (input) => (input.includes('review') ? 'code_review' : 'investigate_test_failure'),
  scorers: [exactMatch()],
  thresholds: { exact_match: 1 },
};

async function main() {
  reportAndExit(await runEval(suite, { mode: 'mock', model: 'deterministic-smoke' }));
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
