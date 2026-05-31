import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import type { Hono } from 'hono';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
};

function mimeFor(filePath: string): string {
  return MIME[extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

/** Directory containing the bundled SPA assets (`dist/web` at runtime). */
export function resolveWebRoot(): string {
  // The CLI/server is bundled to CJS (dist/), so __dirname points at dist/.
  return join(__dirname, 'web');
}

/** Register static SPA serving with history-API fallback to index.html. */
export function registerStatic(app: Hono, webRoot = resolveWebRoot()): void {
  const root = normalize(webRoot);

  app.get('/*', async (c) => {
    const urlPath = decodeURIComponent(new URL(c.req.url).pathname);
    const candidate = normalize(join(root, urlPath));

    // Block path traversal outside the web root.
    if (!candidate.startsWith(root)) return c.notFound();

    const file = await tryReadFile(candidate);
    if (file) return new Response(file.data, { headers: { 'Content-Type': mimeFor(file.path) } });

    // SPA fallback: serve index.html for client-side routes.
    const index = await tryReadFile(join(root, 'index.html'));
    if (index) return new Response(index.data, { headers: { 'Content-Type': MIME['.html']! } });

    return c.text('Web assets not found. Run `pnpm build` (or `pnpm dev` for development).', 503);
  });
}

async function tryReadFile(path: string): Promise<{ data: Buffer; path: string } | null> {
  try {
    const s = await stat(path);
    const target = s.isDirectory() ? join(path, 'index.html') : path;
    return { data: await readFile(target), path: target };
  } catch {
    return null;
  }
}
