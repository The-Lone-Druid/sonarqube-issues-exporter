import { createLogger, format, transports, Logger } from 'winston';
import { AppConfig } from '../types/config';

export class AppLogger {
  private readonly logger: Logger;
  private readonly MAX_META_LENGTH = 1000; // Maximum length for metadata objects

  constructor(config: AppConfig['logging']) {
    const logFormat = format.combine(
      format.timestamp({
        format: () =>
          new Date().toLocaleString('en-US', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          }),
      }),
      format.errors({ stack: true }),
      format.json(),
      format.prettyPrint()
    );

    const logTransports: any[] = [
      new transports.Console({
        level: config.level,
        format: format.combine(format.colorize(), format.simple()),
      }),
    ];

    if (config.file) {
      logTransports.push(
        new transports.File({
          filename: config.file,
          level: config.level,
          format: logFormat,
        })
      );
    }

    this.logger = createLogger({
      level: config.level,
      format: logFormat,
      transports: logTransports,
      exitOnError: false,
    });
  }

  private sanitizeMeta(meta: any): any {
    if (!meta) return meta;

    // If it's a string, truncate if too long
    if (typeof meta === 'string') {
      return meta.length > this.MAX_META_LENGTH
        ? meta.substring(0, this.MAX_META_LENGTH) + '... [truncated]'
        : meta;
    }

    // If it's an object, convert to string and truncate
    if (typeof meta === 'object') {
      try {
        const jsonString = JSON.stringify(meta, (key, value) => {
          // Hide sensitive data
          if (
            key.toLowerCase().includes('token') ||
            key.toLowerCase().includes('password') ||
            key.toLowerCase().includes('secret')
          ) {
            return '[REDACTED]';
          }
          return value;
        });

        if (jsonString.length > this.MAX_META_LENGTH) {
          return jsonString.substring(0, this.MAX_META_LENGTH) + '... [truncated]';
        }

        return JSON.parse(jsonString);
      } catch {
        return '[Object - could not serialize]';
      }
    }

    return meta;
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, this.sanitizeMeta(meta));
  }

  error(message: string, meta?: any): void {
    this.logger.error(message, this.sanitizeMeta(meta));
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, this.sanitizeMeta(meta));
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, this.sanitizeMeta(meta));
  }
}

// Default logger instance
let defaultLogger: AppLogger;

export function initLogger(config: AppConfig['logging']): void {
  defaultLogger = new AppLogger(config);
}

export function getLogger(): AppLogger {
  if (!defaultLogger) {
    defaultLogger = new AppLogger({ level: 'info' });
  }
  return defaultLogger;
}
