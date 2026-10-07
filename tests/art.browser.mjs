import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
const artifacts = resolve('dist/presentation-checks');
await mkdir(artifacts, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 0 } });
let browser;
try {
  await server.listen();
  const origin = server.resolvedUrls.local[0];
  browser = await chromium.launch({ executablePath: process.env.MM_CHROME_PATH ?? '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(new URL('/art-gallery', origin).href);
  await page.waitForSelector('.chamber-canvas canvas');
  assert.equal(await page.locator('input[type=checkbox]').count(), 30);
  const combinations = [
    ['razor talons', 'cathedral horns', 'all seeing cluster', 'auxiliary heart', 'counterweight tail'],
    ['kitten paws', 'false halo', 'mourning veil', 'too many smiles', 'existential organ'],
    ['candle flesh', 'spring tendons', 'venom glands', 'acid bladder', 'excessive viscera', 'storm organ'],
  ];
  for (const [i, combination] of combinations.entries()) {
    await page.getByRole('button', { name: 'Starter anatomy', exact: true }).click();
    for (const name of combination) await page.getByLabel(name, { exact: true }).check();
    await page.waitForFunction(() => !document.querySelector('.art-notice') && document.querySelector('.chamber-canvas canvas'));
    await page.screenshot({ path: `${artifacts}/mutation-combination-${i + 1}.png`, fullPage: true });
  }
  // Every individual module must decode and form a real creature composition in the same renderer.
  for (const record of JSON.parse(await readFile('src/assets/production.json', 'utf8')).filter(a => a.id.startsWith('mutation.'))) {
    await page.getByRole('button', { name: 'Starter anatomy', exact: true }).click();
    await page.getByLabel(record.id.replace('mutation.', '').replaceAll('-', ' '), { exact: true }).check();
    await page.waitForFunction(() => !document.querySelector('.art-notice') && document.querySelector('.chamber-canvas canvas'));
  }
  assert.deepEqual(errors, []);
  console.log('PASS: local gallery renders all 30 individual modules and three multi-part combinations without browser errors. Screenshots are local diagnostic artifacts, not gameplay.');
} finally { await browser?.close(); await server.close(); }
