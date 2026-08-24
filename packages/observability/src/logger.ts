import { redact } from './redact.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 99,
};

export interface LogRecord {
  readonly time: string;
  readonly level: Exclude<LogLevel, 'silent'>;
  readonly msg: string;
  readonly scope: string;
  readonly [key: string]: unknown;
}

export interface LoggerOptions {
  readonly level?: LogLevel;
  readonly format?: 'pretty' | 'json';
  readonly scope?: string;
  /** Fields attached to every record from this logger (requestId, userId…). */
  readonly context?: Record<string, unknown>;
  /** Injectable sink so tests can assert on output without touching stdout. */
  readonly sink?: (record: LogRecord) => void;
  readonly redactionEnabled?: boolean;
}

const ESC = String.fromCharCode(27);
const COLOURS: Record<string, string> = {
  debug: `${ESC}[90m`,
  info: `${ESC}[36m`,
  warn: `${ESC}[33m`,
  error: `${ESC}[31m`,
  reset: `${ESC}[0m`,
  dim: `${ESC}[2m`,
};

export class Logger {
  private readonly level: LogLevel;
  private readonly format: 'pretty' | 'json';
  private readonly scope: string;
  private readonly context: Record<string, unknown>;
  private readonly sink: (record: LogRecord) => void;
  private readonly redactionEnabled: boolean;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? 'info';
    this.format = options.format ?? 'pretty';
    this.scope = options.scope ?? 'app';
    this.context = options.context ?? {};
    this.redactionEnabled = options.redactionEnabled ?? true;
    this.sink = options.sink ?? ((record) => this.write(record));
  }

  /** Derives a logger that carries extra context — one per request is the norm. */
  child(scope: string, context: Record<string, unknown> = {}): Logger {
    return new Logger({
      level: this.level,
      format: this.format,
      scope: `${this.scope}:${scope}`,
      context: { ...this.context, ...context },
      sink: this.sink,
      redactionEnabled: this.redactionEnabled,
    });
  }

  debug = (msg: string, fields?: Record<string, unknown>) => this.emit('debug', msg, fields);
  info = (msg: string, fields?: Record<string, unknown>) => this.emit('info', msg, fields);
  warn = (msg: string, fields?: Record<string, unknown>) => this.emit('warn', msg, fields);
  error = (msg: string, fields?: Record<string, unknown>) => this.emit('error', msg, fields);

  private emit(
    level: Exclude<LogLevel, 'silent'>,
    msg: string,
    fields: Record<string, unknown> = {},
  ): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.level]) return;
    const merged = { ...this.context, ...fields };
    const safe = this.redactionEnabled ? (redact(merged) as Record<string, unknown>) : merged;
    this.sink({
      time: new Date().toISOString(),
      level,
      scope: this.scope,
      msg: this.redactionEnabled ? (redact(msg) as string) : msg,
      ...safe,
    });
  }

  private write(record: LogRecord): void {
    if (this.format === 'json') {
      // One JSON object per line — the shape every log aggregator expects.
      process.stdout.write(`${JSON.stringify(record)}\n`);
      return;
    }
    const { time, level, scope, msg, ...rest } = record;
    const colour = COLOURS[level] ?? '';
    const clock = time.slice(11, 19);
    const extra = Object.keys(rest).length
      ? ` ${COLOURS.dim}${JSON.stringify(rest)}${COLOURS.reset}`
      : '';
    process.stdout.write(
      `${COLOURS.dim}${clock}${COLOURS.reset} ${colour}${level.toUpperCase().padEnd(5)}${COLOURS.reset} ${COLOURS.dim}${scope}${COLOURS.reset} ${msg}${extra}\n`,
    );
  }
}

let rootLogger: Logger | null = null;

/** Process-wide logger, configured from the environment on first use. */
export function getLogger(scope = 'app'): Logger {
  rootLogger ??= new Logger({
    level: (process.env.LOG_LEVEL as LogLevel | undefined) ?? 'info',
    format: process.env.LOG_FORMAT === 'json' ? 'json' : 'pretty',
    redactionEnabled: process.env.LOG_REDACT_DISABLED !== 'true',
  });
  return rootLogger.child(scope);
}

/** Test seam. Pass null to reset. */
export function setRootLogger(logger: Logger | null): void {
  rootLogger = logger;
}
