import type { PortalRepository } from "../application/ports.js";
import type {
  AuditEvent,
  Entitlement,
  Membership,
  OperatorOrganizationScope,
  Organization,
  PortalUser,
  Ticket,
  UsageObservation,
} from "../domain/models.js";

export type InMemorySeed = {
  users?: PortalUser[];
  organizations?: Organization[];
  memberships?: Membership[];
  operatorScopes?: OperatorOrganizationScope[];
  entitlements?: Entitlement[];
  usage?: UsageObservation[];
  tickets?: Ticket[];
  auditEvents?: AuditEvent[];
};

export class InMemoryPortalRepository implements PortalRepository {
  private readonly users: PortalUser[];
  private readonly organizations: Organization[];
  private readonly memberships: Membership[];
  private readonly operatorScopes: OperatorOrganizationScope[];
  private readonly entitlements: Entitlement[];
  private readonly usageById: Map<string, UsageObservation>;
  private readonly tickets: Ticket[];
  private readonly auditEvents: AuditEvent[];

  constructor(seed: InMemorySeed = {}) {
    this.users = structuredClone(seed.users ?? []);
    this.organizations = structuredClone(seed.organizations ?? []);
    this.memberships = structuredClone(seed.memberships ?? []);
    this.operatorScopes = structuredClone(seed.operatorScopes ?? []);
    this.entitlements = structuredClone(seed.entitlements ?? []);
    this.usageById = new Map((seed.usage ?? []).map((item) => [item.id, structuredClone(item)]));
    this.tickets = structuredClone(seed.tickets ?? []);
    this.auditEvents = structuredClone(seed.auditEvents ?? []);
  }

  async findUserByExternalSubject(subject: string): Promise<PortalUser | undefined> {
    return cloneOptional(this.users.find((user) => user.externalSubject === subject));
  }

  async findOrganization(organizationId: string): Promise<Organization | undefined> {
    return cloneOptional(this.organizations.find((organization) => organization.id === organizationId));
  }

  async listMembershipsForUser(userId: string): Promise<Membership[]> {
    return structuredClone(this.memberships.filter((membership) => membership.userId === userId));
  }

  async findMembership(userId: string, organizationId: string): Promise<Membership | undefined> {
    return cloneOptional(
      this.memberships.find(
        (membership) => membership.userId === userId && membership.organizationId === organizationId,
      ),
    );
  }

  async listOperatorScopes(userId: string): Promise<OperatorOrganizationScope[]> {
    return structuredClone(this.operatorScopes.filter((scope) => scope.userId === userId));
  }

  async listEntitlements(organizationId: string): Promise<Entitlement[]> {
    return structuredClone(
      this.entitlements.filter((entitlement) => entitlement.organizationId === organizationId),
    );
  }

  async listUsage(organizationId: string): Promise<UsageObservation[]> {
    return structuredClone(
      [...this.usageById.values()].filter((observation) => observation.organizationId === organizationId),
    );
  }

  async upsertUsage(observations: UsageObservation[]): Promise<void> {
    for (const observation of observations) {
      this.usageById.set(observation.id, structuredClone(observation));
    }
  }

  async listTickets(organizationId: string): Promise<Ticket[]> {
    return structuredClone(this.tickets.filter((ticket) => ticket.organizationId === organizationId));
  }

  async createTicketWithAudit(ticket: Ticket, auditEvent: AuditEvent): Promise<Ticket> {
    const stored = structuredClone(ticket);
    this.tickets.push(stored);
    this.auditEvents.push(structuredClone(auditEvent));
    return structuredClone(stored);
  }

  async listMembers(
    organizationId: string,
  ): Promise<Array<{ user: PortalUser; membership: Membership }>> {
    return this.memberships
      .filter((membership) => membership.organizationId === organizationId)
      .flatMap((membership) => {
        const user = this.users.find((candidate) => candidate.id === membership.userId);
        return user ? [{ user: structuredClone(user), membership: structuredClone(membership) }] : [];
      });
  }

  async appendAuditEvent(event: AuditEvent): Promise<void> {
    this.auditEvents.push(structuredClone(event));
  }

  async listAuditEvents(): Promise<AuditEvent[]> {
    return structuredClone(this.auditEvents);
  }
}

function cloneOptional<T>(value: T | undefined): T | undefined {
  return value === undefined ? undefined : structuredClone(value);
}
