import { createLogger, format, transports, Logger } from 'winston';
import { AppConfig } from '../types/config';

export class AppLogger {
  private logger: Logger;

  constructor(config: AppConfig['logging']) {
    const logFormat = format.combine(
      format.timestamp(),
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

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  error(message: string, meta?: any): void {
    this.logger.error(message, meta);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
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
