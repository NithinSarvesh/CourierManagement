import { test } from 'node:test';
import assert from 'node:assert/strict';
import neo4j from 'neo4j-driver';
import { toNative } from '../netlify/functions/lib/database.mjs';

test('toNative() converts Neo4j Integers to JavaScript numbers', () => {
  const smallInt = neo4j.int(42);
  assert.equal(typeof toNative(smallInt), 'number');
  assert.equal(toNative(smallInt), 42);

  const zeroInt = neo4j.int(0);
  assert.equal(toNative(zeroInt), 0);
});

test('toNative() converts Neo4j Nodes and Relationships to plain objects', () => {
  const fakeNode = {
    identity: neo4j.int(101),
    labels: ['Customer'],
    properties: {
      customerId: 'C001',
      name: 'Alice',
      parcelsCount: neo4j.int(5)
    }
  };

  const converted = toNative(fakeNode);
  assert.deepEqual(converted, {
    customerId: 'C001',
    name: 'Alice',
    parcelsCount: 5
  });
});

test('toNative() converts nested arrays and objects', () => {
  const complex = {
    total: neo4j.int(10),
    items: [
      { id: neo4j.int(1), active: true },
      { id: neo4j.int(2), active: false }
    ],
    metadata: {
      created: '2026-09-18T10:00:00Z',
      versions: [neo4j.int(1), neo4j.int(2)]
    }
  };

  const converted = toNative(complex);
  assert.deepEqual(converted, {
    total: 10,
    items: [
      { id: 1, active: true },
      { id: 2, active: false }
    ],
    metadata: {
      created: '2026-09-18T10:00:00Z',
      versions: [1, 2]
    }
  });
});

test('toNative() preserves primitives, null, and undefined', () => {
  assert.equal(toNative(null), null);
  assert.equal(toNative(undefined), undefined);
  assert.equal(toNative('test string'), 'test string');
  assert.equal(toNative(123.45), 123.45);
  assert.equal(toNative(true), true);
  assert.equal(toNative(false), false);
});
