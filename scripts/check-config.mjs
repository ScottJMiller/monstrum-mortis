import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const config = JSON.parse(await readFile(new URL('../wrangler.json', import.meta.url), 'utf8'));
assert.equal(config.name, 'monstrum-mortis');
assert.equal(config.workers_dev, true);
assert.equal(config.routes, undefined, 'This milestone must not route any existing domain to this Worker.');
assert.equal(config.assets.directory, './dist/client');
assert.deepEqual(config.assets.run_worker_first, ['/api/*']);
assert.equal(config.assets.not_found_handling, 'single-page-application');
assert.equal(config.migrations, undefined, 'Use exports or migrations, not both.');
const expected = new Map([
  ['ROOMS', 'LaboratoryRoom'], ['MATCHMAKING', 'MatchmakingPool'], ['GUEST_LEASES', 'GuestLease'],
]);
assert.equal(config.durable_objects.bindings.length, expected.size);
for (const binding of config.durable_objects.bindings) {
  assert.equal(binding.class_name, expected.get(binding.name));
  assert.deepEqual(config.exports[binding.class_name], { type: 'durable-object', storage: 'sqlite' });
}
console.log('Cloudflare configuration: workers.dev only; three SQLite-backed classes; API routing separated.');
