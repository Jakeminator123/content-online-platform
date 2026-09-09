import { createClerkClient } from "@clerk/backend";
import { PLATFORM_ORIGIN } from "../admin/identity.js";
import type { AdminConfig } from "../admin/identity.js";

export type CustomerIdentity = {
  id: string;
  email: string;
};

export type CustomerAuthentication =
  | { status: "authenticated"; identity: CustomerIdentity }
  | { status: "unauthenticated" | "forbidden" | "unconfigured" };

export interface CustomerAuthenticator {
  authenticate(request: Request): Promise<CustomerAuthentication>;
}

type ClerkCustomerProfile = {
  id: string;
  banned: boolean;
  locked: boolean;
  primaryEmailAddressId: string | null;
  emailAddresses: Array<{
    id: string;
    emailAddress: string;
    verification: { status: string } | null;
  }>;
};

function verifiedCustomerIdentity(user: ClerkCustomerProfile): CustomerIdentity | null {
  if (user.banned || user.locked) return null;
  const primary = user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId);
  const email = primary?.emailAddress.trim() ?? "";
  if (!email || primary?.verification?.status !== "verified") return null;
  return { id: user.id, email };
}

/**
 * Verifies a customer session without assigning a tenant or role. Those decisions
 * belong to the server-owned membership repository after authentication succeeds.
 */
export class ClerkCustomerAuthenticator implements CustomerAuthenticator {
  private readonly client;

  constructor(private readonly config: AdminConfig) {
    this.client = config.secretKey && config.publishableKey
      ? createClerkClient({ secretKey: config.secretKey, publishableKey: config.publishableKey })
      : null;
  }

  async authenticate(request: Request): Promise<CustomerAuthentication> {
    if (!this.client) return { status: "unconfigured" };

    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ") || !authorization.slice(7).trim()) {
      return { status: "unauthenticated" };
    }

    const origin = request.headers.get("origin");
    if (origin && origin !== PLATFORM_ORIGIN) return { status: "forbidden" };

    const state = await this.client.authenticateRequest(request, {
      authorizedParties: [PLATFORM_ORIGIN],
      acceptsToken: "session_token",
    });
    if (!state.isAuthenticated) return { status: "unauthenticated" };

    const auth = state.toAuth();
    if (!auth.userId || !auth.sessionId || auth.sessionClaims.azp !== PLATFORM_ORIGIN) {
      return { status: "forbidden" };
    }

    const [user, session] = await Promise.all([
      this.client.users.getUser(auth.userId),
      this.client.sessions.getSession(auth.sessionId),
    ]);
    if (session.status !== "active" || session.userId !== user.id || user.id !== auth.userId) {
      return { status: "unauthenticated" };
    }

    const identity = verifiedCustomerIdentity(user);
    return identity ? { status: "authenticated", identity } : { status: "forbidden" };
  }
}
