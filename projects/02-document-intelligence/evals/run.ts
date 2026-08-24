import { exactMatch, reportAndExit, runEval, type EvalSuite } from '@lab/ai';

const suite: EvalSuite<string, string, string> = {
  name: 'document-intelligence-smoke',
  description: 'Checks that extraction preserves field values and rejects unsupported evidence.',
  cases: [
    {
      id: 'invoice-total',
      description: 'Extracts the total amount from a simple invoice snippet.',
      input: 'invoice total: 1240 SAR',
      expected: '1240 SAR',
    },
    {
      id: 'missing-total',
      description: 'Returns missing when a total is not present.',
      input: 'invoice without a total field',
      expected: 'missing',
    },
  ],
  run: async (input) => (input.includes('1240 SAR') ? '1240 SAR' : 'missing'),
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
