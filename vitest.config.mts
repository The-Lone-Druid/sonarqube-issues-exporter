import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // Scope coverage to the pure, deterministic core modules. Network clients
      // and the server are covered by MSW/integration tests added in later phases.
      include: ['src/core/format.ts', 'src/core/metrics.ts', 'src/core/config.ts'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
