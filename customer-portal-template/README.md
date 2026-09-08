# Content Online Fokus template

This folder records the reusable product contract migrated from
`content-online-kundplatform-frontend`. Runtime code lives in
`src/customer-portal/` so the internal control plane and every customer portal
ship from one repository and one versioned deployment.

## What is retained

- the calm dashboard structure: overview, information products, usage,
  documents and customer service;
- KTH as an explicitly synthetic pilot under the `kth` tenant;
- customer-specific brand tokens, logo URL, copy and portal preset;
- per-customer D-ID embed settings and allowlisted client tools;
- strict tenant, role, provenance and truthfulness boundaries.

## What is deliberately not copied

- the old hard-coded KTH demo login and fallback session key;
- a second customer registry or a direct browser-to-database connection;
- customer-specific repositories or Vercel projects;
- real contracts, usage records, identities, credentials or licensed content.

## Publication model

1. Content Online creates a customer in the protected admin.
2. A readable, collision-aware slug such as `norrvik-teknik` is proposed.
3. Brand, publishers, portal preset and D-ID profile are saved on the tenant.
4. Publishing exposes the branded shell at `/portal/{slug}` on the existing
   `content-online-platform` Vercel deployment. Customer data remains protected.
5. A custom hostname may later be attached to that same Vercel project. It is
   optional and never creates a repository or project for the customer.

The path `/portal/{slug}` is the canonical customer URL until Content Online
explicitly enables a custom hostname.

The old frontend repository is a read-only migration source. It remains
untouched until Content Online accepts the verified production replacement and
the recoverable archive decision is recorded.
