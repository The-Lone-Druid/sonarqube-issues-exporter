import { describe, expect, it } from 'vitest';
import { createApp } from '../src/server/app';
import { createServerContext } from '../src/server/context';
import type { AppConfig } from '../src/core/types';

const config: AppConfig = {
  sonarqube: { url: 'https://sonar.example.com', token: 'secret-token', defaultProjectKey: 'demo' },
  server: { port: 7010, host: '127.0.0.1', open: false, auth: false, allowWrite: false },
  logging: { level: 'error' },
};

describe('server /api/config', () => {
  it('exposes connection info without leaking the token', async () => {
    const app = createApp(createServerContext(config, { port: 7010 }));
    const res = await app.request('/api/config');
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body['url']).toBe('https://sonar.example.com');
    expect(body['hasToken']).toBe(true);
    expect(body['defaultProjectKey']).toBe('demo');
    // The token must never appear anywhere in the response.
    expect(JSON.stringify(body)).not.toContain('secret-token');
  });
});

describe('server auth gate', () => {
  it('rejects /api requests without the local token when auth is enabled', async () => {
    const app = createApp(createServerContext(config, { port: 7010, authToken: 'abc123' }));
    const denied = await app.request('/api/config');
    expect(denied.status).toBe(401);

    const allowed = await app.request('/api/config', {
      headers: { 'x-sq-local-token': 'abc123' },
    });
    expect(allowed.status).toBe(200);
  });
});
