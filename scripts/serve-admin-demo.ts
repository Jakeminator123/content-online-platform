import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import app from '../src/app.js';

// Run the actual production application locally for browser regression tests.
// Existing Clerk authentication, authorization and cron protection are unchanged.
// Browser tests navigate only the existing public presentation demo.
const localApp = new Hono();
localApp.use('/admin/assets/*', serveStatic({ root: './public' }));
localApp.route('/', app);

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
serve({ fetch: localApp.fetch, hostname: '127.0.0.1', port }, ({ port: activePort }) => {
  console.log('Content Online admin demo: http://127.0.0.1:' + activePort + '/demo');
});
