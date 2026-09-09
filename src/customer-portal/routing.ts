const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeCustomerHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, "");
}

export function customerSlugFromHostname(hostname: string, rootDomain: string): string | null {
  const host = normalizeCustomerHostname(hostname);
  const root = normalizeCustomerHostname(rootDomain).replace(/^\*\./, "");
  if (!root || host === root || !host.endsWith(`.${root}`)) return null;
  const candidate = host.slice(0, -(root.length + 1));
  return candidate.length <= 63 && SLUG.test(candidate) ? candidate : null;
}

export function isPlatformHostname(hostname: string, platformHostname: string, rootDomain: string): boolean {
  const host = normalizeCustomerHostname(hostname);
  const platform = normalizeCustomerHostname(platformHostname);
  const root = normalizeCustomerHostname(rootDomain).replace(/^\*\./, "");
  return !host
    || host === platform
    || host === root
    || host === "localhost"
    || host === "127.0.0.1"
    || host === "[::1]"
    || host === "vercel.app"
    || host.endsWith(".vercel.app");
}

export function isCustomerSlug(value: string): boolean {
  return value.length <= 63 && SLUG.test(value);
}
