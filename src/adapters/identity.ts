import type { AuthenticatedIdentity, IdentityProvider } from "../application/ports.js";

export class IdentityProviderNotConfiguredError extends Error {
  constructor() {
    super("Identity provider is not configured.");
    this.name = "IdentityProviderNotConfiguredError";
  }
}

export class UnconfiguredIdentityProvider implements IdentityProvider {
  async authenticate(_request: Request): Promise<AuthenticatedIdentity | null> {
    throw new IdentityProviderNotConfiguredError();
  }
}

/**
 * Development/test adapter only. The production entrypoint never instantiates it.
 */
export class StaticBearerIdentityProvider implements IdentityProvider {
  constructor(private readonly subjectsByToken: Readonly<Record<string, string>>) {}

  async authenticate(request: Request): Promise<AuthenticatedIdentity | null> {
    const authorization = request.headers.get("authorization");
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;
    const subject = token ? this.subjectsByToken[token] : undefined;

    return subject ? { subject } : null;
  }
}
