import { describe, expect, it, vi } from "vitest";
import { CustomerLogoError, MAX_CUSTOMER_LOGO_BYTES, validateCustomerLogo } from "../src/admin/customer-logo.js";
import { createAdminPortal } from "../src/admin/portal.js";
import { initialRegistry, type RegistryStore } from "../src/admin/registry.js";

const config = { allowedEmail: "admin@example.test", secretKey: "fixture", publishableKey: "" };
const authenticated = { status: "authenticated" as const, identity: { id: "admin", email: config.allowedEmail, role: "content_admin" as const } };

function store(): RegistryStore {
  const data = initialRegistry();
  return {
    read: async () => ({ version: 1, data }),
    write: async () => { throw new Error("not used"); },
  };
}

function uploadBody(bytes: number[], type: string, version = 1): FormData {
  const body = new FormData();
  body.set("version", String(version));
  body.set("logo", new File([new Uint8Array(bytes)], "logo", { type }));
  return body;
}

describe("Customer logo validation", () => {
  it.each([
    [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], "image/png", { contentType: "image/png", extension: "png" }],
    [[0xff, 0xd8, 0xff, 0xe0], "image/jpeg", { contentType: "image/jpeg", extension: "jpg" }],
    [[0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50], "image/webp", { contentType: "image/webp", extension: "webp" }],
  ])("accepts image bytes by signature", async (bytes, type, expected) => {
    await expect(validateCustomerLogo(new File([new Uint8Array(bytes as number[])], "logo", { type: type as string })))
      .resolves.toEqual(expected);
  });

  it("rejects empty, oversized and disguised files before storage", async () => {
    await expect(validateCustomerLogo(new File([], "empty.png", { type: "image/png" })))
      .rejects.toMatchObject({ code: "empty_file", status: 422 });
    await expect(validateCustomerLogo(new File([new Uint8Array(MAX_CUSTOMER_LOGO_BYTES + 1)], "large.png", { type: "image/png" })))
      .rejects.toMatchObject({ code: "file_too_large", status: 413 });
    await expect(validateCustomerLogo(new File(["<svg></svg>"], "fake.png", { type: "image/png" })))
      .rejects.toMatchObject({ code: "unsupported_file_type", status: 415 });
  });
});

describe("Guarded customer logo upload", () => {
  it("authenticates, verifies registry version and returns only the public URL", async () => {
    const uploader = vi.fn(async (_customerId: string, _file: File) => "https://example.public.blob.vercel-storage.com/customer-logo-abc.png");
    const app = createAdminPortal({ authenticate: async () => authenticated }, config, {
      registryStore: store(),
      customerLogoUploader: uploader,
    });
    const response = await app.request("/admin/api/customers/customer-kth-demo/logo", {
      method: "POST",
      body: uploadBody([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], "image/png"),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ url: "https://example.public.blob.vercel-storage.com/customer-logo-abc.png" });
    expect(uploader).toHaveBeenCalledOnce();
    expect(uploader.mock.calls[0]?.[0]).toBe("customer-kth-demo");
    expect(uploader.mock.calls[0]?.[1]).toBeInstanceOf(File);
  });

  it("rejects unauthenticated, cross-origin, stale and unknown-customer uploads before Blob", async () => {
    const uploader = vi.fn(async (_customerId: string, _file: File) => "https://example.public.blob.vercel-storage.com/logo.png");
    const unauthenticatedApp = createAdminPortal({ authenticate: async () => ({ status: "unauthenticated" }) }, config, {
      registryStore: store(), customerLogoUploader: uploader,
    });
    expect((await unauthenticatedApp.request("/admin/api/customers/customer-kth-demo/logo", { method: "POST", body: uploadBody([1], "image/png") })).status).toBe(401);

    const app = createAdminPortal({ authenticate: async () => authenticated }, config, {
      registryStore: store(), customerLogoUploader: uploader,
    });
    expect((await app.request("/admin/api/customers/customer-kth-demo/logo", { method: "POST", headers: { origin: "https://evil.example" }, body: uploadBody([1], "image/png") })).status).toBe(403);
    expect((await app.request("/admin/api/customers/customer-kth-demo/logo", { method: "POST", body: uploadBody([1], "image/png", 2) })).status).toBe(409);
    expect((await app.request("/admin/api/customers/missing/logo", { method: "POST", body: uploadBody([1], "image/png") })).status).toBe(404);
    expect(uploader).not.toHaveBeenCalled();
  });

  it("maps validation and provider failures without reflecting private payloads", async () => {
    const rejected = createAdminPortal({ authenticate: async () => authenticated }, config, {
      registryStore: store(),
      customerLogoUploader: async () => { throw new CustomerLogoError("unsupported_file_type", 415); },
    });
    expect(await (await rejected.request("/admin/api/customers/customer-kth-demo/logo", { method: "POST", body: uploadBody([1], "image/png") })).json())
      .toEqual({ error: "unsupported_file_type" });

    const privatePayload = "private-blob-provider-payload";
    const unavailable = createAdminPortal({ authenticate: async () => authenticated }, config, {
      registryStore: store(),
      customerLogoUploader: async () => { throw new Error(privatePayload); },
    });
    const response = await unavailable.request("/admin/api/customers/customer-kth-demo/logo", { method: "POST", body: uploadBody([1], "image/png") });
    expect(response.status).toBe(503);
    expect(await response.text()).toBe('{"error":"logo_upload_unavailable"}');
  });
});
