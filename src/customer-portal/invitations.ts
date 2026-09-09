import { createClerkClient } from "@clerk/backend";
import type { AdminConfig } from "../admin/identity.js";

export type PortalInvitationRequest = {
  emailAddress: string;
  redirectUrl: string;
};

export interface PortalInvitationService {
  invite(request: PortalInvitationRequest): Promise<void>;
}

export type PortalInvitationProviderClient = {
  allowlistIdentifiers: {
    getAllowlistIdentifierList(params: { limit: number; offset: number }): Promise<{
      data: Array<{ identifier: string }>;
      totalCount: number;
    }>;
    createAllowlistIdentifier(params: { identifier: string; notify: boolean }): Promise<unknown>;
  };
  invitations: {
    createInvitation(params: {
      emailAddress: string;
      redirectUrl: string;
      expiresInDays: number;
      ignoreExisting: boolean;
      notify: boolean;
    }): Promise<unknown>;
  };
};

export class PortalInvitationError extends Error {
  constructor(public readonly code: "unconfigured" | "provider_unavailable") {
    super(code);
    this.name = "PortalInvitationError";
  }
}

export class ClerkPortalInvitationService implements PortalInvitationService {
  private readonly client: PortalInvitationProviderClient | null;

  constructor(config: AdminConfig, client?: PortalInvitationProviderClient) {
    this.client = client ?? (config.secretKey && config.publishableKey
      ? createClerkClient({ secretKey: config.secretKey, publishableKey: config.publishableKey })
      : null);
  }

  private async isAllowlisted(emailAddress: string): Promise<boolean> {
    if (!this.client) return false;
    const pageSize = 500;
    let offset = 0;
    while (true) {
      const page = await this.client.allowlistIdentifiers.getAllowlistIdentifierList({ limit: pageSize, offset });
      if (page.data.some((entry) => entry.identifier.toLowerCase() === emailAddress.toLowerCase())) return true;
      offset += page.data.length;
      if (page.data.length === 0 || offset >= page.totalCount) return false;
    }
  }

  private async ensureAllowlisted(emailAddress: string): Promise<void> {
    if (!this.client || await this.isAllowlisted(emailAddress)) return;
    try {
      await this.client.allowlistIdentifiers.createAllowlistIdentifier({ identifier: emailAddress, notify: false });
    } catch {
      // A concurrent request may have created the same identifier. Verify the
      // resulting server state instead of depending on provider error text.
      if (await this.isAllowlisted(emailAddress)) return;
      throw new PortalInvitationError("provider_unavailable");
    }
  }

  async invite({ emailAddress, redirectUrl }: PortalInvitationRequest): Promise<void> {
    if (!this.client) throw new PortalInvitationError("unconfigured");
    try {
      // The current shared Clerk instance has an explicit signup allowlist.
      // Synchronize the server-approved Neon member before issuing its ticket.
      await this.ensureAllowlisted(emailAddress);
      await this.client.invitations.createInvitation({
        emailAddress,
        redirectUrl,
        expiresInDays: 30,
        ignoreExisting: true,
        notify: true,
      });
    } catch (error) {
      if (error instanceof PortalInvitationError) throw error;
      // Provider payloads can contain identity details and must not cross this boundary.
      throw new PortalInvitationError("provider_unavailable");
    }
  }
}
