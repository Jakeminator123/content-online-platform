import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { createDemoDependencies, DEMO_TOKENS } from "./testing/demo-system.js";

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const dependencies = await createDemoDependencies();
const app = createApp(dependencies);

serve(
  {
    fetch: app.fetch,
    hostname: "127.0.0.1",
    port,
  },
  ({ port: activePort }) => {
    console.log(`Synthetic backend demo: http://127.0.0.1:${activePort}`);
    console.log(`OpenAPI: http://127.0.0.1:${activePort}/openapi.json`);
    console.log(`Local-only admin token: ${DEMO_TOKENS.adminA}`);
  },
);
