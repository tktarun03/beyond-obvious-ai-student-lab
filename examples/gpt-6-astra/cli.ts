import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { recommendWorkflow } from './astra-prompt-router';
import { SCENARIOS, getScenario, buildScenarioPrompt } from './scenarios';

const help = `Offline prompt lab — no API requests, keys or model charges.

npm run astra -- --list
npm run astra -- --demo 01-payment-retry
npm run astra -- --demo 02-exam-portal --json
npm run --silent astra -- --demo 08-pr-review > prompt.txt

--list          List the ten synthetic exercises (default)
--demo <id>     Print a complete prompt, including its fixture
--json          Export machine-readable metadata and review criteria
--help          Show this help

Effort suggestions are local heuristics, not measured model benchmarks.`;

export function runCLI(args: string[]): { output: string; exitCode: number } {
  try {
    const { values } = parseArgs({
      args,
      allowPositionals: false,
      strict: true,
      options: {
        list: { type: 'boolean' },
        demo: { type: 'string' },
        json: { type: 'boolean' },
        help: { type: 'boolean' },
      },
    });
    if (values.help) return { output: help, exitCode: 0 };
    if (values.list && values.demo !== undefined)
      throw new Error('Choose --list or --demo, not both.');
    if (values.demo !== undefined) {
      const demo = getScenario(values.demo);
      const prompt = buildScenarioPrompt(demo);
      return {
        exitCode: 0,
        output: values.json
          ? JSON.stringify(
              {
                id: demo.id,
                title: demo.title,
                synthetic: true,
                profile: demo.profile,
                recommendation: recommendWorkflow(demo.profile),
                prompt,
                expectedChecks: demo.expectedChecks,
              },
              null,
              2,
            )
          : prompt,
      };
    }
    const entries = SCENARIOS.map(({ id, title, region, minutes }) => ({
      id,
      title,
      region,
      minutes,
    }));
    return {
      exitCode: 0,
      output: values.json
        ? JSON.stringify(entries, null, 2)
        : [
            'Offline prompt lab — synthetic exercises; no model is called.',
            '',
            ...entries.map(
              (demo) => `${demo.id} | ${demo.region} | ${demo.minutes} min | ${demo.title}`,
            ),
            '',
            'Run npm run astra -- --demo <id> to print a complete prompt.',
          ].join('\n'),
    };
  } catch (error) {
    return {
      output: `${error instanceof Error ? error.message : String(error)}\nRun --help for usage.`,
      exitCode: 1,
    };
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = runCLI(process.argv.slice(2));
  (result.exitCode === 0 ? process.stdout : process.stderr).write(`${result.output}\n`);
  process.exitCode = result.exitCode;
}
