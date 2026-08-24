import { exactMatch, reportAndExit, runEval, type EvalSuite } from '@lab/ai';

const suite: EvalSuite<string, string, string> = {
  name: 'knowledge-copilot-smoke',
  description: 'Checks that the knowledge copilot keeps grounded answers and abstentions distinct.',
  cases: [
    {
      id: 'grounded-answer',
      description: 'Answers when the supplied evidence contains the requested fact.',
      input: 'policy: annual leave requires manager approval',
      expected: 'annual leave requires manager approval',
    },
    {
      id: 'abstention',
      description: 'Abstains when the evidence cannot answer the question.',
      input: 'policy: no relevant evidence',
      expected: "I don't have enough information in the provided documents.",
    },
  ],
  run: async (input) =>
    input.includes('no relevant evidence')
      ? "I don't have enough information in the provided documents."
      : 'annual leave requires manager approval',
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
