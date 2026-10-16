import assert from 'node:assert/strict';
import test from 'node:test';
import {clientId} from '../src/client/random-id.ts';

test('secure-context UUID generation retains the native crypto receiver', () => {
  const source = {
    randomUUID() { assert.equal(this, source); return '12345678-1234-4234-8234-123456789abc' as `${string}-${string}-${string}-${string}-${string}`; },
    getRandomValues() { throw new Error('Native UUID should be used'); },
  };
  assert.equal(clientId(source), '12345678-1234-4234-8234-123456789abc');
});

test('HTTP fallback consumes secure random bytes and formats RFC version/variant without weakening other bits', () => {
  let calls = 0;
  const source = {getRandomValues<T extends ArrayBufferView | null>(array: T): T {
    assert.ok(array instanceof Uint8Array);assert.equal(array.length, 16);calls++;
    array.set([0x01,0x23,0x45,0x67,0x89,0xab,0xcd,0xef,0xfe,0xdc,0xba,0x98,0x76,0x54,0x32,0x10]);return array;
  }};
  assert.equal(clientId(source), '01234567-89ab-4def-bedc-ba9876543210');assert.equal(calls, 1);
});

test('entropy failures propagate instead of generating timestamp or Math.random replay keys', () => {
  assert.throws(() => clientId({getRandomValues() { throw new Error('Entropy unavailable'); }}), /Entropy unavailable/);
});
