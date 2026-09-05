import assert from 'node:assert/strict';
import { Script } from 'node:vm';

// Read-only HTTP smoke checks. No real user credentials or local dev server required.
const platform = 'https://content-online-platform.vercel.app';
const customer = 'https://fokus-psi-sable.vercel.app';
async function check(url, status, options = {}) {
  const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000), ...options });
  const body = await response.text();
  assert.equal(response.status, status, `${url}: unexpected HTTP status`);
  console.log(`${status} ${url}`);
  return { response, body };
}

await check(`${platform}/health`, 200);
const start = await check(platform, 200);
assert(start.body.includes('href="/kundportal"'));
assert(start.body.includes('href="/admin/login"'));
for (const path of ['/admin/login', '/admin/registrera', '/admin']) {
  const { body } = await check(`${platform}${path}`, 200);
  assert(body.includes('clerk.browser.js'));
  assert(!body.includes('sk_test_') && !body.includes('sk_live_'));
  assert(!body.includes('127.0.0.1'));
  for (const [, script] of body.matchAll(/<script>([\s\S]*?)<\/script>/g)) new Script(script);
}
const portal = await check(`${platform}/kundportal`, 302);
assert.equal(portal.response.headers.get('location'), `${customer}/login`);
assert.equal(portal.response.headers.get('set-cookie'), null);
await check(`${platform}/admin/api/session`, 401);
await check(`${platform}/admin/api/users`, 401);
await check(`${platform}/admin/api/workspace`, 401);
await check(`${platform}/admin/api/workspace?demo=true`, 401, {
  headers: { cookie: 'co_session=customer-admin', 'x-role': 'content_admin', 'x-customer-id': 'kth' },
});
await check(`${platform}/admin/api/publishers`, 401, { method: 'POST' });
await check(`${platform}/admin/api/session`, 401, { headers: { cookie: 'session=customer-admin; co_operator_session=demo-operator' } });
await check(`${platform}/admin/api/session`, 401, { headers: { authorization: 'Bearer invalid-token' } });
await check(`${platform}/admin/api/session`, 403, { headers: { authorization: 'Bearer invalid-token', origin: customer } });
await check(`${platform}/v1/me`, 503);
const demo = await check(`${platform}/demo`, 200);
assert(demo.body.includes('data-mode="demo"'));
assert.equal(demo.response.headers.get('set-cookie'), null);
const fixtures = await check(`${platform}/demo/workspace`, 200);
assert.equal(fixtures.response.headers.get('set-cookie'), null);
const workspace = JSON.parse(fixtures.body);
assert.equal(workspace.customers.length, 3);
assert.equal(workspace.products.length, 8);
assert.equal(workspace.assignments.length, 14);
for (const organization of workspace.customers) {
  assert.deepEqual(workspace.assignments.filter(a => a.customerId === organization.id).map(a => a.productId), organization.productIds);
}
await check(`${platform}/demo/workspace`, 404, { method: 'POST' });
const client = await check(`${platform}/admin/assets/workspace.js`, 200);
new Script(client.body);
await check(`${customer}/login`, 200);
const staff = await check(`${customer}/content-online/login`, 307);
assert.equal(staff.response.headers.get('location'), `${platform}/admin/login`);
console.log('Hosted portal HTTP checks passed. First-user email verification still requires the administrator.');
