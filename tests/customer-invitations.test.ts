import { describe, expect, it, vi } from "vitest";
import {
  ClerkPortalInvitationService,
  PortalInvitationError,
  type PortalInvitationProviderClient,
} from "../src/customer-portal/invitations.js";

const config = { allowedEmail: "admin@example.test", secretKey: "fixture", publishableKey: "fixture" };
const request = {
  emailAddress: "member@example.test",
  redirectUrl: "https://content-online-platform.vercel.app/registrera?portal=alpha",
};

function provider(initialIdentifiers: string[] = []) {
  const identifiers = [...initialIdentifiers];
  const getAllowlistIdentifierList = vi.fn(async ({ limit, offset }: { limit: number; offset: number }) => ({
    data: identifiers.slice(offset, offset + limit).map((identifier) => ({ identifier })),
    totalCount: identifiers.length,
  }));
  const createAllowlistIdentifier = vi.fn(async ({ identifier }: { identifier: string; notify: boolean }) => {
    identifiers.push(identifier);
    return { identifier };
  });
  const createInvitation = vi.fn(async () => ({ id: "invitation" }));
  const client: PortalInvitationProviderClient = {
    allowlistIdentifiers: { getAllowlistIdentifierList, createAllowlistIdentifier },
    invitations: { createInvitation },
  };
  return { client, identifiers, getAllowlistIdentifierList, createAllowlistIdentifier, createInvitation };
}

describe("Clerk portal invitation provisioning", () => {
  it("allowlists a Neon-approved member before sending the invitation", async () => {
    const fixture = provider();
    await new ClerkPortalInvitationService(config, fixture.client).invite(request);

    expect(fixture.createAllowlistIdentifier).toHaveBeenCalledWith({ identifier: request.emailAddress, notify: false });
    expect(fixture.createInvitation).toHaveBeenCalledWith({
      emailAddress: request.emailAddress,
      redirectUrl: request.redirectUrl,
      expiresInDays: 30,
      ignoreExisting: true,
      notify: true,
    });
    expect(fixture.createAllowlistIdentifier.mock.invocationCallOrder[0])
      .toBeLessThan(fixture.createInvitation.mock.invocationCallOrder[0]!);
  });

  it("reuses an existing case-insensitive allowlist entry", async () => {
    const fixture = provider(["MEMBER@EXAMPLE.TEST"]);
    await new ClerkPortalInvitationService(config, fixture.client).invite(request);

    expect(fixture.createAllowlistIdentifier).not.toHaveBeenCalled();
    expect(fixture.createInvitation).toHaveBeenCalledOnce();
  });

  it("accepts a concurrent duplicate only after verifying the resulting allowlist state", async () => {
    const fixture = provider();
    fixture.createAllowlistIdentifier.mockImplementationOnce(async ({ identifier }) => {
      fixture.identifiers.push(identifier);
      throw new Error("provider duplicate detail");
    });

    await new ClerkPortalInvitationService(config, fixture.client).invite(request);

    expect(fixture.getAllowlistIdentifierList).toHaveBeenCalledTimes(2);
    expect(fixture.createInvitation).toHaveBeenCalledOnce();
  });

  it("redacts an unverified provider failure", async () => {
    const fixture = provider();
    fixture.createAllowlistIdentifier.mockRejectedValueOnce(new Error("private provider response"));

    await expect(new ClerkPortalInvitationService(config, fixture.client).invite(request))
      .rejects.toEqual(expect.objectContaining<Partial<PortalInvitationError>>({
        name: "PortalInvitationError",
        code: "provider_unavailable",
        message: "provider_unavailable",
      }));
    expect(fixture.createInvitation).not.toHaveBeenCalled();
  });
});
