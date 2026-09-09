import { beforeEach, describe, expect, it, vi } from "vitest";
import { PLATFORM_ORIGIN } from "../src/admin/identity.js";
import { ClerkCustomerAuthenticator } from "../src/customer-portal/identity.js";

const sdk = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  getUser: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock("@clerk/backend", () => ({
  createClerkClient: () => ({
    authenticateRequest: sdk.authenticateRequest,
    users: { getUser: sdk.getUser },
    sessions: { getSession: sdk.getSession },
  }),
}));

const config = {
  secretKey: "server-only",
  publishableKey: "public-test-key",
  allowedEmail: "admin-only@example.test",
};

const claims = (azp: string | undefined = PLATFORM_ORIGIN) => ({
  userId: "user_customer",
  sessionId: "sess_customer",
  sessionClaims: { azp },
});

function request(headers: HeadersInit = { authorization: "Bearer signed-session" }) {
  return new Request(`${PLATFORM_ORIGIN}/v1/portal-entries`, { headers });
}

describe("Clerk customer authentication", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    sdk.authenticateRequest.mockResolvedValue({ isAuthenticated: true, toAuth: () => claims() });
    sdk.getUser.mockResolvedValue({
      id: "user_customer",
      banned: false,
      locked: false,
      primaryEmailAddressId: "email_customer",
      emailAddresses: [
        {
          id: "email_customer",
          emailAddress: " customer@example.test ",
          verification: { status: "verified" },
        },
      ],
      unsafeMetadata: { role: "content_admin" },
    });
    sdk.getSession.mockResolvedValue({ status: "active", userId: "user_customer" });
  });

  it("returns only a verified customer identity and delegates no role", async () => {
    const result = await new ClerkCustomerAuthenticator(config).authenticate(request());

    expect(result).toEqual({
      status: "authenticated",
      identity: { id: "user_customer", email: "customer@example.test" },
    });
    expect(result).not.toHaveProperty("identity.role");
    expect(sdk.authenticateRequest).toHaveBeenCalledWith(expect.any(Request), {
      authorizedParties: [PLATFORM_ORIGIN],
      acceptsToken: "session_token",
    });
    expect(sdk.getUser).toHaveBeenCalledWith("user_customer");
    expect(sdk.getSession).toHaveBeenCalledWith("sess_customer");
  });

  it.each([
    { secretKey: "", publishableKey: "public-test-key" },
    { secretKey: "server-only", publishableKey: "" },
  ])("fails closed when Clerk credentials are incomplete", async (credentials) => {
    const result = await new ClerkCustomerAuthenticator({ ...config, ...credentials }).authenticate(request());
    expect(result).toEqual({ status: "unconfigured" });
    expect(sdk.authenticateRequest).not.toHaveBeenCalled();
  });

  it.each([
    {},
    { cookie: "__session=customer-cookie" },
    { authorization: "Bearer " },
  ])("requires a non-empty bearer session token", async (headers) => {
    const result = await new ClerkCustomerAuthenticator(config).authenticate(request(headers));
    expect(result).toEqual({ status: "unauthenticated" });
    expect(sdk.authenticateRequest).not.toHaveBeenCalled();
  });

  it("rejects a foreign browser origin before token verification", async () => {
    const result = await new ClerkCustomerAuthenticator(config).authenticate(request({
      authorization: "Bearer signed-session",
      origin: "https://customer.example.test",
    }));
    expect(result).toEqual({ status: "forbidden" });
    expect(sdk.authenticateRequest).not.toHaveBeenCalled();
  });

  it("returns unauthenticated when Clerk rejects the token", async () => {
    sdk.authenticateRequest.mockResolvedValue({ isAuthenticated: false });
    const result = await new ClerkCustomerAuthenticator(config).authenticate(request());
    expect(result).toEqual({ status: "unauthenticated" });
    expect(sdk.getUser).not.toHaveBeenCalled();
    expect(sdk.getSession).not.toHaveBeenCalled();
  });

  it.each(["https://foreign.example.test", "", undefined])(
    "requires the exact platform authorized party in azp: %s",
    async (azp) => {
      sdk.authenticateRequest.mockResolvedValue({
        isAuthenticated: true,
        toAuth: () => ({ ...claims(), sessionClaims: { azp } }),
      });
      const result = await new ClerkCustomerAuthenticator(config).authenticate(request());
      expect(result).toEqual({ status: "forbidden" });
      expect(sdk.getUser).not.toHaveBeenCalled();
      expect(sdk.getSession).not.toHaveBeenCalled();
    },
  );

  it.each(["revoked", "ended", "expired", "pending"])(
    "rejects a %s Clerk session",
    async (status) => {
      sdk.getSession.mockResolvedValue({ status, userId: "user_customer" });
      const result = await new ClerkCustomerAuthenticator(config).authenticate(request());
      expect(result).toEqual({ status: "unauthenticated" });
    },
  );

  it("rejects mismatched session ownership", async () => {
    sdk.getSession.mockResolvedValue({ status: "active", userId: "another_user" });
    const result = await new ClerkCustomerAuthenticator(config).authenticate(request());
    expect(result).toEqual({ status: "unauthenticated" });
  });

  it.each([
    { banned: true },
    { locked: true },
    { primaryEmailAddressId: null },
    {
      emailAddresses: [
        {
          id: "email_customer",
          emailAddress: "customer@example.test",
          verification: { status: "unverified" },
        },
      ],
    },
  ])("forbids a customer without an eligible verified primary email", async (profilePatch) => {
    sdk.getUser.mockResolvedValue({
      id: "user_customer",
      banned: false,
      locked: false,
      primaryEmailAddressId: "email_customer",
      emailAddresses: [
        {
          id: "email_customer",
          emailAddress: "customer@example.test",
          verification: { status: "verified" },
        },
      ],
      ...profilePatch,
    });
    const result = await new ClerkCustomerAuthenticator(config).authenticate(request());
    expect(result).toEqual({ status: "forbidden" });
  });
});
