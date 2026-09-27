// Check local Markdown destinations without fetching external links or installing packages.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
  { cwd: root, encoding: 'utf8' },
)
  .split('\0')
  .filter((file) => file.endsWith('.md') && existsSync(resolve(root, file)));
const failures = [];
let checked = 0;
for (const file of files) {
  const source = readFileSync(resolve(root, file), 'utf8').replace(
    /^\s*```[^\n]*\n[\s\S]*?^\s*```\s*$/gm,
    '',
  );
  const links = [
    ...source.matchAll(/!?\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g),
    ...source.matchAll(/^\s*\[[^\]]+\]:\s*(\S+)/gm),
  ];
  for (const [, raw] of links) {
    if (!raw || /^(?:[a-z][a-z\d+.-]*:|#|\/\/)/i.test(raw)) continue;
    let target;
    try {
      target = decodeURIComponent(raw.replace(/^<|>$/g, '').split(/[?#]/)[0]);
    } catch {
      failures.push(`${file}: invalid encoded destination ${raw}`);
      continue;
    }
    if (!target) continue;
    const absolute = resolve(
      target.startsWith('/') ? root : dirname(resolve(root, file)),
      target.replace(/^\//, ''),
    );
    checked++;
    if (!(absolute === root || absolute.startsWith(root + sep)) || !existsSync(absolute)) {
      failures.push(`${file}: missing local target ${raw}`);
    }
  }
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    `Checked ${checked} local destinations across ${files.length} Markdown files. External links and heading anchors are not checked.`,
  );
}
