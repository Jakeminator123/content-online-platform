# Content Online customer portal template

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
2. A clean desired domain such as `kth.portal.contentonline.se` is generated.
3. Brand, publishers, portal preset and D-ID profile are saved on the tenant.
4. Publishing exposes only the branded shell. Customer data remains protected.
5. The Vercel integration attaches and verifies `*.portal.contentonline.se` once;
   every published first-level subdomain then resolves to the same runtime.

The path `/portal/{slug}` is a review fallback while DNS is pending. It is not
the desired long-term customer URL.

The old frontend repository must remain untouched until this replacement has a
merged production deployment, a verified KTH route, customer authentication and
a tested rollback/archive decision.
