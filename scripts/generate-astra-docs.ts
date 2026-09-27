import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildScenarioPrompt, SCENARIOS } from '../examples/gpt-6-astra/scenarios';

const target = fileURLToPath(
  new URL('../docs/gpt-6-astra/10-LIVE-DEMO-PROMPTS.md', import.meta.url),
);
const marker = '<!-- BEGIN GENERATED EXERCISES -->';
const current = readFileSync(target, 'utf8');
const intro = current.split(marker)[0]!.trimEnd();
const sections = SCENARIOS.map((scenario) =>
  [
    '<details>',
    `<summary><strong>${scenario.id} — ${scenario.title}</strong></summary>`,
    '',
    `${scenario.region} · ${scenario.minutes} minutes · Synthetic fixture`,
    '',
    `**Weak prompt:** ${scenario.weakPrompt}`,
    '',
    '**Complete prompt**',
    '',
    '```text',
    buildScenarioPrompt(scenario),
    '```',
    '',
    '**Review the answer**',
    '',
    ...scenario.expectedChecks.map((check) => `- ${check}`),
    '',
    `**Stretch:** ${scenario.stretchGoal}`,
    '',
    '</details>',
  ].join('\n'),
);
const generated = `${intro}\n\n${marker}\n\n## All complete prompts — copy directly from GitHub\n\nThis section is generated from the shared scenario source. Edit the source and run\n\`npm run astra:docs\`; CI checks that the published prompts stay synchronized.\n\n${sections.join('\n\n')}\n`;
if (process.argv.includes('--check')) {
  if (current !== generated) {
    console.error('Demo documentation is out of sync. Run npm run astra:docs.');
    process.exitCode = 1;
  } else console.log(`All ${SCENARIOS.length} published prompts match their source.`);
} else {
  writeFileSync(target, generated);
  console.log(`Generated ${SCENARIOS.length} complete GitHub-readable prompts.`);
}
