const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function customerSlugFromHostname(hostname: string, rootDomain: string): string | null {
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");
  const root = rootDomain.trim().toLowerCase().replace(/^\*\./, "").replace(/\.$/, "");
  if (!root || host === root || !host.endsWith(`.${root}`)) return null;
  const candidate = host.slice(0, -(root.length + 1));
  return candidate.length <= 63 && SLUG.test(candidate) ? candidate : null;
}

export function isCustomerSlug(value: string): boolean {
  return value.length <= 63 && SLUG.test(value);
}
