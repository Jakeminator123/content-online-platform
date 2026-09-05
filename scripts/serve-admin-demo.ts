import { serve } from '@hono/node-server';
import app from '../src/app.js';

// Run the actual production application locally for browser regression tests.
// Existing Clerk authentication, authorization and cron protection are unchanged.
// Browser tests navigate only the existing public presentation demo.
serve({ fetch: app.fetch, hostname: '127.0.0.1', port: 3000 });
