import { defineConfig } from 'tsup';

export default defineConfig([
  // Library surface (framework-agnostic core).
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: false,
  },
  // CLI + bundled Hono server (the bin). Heavy/native deps stay external.
  {
    entry: ['src/cli.ts'],
    format: ['cjs'],
    sourcemap: true,
    // Keep ESM-only / native deps out of the CJS bundle; loaded at runtime.
    external: ['playwright-core', 'open'],
  },
]);
