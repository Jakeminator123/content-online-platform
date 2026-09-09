import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { createAdminPortal } from '../src/admin/portal.js';

// Local-only presentation harness for browser regression tests. Production
// never opts into these fixture routes.
const localApp = new Hono();
localApp.use('/admin/assets/*', serveStatic({ root: './public' }));
localApp.route('/', createAdminPortal(
  { authenticate: async () => ({ status: 'unauthenticated' }) },
  { publishableKey: '', secretKey: '', allowedEmail: '' },
  { presentationFixtures: true },
));

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
serve({ fetch: localApp.fetch, hostname: '127.0.0.1', port }, ({ port: activePort }) => {
  console.log('Local Content Online fixture harness: http://127.0.0.1:' + activePort + '/demo');
});
