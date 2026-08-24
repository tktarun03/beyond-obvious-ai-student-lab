import { exactMatch, reportAndExit, runEval, type EvalSuite } from '@lab/ai';

const suite: EvalSuite<string, string, string> = {
  name: 'india-voice-assistant-smoke',
  description: 'Checks intent routing for multilingual public-service voice requests.',
  cases: [
    {
      id: 'benefit-status',
      description: 'Routes a benefit-status question to the status intent.',
      input: 'mera application status kya hai',
      expected: 'check_application_status',
    },
    {
      id: 'language-help',
      description: 'Routes a language-change request to the language intent.',
      input: 'please speak in Hindi',
      expected: 'change_language',
    },
  ],
  run: async (input) =>
    input.toLowerCase().includes('hindi') ? 'change_language' : 'check_application_status',
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
