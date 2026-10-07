import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, extname } from 'node:path';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { chromium } from 'playwright-core';

const persistence = await mkdtemp(join(tmpdir(), 'mm-presentation-'));
const artifacts = resolve('dist/presentation-checks');
await mkdir(artifacts, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.webp': 'image/webp' };
const mf = new Miniflare(convertV4MiniflareOptions({ name: 'monstrum-mortis', modules: true, scriptPath: resolve('dist/worker/worker.js'), compatibilityDate: '2026-10-05', resourcePersistencePath: persistence,
  durableObjects: Object.fromEntries(['LaboratoryRoom', 'MatchmakingPool', 'GuestLease'].map((className, i) => [['ROOMS', 'MATCHMAKING', 'GUEST_LEASES'][i], { className, useSQLite: true }])),
  serviceBindings: { ASSETS: async request => { const path = new URL(request.url).pathname; const file = path === '/' ? '/index.html' : path; try { return new Response(await readFile(resolve('dist/client') + file), { headers: { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream' } }); } catch { return new Response('Missing asset', { status: 404 }); } } },
}));
let browser;
let origin;
const errors = [];
const contexts = [];
async function scientist(width = 1280, reduced = false) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  contexts.push(context);
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin);
  await page.waitForSelector('.chamber-canvas canvas, .static-creature');
  return page;
}
async function roomConnected(page) { await page.waitForFunction(() => document.querySelector('.service-status')?.textContent?.includes('Room state is synchronized')); }
async function privateCreate(page, name) { await page.getByLabel('Player Name', { exact: true }).fill(name); await page.getByRole('button', { name: 'Create Private Laboratory', exact: true }).click(); await roomConnected(page); assert.equal(await page.evaluate(() => document.activeElement?.tagName), 'H2', 'entry restores focus to room heading'); return page.evaluate(() => JSON.parse(sessionStorage.getItem('mm.room.v2'))); }
async function checkA11y(page, label) {
  await page.addScriptTag({ path: resolve('node_modules/axe-core/axe.min.js') });
  const result = await page.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } }));
  assert.deepEqual(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), [], label);
}
async function noOverflow(page, label) { assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, label); }
let passed = 0;
function pass(label) { console.log(`PASS ${++passed}: ${label}`); }
try {
  origin = String(await mf.ready);
  browser = await chromium.launch({ executablePath: process.env.MM_CHROME_PATH ?? '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'] });
  const host = await scientist();
  await noOverflow(host, 'desktop overflow'); await checkA11y(host, 'desktop entry accessibility');
  await host.screenshot({ path: join(artifacts, 'desktop-entry.png'), fullPage: true });
  await host.keyboard.press('Tab'); assert.equal(await host.evaluate(() => document.activeElement?.textContent), 'Skip to laboratory controls');
  await host.keyboard.press('Enter');
  pass('desktop entry renders actual artwork; keyboard skip link, automated accessibility and width checks pass');
  const guestResponse = await host.request.post(new URL('/api/guests', origin).href, { data: { operationId: crypto.randomUUID() } });
  const guest = await guestResponse.json();
  await host.evaluate(g => localStorage.setItem('mm.guest.v3', JSON.stringify(g)), guest);
  const first = await privateCreate(host, 'Host Curator');
  const player = await scientist(390, true);
  await player.getByLabel('Player Name', { exact: true }).fill('Phone Curator');
  await player.getByLabel('Invitation code', { exact: true }).fill(first.roomId);
  await player.getByRole('button', { name: 'Join by Code', exact: true }).click(); await roomConnected(player);
  await host.locator('.roster li').filter({ hasText: 'Phone Curator' }).waitFor();
  await noOverflow(player, 'phone overflow'); await checkA11y(player, 'phone room accessibility');
  await player.screenshot({ path: join(artifacts, 'phone-room.png'), fullPage: true });
  assert.equal(await player.locator('.chamber-still').count(), 1);
  pass('independent desktop/390px phone contexts join the same room; reduced motion, roster and accessibility work');
  const display = await scientist(1920);
  await display.getByLabel('Invitation code', { exact: true }).fill(first.roomId);
  await display.getByLabel('Join as a display without a player seat').check();
  await display.getByRole('button', { name: 'Join by Code', exact: true }).click(); await roomConnected(display);
  assert.equal(await display.locator('.display-layout').count(), 1);
  assert.equal(await display.locator('.chamber-stage').evaluate(el => el.getBoundingClientRect().bottom < innerHeight), true, 'TV chamber fits vertically');
  assert.equal(await display.getByRole('button', { name: 'Start laboratory preview' }).count(), 0);
  await checkA11y(display, 'display accessibility');
  await display.screenshot({ path: join(artifacts, 'display-room.png'), fullPage: true });
  const snap = await host.request.get(new URL(`/api/rooms/${first.roomId}/snapshot`, origin).href, { headers: { Authorization: `Bearer ${first.reconnectToken}` } });
  assert.equal((await snap.json()).snapshot.players.length, 2);
  pass('display-only layout has no host action and consumes no player seat');
  let sockets = 0;
  host.on('websocket', () => sockets++);
  await host.getByText('Display & motion settings', { exact: true }).click();
  await host.getByLabel('Creature and laboratory motion').selectOption('reduced');
  await host.getByRole('button', { name: 'Pause decorative animation', exact: true }).click();
  await host.setViewportSize({ width: 760, height: 900 });
  await new Promise(r => setTimeout(r, 250)); assert.equal(sockets, 0);
  await host.getByRole('button', { name: 'Leave laboratory', exact: true }).click();
  await host.getByRole('button', { name: 'Join by Code', exact: true }).waitFor();
  await host.getByLabel('Invitation code', { exact: true }).fill(first.roomId);
  await host.getByRole('button', { name: 'Join by Code', exact: true }).click(); await roomConnected(host);
  const rejoined = await host.evaluate(() => JSON.parse(sessionStorage.getItem('mm.room.v2')));
  assert.notEqual(first.reconnectToken, rejoined.reconnectToken);
  await host.getByRole('button', { name: 'Leave laboratory', exact: true }).click();
  await host.getByRole('button', { name: 'Create Private Laboratory', exact: true }).click(); await roomConnected(host);
  const recreated = await host.evaluate(() => JSON.parse(sessionStorage.getItem('mm.room.v2')));
  assert.notEqual(first.roomId, recreated.roomId);
  pass('motion changes and resize keep the live socket; leave → rejoin and leave → create use fresh entries');
  await host.reload(); await roomConnected(host);
  assert.equal(await host.getByLabel('Creature and laboratory motion').inputValue(), 'reduced');
  await host.getByRole('button', { name: "Forget this device's credential", exact: true }).click();
  await host.getByRole('button', { name: 'Check previous session', exact: true }).click();
  await host.getByRole('button', { name: 'Leave previous laboratory', exact: true }).click();
  assert.equal(await host.evaluate(() => JSON.parse(localStorage.getItem('mm.guest.v3')).guestId), guest.guestId);
  pass('reload retains motion/room recovery; lost credentials can explicitly release the previous room without resetting the guest');
  for (const width of [320, 640, 768, 1280]) { await host.setViewportSize({ width, height: 900 }); await noOverflow(host, `${width}px overflow`); }
  await host.evaluate(() => { document.body.style.zoom = '200%'; }); await noOverflow(host, '200% zoom overflow');
  pass('320/640/768/1280px and 200% zoom avoid horizontal page overflow');
  const failed = await browser.newContext({ viewport: { width: 390, height: 844 } }); contexts.push(failed);
  await failed.route('**/creature.blob.webp', route => route.abort());
  const artPage = await failed.newPage(); let entries = 0; artPage.on('request', r => { if (r.method() === 'POST' && r.url().includes('/api/rooms/')) entries++; });
  await artPage.goto(origin); await artPage.getByRole('button', { name: 'Retry artwork' }).waitFor();
  assert.equal(await artPage.getByLabel('Player Name', { exact: true }).isEnabled(), true);
  await failed.unroute('**/creature.blob.webp'); await artPage.getByRole('button', { name: 'Retry artwork' }).click();
  await artPage.waitForSelector('.chamber-canvas canvas'); assert.equal(entries, 0);
  pass('failed artwork leaves entry controls usable; retry repairs the scene without repeating admission');
  // Force graphics initialization failure, then verify that the real layered images remain.
  const fallback = await browser.newContext(); contexts.push(fallback);
  await fallback.addInitScript(() => { HTMLCanvasElement.prototype.getContext = () => null; });
  const fallbackPage = await fallback.newPage(); await fallbackPage.goto(origin); await fallbackPage.waitForSelector('.static-creature');
  assert.equal(await fallbackPage.locator('.static-creature img').count(), 3);
  pass('graphics initialization failure uses the same real starter layers in the static fallback');
  const publicPages = await Promise.all([scientist(), scientist(390), scientist(768), scientist()]);
  for (const page of publicPages) {
    const skip = page.getByRole('button', { name: 'Skip rehearsal', exact: true });
    if (await skip.count()) await skip.click();
    await page.getByLabel('Regional pool').selectOption('americas');
    await page.getByRole('button', { name: 'Enter Quick Play', exact: true }).click();
  }
  await Promise.all(publicPages.map(async page => {
    const ready = page.getByRole('button', { name: 'Ready', exact: true });
    await ready.waitFor(); await ready.click();
  }));
  await Promise.all(publicPages.map(roomConnected));
  const publicCredentials = await Promise.all(publicPages.map(page => page.evaluate(() => JSON.parse(sessionStorage.getItem('mm.room.v2')))));
  assert.equal(new Set(publicCredentials.map(c => c.roomId)).size, 1);
  const publicSnapshot = await publicPages[0].request.get(new URL(`/api/rooms/${publicCredentials[0].roomId}/snapshot`, origin).href, { headers: { Authorization: `Bearer ${publicCredentials[0].reconnectToken}` } });
  const publicView = (await publicSnapshot.json()).snapshot;
  assert.equal(publicView.players.length, 4); assert.ok(publicView.players.every(p => !p.waitingForNextRound));
  await checkA11y(publicPages[0], 'public room accessibility');
  pass('four independent browser guests queue, confirm readiness and enter one hostless public laboratory with all fresh admissions eligible');

  assert.deepEqual(errors, [], 'uncaught browser errors');
  console.log(`Completed ${passed} browser scenarios. Screenshots: ${artifacts}. Headless desktop Chrome contexts emulate viewports; this is not physical-device verification.`);
} finally {
  await browser?.close(); await mf.dispose(); await rm(persistence, { recursive: true, force: true });
}
