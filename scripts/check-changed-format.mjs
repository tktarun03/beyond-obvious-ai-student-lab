// Check touched files while the staged documentation cleanup is still in progress.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = process.env.FORMAT_BASE || 'HEAD^';
const files = execFileSync(
  'git',
  ['diff', '--name-only', '--diff-filter=ACMR', '-z', `${base}...HEAD`, '--'],
  { cwd: root, encoding: 'utf8' },
)
  .split('\0')
  .filter(Boolean);
let checked = 0;
const failures = [];
for (const file of files) {
  const absolute = resolve(root, file);
  const info = await prettier.getFileInfo(absolute, {
    ignorePath: resolve(root, '.prettierignore'),
  });
  if (info.ignored || !info.inferredParser) continue;
  checked++;
  const config = await prettier.resolveConfig(absolute);
  if (!(await prettier.check(readFileSync(absolute, 'utf8'), { ...config, filepath: absolute })))
    failures.push(file);
}
if (failures.length) {
  console.error(`Formatting required: ${failures.join(', ')}`);
  process.exitCode = 1;
} else {
  console.log(`Formatting passed for ${checked} changed files.`);
}
