import { describe, expect, it } from 'vitest';
import {
  chooseAstraEffort,
  recommendWorkflow,
  buildEngineeringPrompt,
  type TaskProfile,
  type TaskComplexity,
  type TaskRisk,
} from './astra-prompt-router';

describe('effort routing regressions', () => {
  it('never lets throughput preferences demote difficult or critical work', () => {
    for (const complexity of ['simple', 'moderate', 'complex', 'extreme'] as TaskComplexity[]) {
      for (const risk of ['low', 'medium', 'high', 'critical'] as TaskRisk[]) {
        const task = { complexity, risk };
        expect(chooseAstraEffort({ ...task, highVolume: true, latencySensitive: true })).toBe(
          chooseAstraEffort(task),
        );
        if (risk === 'critical')
          expect(['high', 'xhigh', 'max']).toContain(chooseAstraEffort(task));
      }
    }
  });
  it('does not send extreme low-risk work to low effort', () => {
    expect(chooseAstraEffort({ complexity: 'extreme', risk: 'low' })).toBe('xhigh');
    expect(chooseAstraEffort({ complexity: 'extreme', risk: 'critical' })).toBe('max');
  });
  it('rejects invalid runtime enum values', () => {
    expect(() =>
      chooseAstraEffort({ complexity: 'unknown', risk: 'low' } as unknown as TaskProfile),
    ).toThrow('complexity');
    expect(() =>
      chooseAstraEffort({ complexity: 'simple', risk: 'unknown' } as unknown as TaskProfile),
    ).toThrow('risk');
  });
  it('recommends no model for fixed rules and keeps critical review visible', () => {
    expect(
      recommendWorkflow({ complexity: 'simple', risk: 'critical', deterministic: true }),
    ).toMatchObject({ path: 'deterministic', effort: null, humanReview: true });
  });
  it('limits the faster-model suggestion to bounded low-risk work', () => {
    expect(recommendWorkflow({ complexity: 'simple', risk: 'low', highVolume: true }).path).toBe(
      'fast-model',
    );
    expect(recommendWorkflow({ complexity: 'complex', risk: 'high', highVolume: true }).path).toBe(
      'astra',
    );
  });
});

describe('prompt construction', () => {
  it('rejects empty goals and removes blank/duplicate context', () => {
    expect(() => buildEngineeringPrompt({ objective: '  ' })).toThrow('objective');
    const prompt = buildEngineeringPrompt({ objective: 'Inspect', context: [' one ', '', 'one'] });
    expect(prompt.match(/- one/g)).toHaveLength(1);
    expect(prompt).not.toContain('undefined');
  });
});
