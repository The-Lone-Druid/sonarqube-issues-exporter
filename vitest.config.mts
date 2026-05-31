import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // Core domain is unit-tested (format/metrics/config) and the SonarQube
      // client is covered via fetch-mocked tests. The Hono server is covered by
      // route integration tests but excluded from the line-coverage gate.
      include: [
        'src/core/format.ts',
        'src/core/metrics.ts',
        'src/core/config.ts',
        'src/core/sonarqube/client.ts',
      ],
      thresholds: {
        statements: 80,
        // Many defensive/graceful-degradation branches are intentionally lenient.
        branches: 70,
        functions: 80,
        lines: 80,
      },
    },
  },
});
