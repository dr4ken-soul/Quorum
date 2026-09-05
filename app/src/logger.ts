/**
 * Structured logging.
 *
 * Rules enforced by convention and reviewed in tests:
 * - Log case IDs and event names, never message bodies, attachments, or secrets.
 * - One JSON object per line so a server can ship stdout to any collector.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface LogFields {
  caseId?: string;
  [key: string]: unknown;
}

export interface Logger {
  debug(event: string, fields?: LogFields): void;
  info(event: string, fields?: LogFields): void;
  warn(event: string, fields?: LogFields): void;
  error(event: string, fields?: LogFields): void;
}

export function createLogger(level: string, sink: (line: string) => void = console.log): Logger {
  const threshold = LEVEL_ORDER[(level as LogLevel) in LEVEL_ORDER ? (level as LogLevel) : 'info'];
  const write = (levelName: LogLevel, event: string, fields?: LogFields): void => {
    if (LEVEL_ORDER[levelName] < threshold) return;
    const record: Record<string, unknown> = {
      time: new Date().toISOString(),
      level: levelName,
      event,
    };
    if (fields) {
      for (const [key, value] of Object.entries(fields)) {
        // Refuse obviously sensitive keys even if a caller makes a mistake.
        const lowerKey = key.toLowerCase();
        if (
          lowerKey === 'body' ||
          lowerKey === 'text' ||
          lowerKey === 'attachment' ||
          lowerKey.includes('secret') ||
          lowerKey.includes('token') ||
          lowerKey.includes('password') ||
          lowerKey.includes('key')
        ) {
          record[key] = '[redacted]';
          continue;
        }
        record[key] = value;
      }
    }
    sink(JSON.stringify(record));
  };
  return {
    debug: (event, fields) => write('debug', event, fields),
    info: (event, fields) => write('info', event, fields),
    warn: (event, fields) => write('warn', event, fields),
    error: (event, fields) => write('error', event, fields),
  };
}
