// Pre-publish guard: never ship a server without its bundled SPA or CLI.
import { existsSync } from 'node:fs';

const required = ['dist/index.js', 'dist/index.mjs', 'dist/index.d.ts', 'dist/cli.js', 'dist/web/index.html'];
const missing = required.filter((p) => !existsSync(p));

if (missing.length > 0) {
  console.error('check-dist: missing required build artifacts:\n  ' + missing.join('\n  '));
  console.error('Run `pnpm build` before publishing.');
  process.exit(1);
}

console.log('check-dist: all required artifacts present.');
