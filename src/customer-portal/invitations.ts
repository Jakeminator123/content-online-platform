import { createClerkClient } from "@clerk/backend";
import type { AdminConfig } from "../admin/identity.js";

export type PortalInvitationRequest = {
  emailAddress: string;
  redirectUrl: string;
};

export interface PortalInvitationService {
  invite(request: PortalInvitationRequest): Promise<void>;
}

export class PortalInvitationError extends Error {
  constructor(public readonly code: "unconfigured" | "provider_unavailable") {
    super(code);
    this.name = "PortalInvitationError";
  }
}

export class ClerkPortalInvitationService implements PortalInvitationService {
  private readonly client;

  constructor(config: AdminConfig) {
    this.client = config.secretKey && config.publishableKey
      ? createClerkClient({ secretKey: config.secretKey, publishableKey: config.publishableKey })
      : null;
  }

  async invite({ emailAddress, redirectUrl }: PortalInvitationRequest): Promise<void> {
    if (!this.client) throw new PortalInvitationError("unconfigured");
    try {
      await this.client.invitations.createInvitation({
        emailAddress,
        redirectUrl,
        expiresInDays: 30,
        ignoreExisting: true,
        notify: true,
      });
    } catch {
      // Provider payloads can contain identity details and must not cross this boundary.
      throw new PortalInvitationError("provider_unavailable");
    }
  }
}
