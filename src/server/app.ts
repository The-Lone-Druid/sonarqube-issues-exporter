import { Hono } from 'hono';
import type { ServerContext } from './context';
import { createApiRoutes } from './routes/api';
import { registerStatic } from './static';

/** Build the full Hono application: optional auth → /api proxy → static SPA. */
export function createApp(ctx: ServerContext): Hono {
  const app = new Hono();

  // Optional local-token auth for shared machines (`serve --auth`).
  if (ctx.authToken) {
    app.use('/api/*', async (c, next) => {
      const provided = c.req.header('x-sq-local-token') ?? c.req.query('_token');
      if (provided !== ctx.authToken) {
        return c.json({ error: 'unauthorized', message: 'Missing or invalid local token' }, 401);
      }
      return next();
    });
  }

  app.route('/api', createApiRoutes(ctx));

  // Static SPA + history fallback — registered last so /api wins.
  registerStatic(app);

  return app;
}
