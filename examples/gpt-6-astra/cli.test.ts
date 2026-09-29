import { describe, expect, it } from 'vitest';
import { runCLI } from './cli';

describe('CLI contract', () => {
  it('exports parseable JSON with a complete prompt and rubric', () => {
    const result = runCLI(['--demo', '02-exam-portal', '--json']);
    expect(result.exitCode).toBe(0);
    const output = JSON.parse(result.output);
    expect(output.synthetic).toBe(true);
    expect(output.prompt).toContain('3,000,000');
    expect(output.expectedChecks).toHaveLength(4);
  });
  it('makes list output reusable by tools', () => {
    expect(JSON.parse(runCLI(['--list', '--json']).output)).toHaveLength(10);
  });
  it.each([
    ['--demo', 'missing'],
    ['--demo', ''],
    ['--demo'],
    ['--live'],
    ['--list', '--demo', '01-payment-retry'],
    ['unexpected'],
  ])('fails clearly on invalid arguments %j', (...args) => {
    expect(runCLI(args).exitCode).toBe(1);
  });
});
