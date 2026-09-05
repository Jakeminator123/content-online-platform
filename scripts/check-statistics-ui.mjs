import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
const base = 'http://127.0.0.1:3000';
for (let attempt = 0; attempt < 90; attempt++) {
  try { if ((await fetch(base + '/demo')).ok) break; } catch {}
  if (attempt === 89) throw new Error('Local admin demo did not become ready');
  await new Promise(resolve => setTimeout(resolve, 1000));
}
await mkdir('test-artifacts', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + '/demo', { waitUntil: 'networkidle' });
  await page.locator('.stats-customer').first().waitFor();
  assert.equal(await page.locator('.stats-customer').count(), 3);
  await page.screenshot({ path: 'test-artifacts/admin-desktop.png', fullPage: true });
  await page.locator('.stats-customer [data-id="customer-kth-demo"]').click();
  for (const [view, count] of [['products', 8], ['publishers', 7], ['changes', 8]]) {
    await page.locator(`[data-stat-view="${view}"]`).click();
    assert.equal(await page.locator('#detail-body tbody tr').count(), count);
    assert.equal(await page.locator(`[data-stat-view="${view}"]`).getAttribute('aria-pressed'), 'true');
  }
  await page.screenshot({ path: 'test-artifacts/admin-kth-statistics.png', fullPage: true });
  await page.locator('[data-action="close"]').click();
  await page.locator('.stats-customer [data-id="customer-norrvik-demo"]').click();
  assert.ok((await page.locator('#detail-body').innerText()).includes('Saknad data är inte noll'));
  await page.locator('[data-action="close"]').click();
  for (const id of ['customers','users','publishers','products','connections','overview']) {
    await page.locator(`.nav [data-id="${id}"]`).click();
    assert.ok((await page.locator('#view').innerText()).length > 100);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-artifacts/admin-mobile.png', fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'No page-wide mobile overflow');
  await page.locator('#menu-toggle').click();
  assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'), 'true');
  await page.locator('.nav [data-id="customers"]').click();
  assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'), 'false');
  await page.locator('#search').fill('KTH');
  assert.equal(await page.locator('#view tbody tr').count(), 1);
  assert.deepEqual(errors, [], 'No client exceptions');
  console.log('Admin demo: statistics, missing data, navigation, search and mobile layout passed');
} finally {
  await browser.close();
}
