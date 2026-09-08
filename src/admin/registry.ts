import { randomUUID } from "node:crypto";
import { z } from "zod";

const slug = z.string().min(2).max(63).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const name = z.string().trim().min(2).max(120);
const id = z.string().min(1).max(80);
const customerSchema = z.object({
  id, name, slug, status: z.enum(["draft", "published", "archived"]),
  kind: z.enum(["demo", "customer"]), publisherIds: z.array(id).max(100),
});
const publisherSchema = z.object({ id, name, status: z.enum(["active", "archived"]) });
const eventSchema = z.object({ at: z.string(), actor: id, action: z.string(), entityId: id });
export const registrySchema = z.object({
  customers: z.array(customerSchema).max(1000),
  publishers: z.array(publisherSchema).max(100),
  events: z.array(eventSchema).max(500),
});
export type Registry = z.infer<typeof registrySchema>;
export type RegistrySnapshot = { version: number; data: Registry };
export const commandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("add_customer"), name, slug }),
  z.object({ action: z.literal("update_customer"), id, name, publisherIds: z.array(id).max(100) }),
  z.object({ action: z.literal("publish_customer"), id }),
  z.object({ action: z.literal("unpublish_customer"), id }),
  z.object({ action: z.literal("archive_customer"), id }),
  z.object({ action: z.literal("restore_customer"), id }),
  z.object({ action: z.literal("add_publisher"), name }),
  z.object({ action: z.literal("rename_publisher"), id, name }),
  z.object({ action: z.literal("archive_publisher"), id }),
  z.object({ action: z.literal("restore_publisher"), id }),
]);
export type RegistryCommand = z.infer<typeof commandSchema>;
export class RegistryError extends Error {
  constructor(public code: string, public status: 404 | 409 | 422 | 503 = 422) { super(code); }
}
export function initialRegistry(): Registry {
  return { customers: [{ id: "customer-kth-demo", name: "KTH", slug: "kth", status: "published", kind: "demo", publisherIds: ["ieee"] }],
    publishers: [{ id: "ieee", name: "IEEE", status: "active" }, { id: "sae", name: "SAE", status: "active" }, { id: "astm", name: "ASTM", status: "active" }], events: [] };
}
export function applyRegistryCommand(data: Registry, command: RegistryCommand, actor: string, now = new Date()): Registry {
  const next = structuredClone(data);
  let entityId: string = "registry";
  if (command.action === "add_customer") {
    if (next.customers.some(c => c.slug === command.slug)) throw new RegistryError("slug_reserved", 409);
    if (next.customers.length >= 1000) throw new RegistryError("customer_limit");
    entityId = randomUUID();
    next.customers.push({ id: entityId, name: command.name, slug: command.slug, status: "draft", kind: "customer", publisherIds: [] });
  } else if (command.action === "add_publisher") {
    if (next.publishers.some(p => p.name.toLocaleLowerCase() === command.name.toLocaleLowerCase())) throw new RegistryError("publisher_exists", 409);
    if (next.publishers.length >= 100) throw new RegistryError("publisher_limit");
    entityId = randomUUID();
    next.publishers.push({ id: entityId, name: command.name, status: "active" });
  } else {
    entityId = command.id;
    if (["rename_publisher", "archive_publisher", "restore_publisher"].includes(command.action)) {
      const p = next.publishers.find(p => p.id === command.id);
      if (!p) throw new RegistryError("not_found", 404);
      if (command.action === "rename_publisher") {
        if (next.publishers.some(other => other.id !== p.id && other.name.toLocaleLowerCase() === command.name.toLocaleLowerCase())) throw new RegistryError("publisher_exists", 409);
        p.name = command.name;
      } else p.status = command.action === "archive_publisher" ? "archived" : "active";
    } else {
      const c = next.customers.find(c => c.id === command.id);
      if (!c) throw new RegistryError("not_found", 404);
      if (command.action === "update_customer") {
        const unique = [...new Set(command.publisherIds)];
        if (unique.some(id => !next.publishers.some(p => p.id === id && (p.status === "active" || c.publisherIds.includes(id))))) throw new RegistryError("publisher_unavailable");
        c.name = command.name; c.publisherIds = unique;
      } else if (command.action === "publish_customer") {
        if (c.status === "archived") throw new RegistryError("restore_before_publishing", 409);
        c.status = "published";
      } else if (command.action === "archive_customer") c.status = "archived";
      else c.status = "draft"; // Restore never silently re-publishes.
    }
  }
  next.events = [...next.events, { at: now.toISOString(), actor, action: command.action, entityId }].slice(-500);
  return registrySchema.parse(next);
}
export function publicPortal(data: Registry, requestedSlug: string) {
  const c = data.customers.find(c => c.slug === requestedSlug && c.status === "published");
  // Explicit publication discloses ONLY display name, slug and activation state.
  return c ? { name: c.name, slug: c.slug, mode: c.kind === "demo" ? "demo" as const : "awaiting_accounts" as const } : null;
}
export interface RegistryStore {
  read(): Promise<RegistrySnapshot>;
  write(expectedVersion: number, data: Registry): Promise<RegistrySnapshot>;
}
