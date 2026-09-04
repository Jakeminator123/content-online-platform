import { createApp } from "./app.js";
import { UnconfiguredIdentityProvider } from "./adapters/identity.js";
import { InMemoryPortalRepository } from "./adapters/in-memory-repository.js";

const app = createApp({
  identityProvider: new UnconfiguredIdentityProvider(),
  repository: new InMemoryPortalRepository(),
  clock: () => new Date(),
  createId: () => crypto.randomUUID(),
});

export default app;
