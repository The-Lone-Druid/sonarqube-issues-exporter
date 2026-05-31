import type { LoggingConfig } from './types';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

let currentLevel: LogLevel = 'info';

export function initLogger(config: Pick<LoggingConfig, 'level'>): void {
  currentLevel = config.level;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] <= LOG_LEVELS[currentLevel];
}

function formatMeta(meta: unknown): string {
  if (meta === undefined || meta === null) return '';
  if (meta instanceof Error) return ` ${meta.message}`;
  if (typeof meta === 'string') return ` ${meta}`;
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return '';
  }
}

export const logger = {
  info(message: string, meta?: unknown): void {
    if (shouldLog('info')) console.log(`info: ${message}${formatMeta(meta)}`);
  },
  warn(message: string, meta?: unknown): void {
    if (shouldLog('warn')) console.warn(`warn: ${message}${formatMeta(meta)}`);
  },
  error(message: string, meta?: unknown): void {
    if (shouldLog('error')) console.error(`error: ${message}${formatMeta(meta)}`);
  },
  debug(message: string, meta?: unknown): void {
    if (shouldLog('debug')) console.debug(`debug: ${message}${formatMeta(meta)}`);
  },
};
