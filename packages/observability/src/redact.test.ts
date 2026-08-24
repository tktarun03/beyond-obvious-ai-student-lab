import { describe, expect, it } from 'vitest';
import { Logger, type LogRecord } from './logger.js';
import { redact } from './redact.js';

describe('redact', () => {
  it('masks values under a sensitive key name', () => {
    const out = redact({ apiKey: 'AIzaSyREAL', nested: { sessionToken: 'abc' } }) as any;
    expect(out.apiKey).toBe('[redacted]');
    expect(out.nested.sessionToken).toBe('[redacted]');
  });

  it('masks credential-shaped values even under an innocent key name', () => {
    const out = redact({ note: 'use AIzaSyA1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7 now' }) as any;
    expect(out.note).not.toContain('AIzaSy');
    expect(out.note).toContain('[redacted]');
  });

  it('survives circular references instead of throwing inside the logger', () => {
    const a: Record<string, unknown> = { name: 'a' };
    a.self = a;
    expect(() => redact(a)).not.toThrow();
    expect((redact(a) as any).self).toBe('[circular]');
  });
});

describe('Logger', () => {
  const capture = () => {
    const records: LogRecord[] = [];
    return { records, sink: (r: LogRecord) => records.push(r) };
  };

  it('never writes a secret, even when handed one directly', () => {
    const { records, sink } = capture();
    const log = new Logger({ level: 'debug', sink, scope: 'test' });
    log.info('calling provider', {
      headers: { authorization: 'Bearer supersecrettokenvalue123456' },
    });
    const serialised = JSON.stringify(records);
    expect(serialised).not.toContain('supersecrettokenvalue');
  });

  it('respects the level threshold', () => {
    const { records, sink } = capture();
    const log = new Logger({ level: 'warn', sink });
    log.debug('quiet');
    log.info('quiet');
    log.warn('loud');
    expect(records.map((r) => r.level)).toEqual(['warn']);
  });

  it('carries child context into every record', () => {
    const { records, sink } = capture();
    const log = new Logger({ level: 'debug', sink, scope: 'api' }).child('chat', {
      requestId: 'r1',
    });
    log.info('handled');
    expect(records[0]?.scope).toBe('api:chat');
    expect(records[0]?.requestId).toBe('r1');
  });
});
