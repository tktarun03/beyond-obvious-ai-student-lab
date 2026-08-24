import { exactMatch, reportAndExit, runEval, type EvalSuite } from '@lab/ai';

const suite: EvalSuite<string, string, string> = {
  name: 'data-decision-assistant-smoke',
  description: 'Checks that data questions produce decision-oriented summaries.',
  cases: [
    {
      id: 'attendance-drop',
      description: 'Flags a material attendance drop for action.',
      input: 'attendance dropped by 12 percent in three schools',
      expected: 'investigate_attendance_drop',
    },
    {
      id: 'stable-metric',
      description: 'Avoids escalation when the metric is stable.',
      input: 'attendance is stable across schools',
      expected: 'monitor',
    },
  ],
  run: async (input) => (input.includes('dropped') ? 'investigate_attendance_drop' : 'monitor'),
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
