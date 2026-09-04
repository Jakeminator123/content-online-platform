import { createClerkClient } from '@clerk/backend';

// Run explicitly with Vercel-provisioned environment values. Never commits an address or a key.
const email = process.env.CONTENT_ONLINE_ADMIN_EMAIL?.trim().toLowerCase();
const secretKey = process.env.CLERK_SECRET_KEY;
if (!email || !secretKey) throw new Error('Admin email and Clerk credentials are required');
const clerk = createClerkClient({ secretKey });
const allowlist = await clerk.allowlistIdentifiers.getAllowlistIdentifierList({ limit: 100 });
if (!allowlist.data.some((entry) => entry.identifier.toLowerCase() === email)) {
  await clerk.allowlistIdentifiers.createAllowlistIdentifier({ identifier: email, notify: false });
}
await clerk.instance.updateRestrictions({ allowlist: true });
await clerk.instance.update({ testMode: false, developmentOrigin: 'https://content-online-platform.vercel.app' });
console.log('Admin signup allowlist enabled; test verification disabled; no invitation email sent.');
