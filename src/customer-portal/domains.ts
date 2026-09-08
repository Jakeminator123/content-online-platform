export type CustomerDomainResult = { status: "ready" | "pending"; managedDomain: string };

export interface CustomerDomainService {
  ensure(domain: string): Promise<CustomerDomainResult>;
}

export class CustomerDomainError extends Error {
  constructor(public readonly code: "unconfigured" | "unavailable") { super(code); }
}

function isHostname(value: string): boolean {
  return value.length <= 253 && value.split(".").length >= 2 && value.split(".").every((label) =>
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label),
  );
}

export class VercelCustomerDomainService implements CustomerDomainService {
  constructor(
    private readonly config: { token: string; projectId: string; teamId: string; portalRootDomain: string },
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async ensure(input: string): Promise<CustomerDomainResult> {
    const domain = input.trim().toLowerCase();
    const root = this.config.portalRootDomain.trim().toLowerCase();
    if (!this.config.token || !this.config.projectId || !this.config.teamId || !isHostname(root)) {
      throw new CustomerDomainError("unconfigured");
    }
    if (!isHostname(domain)) throw new CustomerDomainError("unavailable");
    const managedDomain = domain.endsWith(`.${root}`) ? `*.${root}` : domain;
    const query = new URLSearchParams({ teamId: this.config.teamId });
    const project = encodeURIComponent(this.config.projectId);
    const headers = {
      authorization: `Bearer ${this.config.token}`,
      "content-type": "application/json",
    };
    const detail = `https://api.vercel.com/v9/projects/${project}/domains/${encodeURIComponent(managedDomain)}?${query}`;
    const existing = await this.request(detail, { method: "GET", headers }, [404]);
    let current = existing.status === 404 ? null : await this.readJson(existing);
    if (!current) {
      const add = await this.request(`https://api.vercel.com/v9/projects/${project}/domains?${query}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name: managedDomain }),
      }, [409]);
      current = add.status === 409 ? null : await this.readJson(add);
    }
    if (current?.verified === true) return { status: "ready", managedDomain };

    const verify = await this.request(
      `https://api.vercel.com/v9/projects/${project}/domains/${encodeURIComponent(managedDomain)}/verify?${query}`,
      { method: "POST", headers },
      [400, 409],
    );
    const verified = await this.readJson(verify);
    return { status: verified?.verified === true ? "ready" : "pending", managedDomain };
  }

  private async request(url: string, init: RequestInit, tolerated: number[]): Promise<Response> {
    try {
      const response = await this.fetchImpl(url, {
        ...init,
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });
      if (response.ok || tolerated.includes(response.status)) return response;
      throw new CustomerDomainError("unavailable");
    } catch (error) {
      if (error instanceof CustomerDomainError) throw error;
      throw new CustomerDomainError("unavailable");
    }
  }

  private async readJson(response: Response): Promise<{ verified?: unknown } | null> {
    try {
      const value = await response.json();
      return value && typeof value === "object" ? value as { verified?: unknown } : null;
    } catch { return null; }
  }
}

export function customerDomainServiceFromEnvironment(fetchImpl: typeof fetch = fetch): CustomerDomainService {
  return new VercelCustomerDomainService({
    token: process.env.VERCEL_AUTOMATION_TOKEN?.trim() ?? "",
    projectId: process.env.VERCEL_PROJECT_ID?.trim() ?? "",
    teamId: process.env.VERCEL_TEAM_ID?.trim() ?? "",
    portalRootDomain: process.env.CUSTOMER_PORTAL_ROOT_DOMAIN?.trim() ?? "",
  }, fetchImpl);
}
