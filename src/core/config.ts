import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { AppConfig, ConfigLoadOptions, DeepPartial, SonarQubeConnection } from './types';

const CONFIG_FILE_NAMES = ['.sonarqube-exporter.json', 'sonarqube-exporter.config.json'];

function loadEnvFile(filePath = '.env'): void {
  const resolved = resolve(filePath);
  if (!existsSync(resolved)) return;

  const content = readFileSync(resolved, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] == null) process.env[key] = value;
  }
}

function getDefaultConfig(): AppConfig {
  return {
    sonarqube: {
      url: process.env['SONARQUBE_URL'] || 'http://localhost:9000',
      token: process.env['SONARQUBE_TOKEN'] || '',
      ...(process.env['SONARQUBE_ORGANIZATION'] && {
        organization: process.env['SONARQUBE_ORGANIZATION'],
      }),
      ...(process.env['SONARQUBE_PROJECT_KEY'] && {
        defaultProjectKey: process.env['SONARQUBE_PROJECT_KEY'],
      }),
    },
    server: {
      port: parseInt(process.env['SQ_PORT'] || '7010', 10),
      host: process.env['SQ_HOST'] || '127.0.0.1',
      open: process.env['SQ_NO_OPEN'] !== 'true',
      auth: process.env['SQ_AUTH'] === 'true',
      allowWrite: process.env['SQ_ALLOW_WRITE'] === 'true',
    },
    logging: {
      level: (process.env['LOG_LEVEL'] as AppConfig['logging']['level']) || 'info',
    },
  };
}

/** Old v3 config files nested everything under `sonarqube`/`export`; map the bits we keep. */
interface LegacyConfigShape {
  sonarqube?: { url?: string; token?: string; organization?: string; projectKey?: string };
  server?: Partial<AppConfig['server']>;
  logging?: Partial<AppConfig['logging']>;
}

function mergeFileConfig(base: AppConfig, file: LegacyConfigShape): AppConfig {
  return {
    sonarqube: {
      ...base.sonarqube,
      ...(file.sonarqube?.url != null && { url: file.sonarqube.url }),
      ...(file.sonarqube?.token != null && { token: file.sonarqube.token }),
      ...(file.sonarqube?.organization != null && { organization: file.sonarqube.organization }),
      ...(file.sonarqube?.projectKey != null && { defaultProjectKey: file.sonarqube.projectKey }),
    },
    server: { ...base.server, ...file.server },
    logging: { ...base.logging, ...file.logging },
  };
}

function mergeOverrides(base: AppConfig, overrides: DeepPartial<AppConfig>): AppConfig {
  return {
    sonarqube: { ...base.sonarqube, ...overrides.sonarqube },
    server: { ...base.server, ...overrides.server },
    logging: { ...base.logging, ...overrides.logging },
  };
}

function validateConfig(config: AppConfig): void {
  const errors: string[] = [];

  if (!config.sonarqube.url) errors.push('SonarQube URL is required');
  if (!config.sonarqube.token) errors.push('SonarQube token is required');

  try {
    new URL(config.sonarqube.url);
  } catch {
    errors.push('Invalid SonarQube URL format');
  }

  if (config.server.port <= 0 || config.server.port > 65535) {
    errors.push('Server port must be between 1 and 65535');
  }

  if (errors.length > 0) {
    throw new Error(
      `Configuration validation failed:\n${errors.join('\n')}\n\n` +
        'Set environment variables (SONARQUBE_URL, SONARQUBE_TOKEN)\n' +
        'or create a .sonarqube-exporter.json config file.\n' +
        'Run "sonarqube-exporter setup" for guided configuration.',
    );
  }
}

function loadConfigFile(configPath: string): LegacyConfigShape {
  if (!existsSync(configPath)) return {};
  try {
    return JSON.parse(readFileSync(configPath, 'utf-8')) as LegacyConfigShape;
  } catch (error) {
    throw new Error(`Failed to load config file: ${error}`);
  }
}

export function loadConfig(options: ConfigLoadOptions = {}): AppConfig {
  loadEnvFile();
  let config = getDefaultConfig();

  const home = process.env['HOME'];
  const configPaths = [
    options.configPath,
    ...CONFIG_FILE_NAMES,
    ...(home ? CONFIG_FILE_NAMES.map((name) => join(home, name)) : []),
  ].filter(Boolean) as string[];

  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      config = mergeFileConfig(config, loadConfigFile(configPath));
      break;
    }
  }

  if (options.overrides) config = mergeOverrides(config, options.overrides);

  validateConfig(config);
  return config;
}

/** Extract just the connection fields needed by the SonarQube client. */
export function toConnection(config: AppConfig): SonarQubeConnection {
  return {
    url: config.sonarqube.url,
    token: config.sonarqube.token,
    ...(config.sonarqube.organization && { organization: config.sonarqube.organization }),
  };
}
