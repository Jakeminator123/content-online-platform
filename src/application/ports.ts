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

export type AuthenticatedIdentity = {
  subject: string;
};

export interface IdentityProvider {
  authenticate(request: Request): Promise<AuthenticatedIdentity | null>;
}

export interface PortalRepository {
  findUserByExternalSubject(subject: string): Promise<PortalUser | undefined>;
  findOrganization(organizationId: string): Promise<Organization | undefined>;
  listMembershipsForUser(userId: string): Promise<Membership[]>;
  findMembership(userId: string, organizationId: string): Promise<Membership | undefined>;
  listOperatorScopes(userId: string): Promise<OperatorOrganizationScope[]>;
  listEntitlements(organizationId: string): Promise<Entitlement[]>;
  listUsage(organizationId: string): Promise<UsageObservation[]>;
  upsertUsage(observations: UsageObservation[]): Promise<void>;
  listTickets(organizationId: string): Promise<Ticket[]>;
  /** Persist both records atomically; durable adapters must use one transaction. */
  createTicketWithAudit(ticket: Ticket, auditEvent: AuditEvent): Promise<Ticket>;
  listMembers(organizationId: string): Promise<Array<{ user: PortalUser; membership: Membership }>>;
  appendAuditEvent(event: AuditEvent): Promise<void>;
  listAuditEvents(): Promise<AuditEvent[]>;
}

export type BackendDependencies = {
  identityProvider: IdentityProvider;
  repository: PortalRepository;
  clock: () => Date;
  createId: () => string;
};
