import { createClerkClient } from "@clerk/backend";

export const PLATFORM_ORIGIN = "https://content-online-platform.vercel.app";
export const CUSTOMER_PORTAL = "https://fokus-psi-sable.vercel.app";

export type AdminIdentity = { id: string; email: string; role: "content_admin" };
export type AdminAuthentication =
  | { status: "authenticated"; identity: AdminIdentity }
  | { status: "unauthenticated" | "forbidden" | "unconfigured" };
export interface AdminAuthenticator {
  authenticate(request: Request): Promise<AdminAuthentication>;
}

type ClerkUserProfile = {
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

// Only a verified PRIMARY email from Clerk's server API can grant this role.
// Customer roles, organization roles and client-editable metadata are never used.
export function authorizeAdmin(user: ClerkUserProfile, allowedEmail: string): AdminIdentity | null {
  if (!allowedEmail.trim() || user.banned || user.locked) return null;
  const primary = user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId);
  if (primary?.verification?.status !== "verified") return null;
  if (primary.emailAddress.trim().toLowerCase() !== allowedEmail.trim().toLowerCase()) return null;
  return { id: user.id, email: primary.emailAddress, role: "content_admin" };
}

export type AdminConfig = { publishableKey: string; secretKey: string; allowedEmail: string };

export class ClerkAdminAuthenticator implements AdminAuthenticator {
  private readonly client;

  constructor(private readonly config: AdminConfig) {
    this.client = config.secretKey && config.publishableKey
      ? createClerkClient({ secretKey: config.secretKey, publishableKey: config.publishableKey })
      : null;
  }

  async authenticate(request: Request): Promise<AdminAuthentication> {
    if (!this.client || !this.config.allowedEmail) return { status: "unconfigured" };
    // Bearer-only API: the KTH demo cookie and the old local operator cookie cannot authenticate here.
    if (!request.headers.get("authorization")?.startsWith("Bearer ")) return { status: "unauthenticated" };
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
    const identity = authorizeAdmin(user, this.config.allowedEmail);
    return identity ? { status: "authenticated", identity } : { status: "forbidden" };
  }
}

export function readAdminConfig(): AdminConfig {
  return {
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? "",
    secretKey: process.env.CLERK_SECRET_KEY?.trim() ?? "",
    allowedEmail: process.env.CONTENT_ONLINE_ADMIN_EMAIL?.trim() ?? "",
  };
}
