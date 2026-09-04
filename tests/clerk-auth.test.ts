import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClerkAdminAuthenticator, PLATFORM_ORIGIN } from "../src/admin/identity.js";

const sdk = vi.hoisted(() => ({ authenticateRequest: vi.fn(), getUser: vi.fn(), getSession: vi.fn() }));
vi.mock("@clerk/backend", () => ({ createClerkClient: () => ({
  authenticateRequest: sdk.authenticateRequest, users: { getUser: sdk.getUser }, sessions: { getSession: sdk.getSession },
}) }));

const config = { secretKey: "server-only", publishableKey: "public-test-key", allowedEmail: "admin@example.test" };
const request = () => new Request(`${PLATFORM_ORIGIN}/admin/api/session`, { headers: { authorization: "Bearer signed-session" } });
const claims = (azp: string | undefined = PLATFORM_ORIGIN) => ({ userId: "user_admin", sessionId: "sess_admin", sessionClaims: { azp } });

describe("Clerk verification adapter", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    sdk.authenticateRequest.mockResolvedValue({ isAuthenticated: true, toAuth: () => claims() });
    sdk.getUser.mockResolvedValue({ id: "user_admin", banned: false, locked: false, primaryEmailAddressId: "email_admin",
      emailAddresses: [{ id: "email_admin", emailAddress: config.allowedEmail, verification: { status: "verified" } }] });
    sdk.getSession.mockResolvedValue({ status: "active", userId: "user_admin" });
  });

  it("passes explicit origin and session-token restrictions to Clerk before server authorization", async () => {
    expect(await new ClerkAdminAuthenticator(config).authenticate(request())).toEqual({ status: "authenticated",
      identity: { id: "user_admin", email: config.allowedEmail, role: "content_admin" } });
    expect(sdk.authenticateRequest).toHaveBeenCalledWith(expect.any(Request), { authorizedParties: [PLATFORM_ORIGIN], acceptsToken: "session_token" });
    expect(sdk.getUser).toHaveBeenCalledWith("user_admin");
    expect(sdk.getSession).toHaveBeenCalledWith("sess_admin");
  });

  it("does not fetch or authorize an identity when Clerk rejects the token", async () => {
    sdk.authenticateRequest.mockResolvedValue({ isAuthenticated: false });
    expect(await new ClerkAdminAuthenticator(config).authenticate(request())).toEqual({ status: "unauthenticated" });
    expect(sdk.getUser).not.toHaveBeenCalled();
  });

  it.each(["https://customer.example.test", "", undefined])("requires an exact azp even when the SDK accepts a token: %s", async (azp) => {
    sdk.authenticateRequest.mockResolvedValue({ isAuthenticated: true, toAuth: () => ({ ...claims(), sessionClaims: { azp } }) });
    expect(await new ClerkAdminAuthenticator(config).authenticate(request())).toEqual({ status: "forbidden" });
    expect(sdk.getUser).not.toHaveBeenCalled();
  });

  it.each(["revoked", "ended", "expired", "pending"])('rejects a %s session even before JWT expiration', async (status) => {
    sdk.getSession.mockResolvedValue({ status, userId: "user_admin" });
    expect(await new ClerkAdminAuthenticator(config).authenticate(request())).toEqual({ status: "unauthenticated" });
  });

  it("rejects mismatched session ownership", async () => {
    sdk.getSession.mockResolvedValue({ status: "active", userId: "another_user" });
    expect(await new ClerkAdminAuthenticator(config).authenticate(request())).toEqual({ status: "unauthenticated" });
  });
});
