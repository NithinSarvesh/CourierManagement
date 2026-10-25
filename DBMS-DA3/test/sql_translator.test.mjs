import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSqlIsReadOnly,
  translateSqlToCypher,
  executeSqlQuery,
  GRAPH_SCHEMA
} from '../netlify/functions/lib/sql-translator.mjs';

test('validateSqlIsReadOnly allows valid SELECT statements', () => {
  assert.doesNotThrow(() => validateSqlIsReadOnly('SELECT * FROM customers'));
  assert.doesNotThrow(() => validateSqlIsReadOnly('SELECT name, email FROM customers WHERE name = "Alice"'));
  assert.doesNotThrow(() => validateSqlIsReadOnly('  select p.tracking_number, p.weight from parcels p order by p.weight desc limit 10  ; '));
});

test('validateSqlIsReadOnly blocks mutation keywords (INSERT, UPDATE, DELETE, DROP, ALTER)', () => {
  assert.throws(() => validateSqlIsReadOnly('INSERT INTO customers VALUES (1, "Bob")'), /Only read-only SELECT/);
  assert.throws(() => validateSqlIsReadOnly('UPDATE customers SET name = "Hacked"'), /Only read-only SELECT/);
  assert.throws(() => validateSqlIsReadOnly('DELETE FROM parcels WHERE weight > 10'), /Only read-only SELECT/);
  assert.throws(() => validateSqlIsReadOnly('DROP TABLE customers'), /Only read-only SELECT/);
  assert.throws(() => validateSqlIsReadOnly('ALTER TABLE parcels ADD COLUMN test VARCHAR'), /Only read-only SELECT/);
  assert.throws(() => validateSqlIsReadOnly('TRUNCATE TABLE tracking_events'), /Only read-only SELECT/);
});

test('validateSqlIsReadOnly blocks multi-statement SQL injection attempts', () => {
  assert.throws(
    () => validateSqlIsReadOnly('SELECT * FROM customers; DROP TABLE parcels;'),
    /Multiple SQL statements are not permitted/
  );
  assert.throws(
    () => validateSqlIsReadOnly('SELECT * FROM customers; DELETE FROM payments'),
    /Multiple SQL statements are not permitted/
  );
});

test('translateSqlToCypher translates simple SELECT on customers', () => {
  const result = translateSqlToCypher('SELECT name, email FROM customers LIMIT 20');
  assert.ok(result.cypher.includes('MATCH (c:Customer)'));
  assert.ok(result.cypher.includes('RETURN c.name AS name, c.email AS email'));
  assert.ok(result.cypher.includes('LIMIT toInteger($queryLimit)'));
  assert.equal(result.parameters.queryLimit, 20);
});

test('translateSqlToCypher handles aliases and table mapping', () => {
  const result = translateSqlToCypher('SELECT p.tracking_number, p.weight FROM parcels p LIMIT 10');
  assert.ok(result.cypher.includes('MATCH (p:Parcel)'));
  assert.ok(result.cypher.includes('RETURN p.trackingNumber AS trackingNumber, p.weight AS weight'));
  assert.equal(result.baseTable, 'Parcel');
});

test('translateSqlToCypher translates WHERE clauses and parameterizes values', () => {
  const result = translateSqlToCypher("SELECT name, email FROM customers WHERE name = 'Alice' AND customer_id = 'C001'");
  assert.ok(result.cypher.includes('WHERE c.name = $p0 AND c.customerId = $p1'));
  assert.equal(result.parameters.p0, 'Alice');
  assert.equal(result.parameters.p1, 'C001');
});

test('translateSqlToCypher translates LIKE operator to Cypher CONTAINS', () => {
  const result = translateSqlToCypher("SELECT tracking_number, status FROM parcels WHERE tracking_number LIKE '%CR123%'");
  assert.ok(result.cypher.includes('p.trackingNumber CONTAINS $p0'));
  assert.equal(result.parameters.p0, 'CR123');
});

test('translateSqlToCypher translates IN clause into parameterized list', () => {
  const result = translateSqlToCypher("SELECT tracking_number, status FROM parcels WHERE status IN ('DELIVERED', 'IN_TRANSIT')");
  assert.ok(result.cypher.includes('p.status IN $p0'));
  assert.deepEqual(result.parameters.p0, ['DELIVERED', 'IN_TRANSIT']);
});

test('translateSqlToCypher translates IS NULL and IS NOT NULL', () => {
  const nullResult = translateSqlToCypher('SELECT customer_id, name FROM customers WHERE address IS NULL');
  assert.ok(nullResult.cypher.includes('c.address IS NULL'));

  const notNullResult = translateSqlToCypher('SELECT customer_id, name FROM customers WHERE email IS NOT NULL');
  assert.ok(notNullResult.cypher.includes('c.email IS NOT NULL'));
});

test('translateSqlToCypher translates aggregations COUNT, SUM, AVG, MIN, MAX', () => {
  const result = translateSqlToCypher('SELECT count(*), sum(weight), avg(delivery_charge), min(weight), max(weight) FROM parcels');
  assert.ok(result.cypher.includes('count(*) AS count_all'));
  assert.ok(result.cypher.includes('sum(p.weight) AS sum_weight'));
  assert.ok(result.cypher.includes('avg(p.deliveryCharge) AS avg_deliveryCharge'));
  assert.ok(result.cypher.includes('min(p.weight) AS min_weight'));
  assert.ok(result.cypher.includes('max(p.weight) AS max_weight'));
});

test('translateSqlToCypher joins Customer and Parcel via graph relationships', () => {
  const sql = `
    SELECT c.name, p.tracking_number, p.weight
    FROM customers c
    JOIN parcels p ON c.customer_id = p.customer_id
    LIMIT 25
  `;
  const result = translateSqlToCypher(sql);
  assert.ok(result.cypher.includes('MATCH (c:Customer)'));
  assert.ok(result.cypher.includes('[:BOOKED]->(p:Parcel)'));
  assert.ok(result.cypher.includes('RETURN c.name AS name, p.trackingNumber AS trackingNumber, p.weight AS weight'));
});

test('translateSqlToCypher rejects unknown tables with informative error', () => {
  assert.throws(
    () => translateSqlToCypher('SELECT * FROM unknown_table'),
    /Unknown table 'unknown_table'/
  );
});

test('translateSqlToCypher rejects unknown columns with informative error', () => {
  assert.throws(
    () => translateSqlToCypher('SELECT non_existent_column FROM customers'),
    /Unknown column 'non_existent_column'/
  );
});

test('executeSqlQuery dryRun returns translation without touching database', async () => {
  const res = await executeSqlQuery('SELECT name, city FROM branches LIMIT 5', { dryRun: true });
  assert.equal(res.status, 'SUCCESS');
  assert.equal(res.dryRun, true);
  assert.ok(res.cypher.includes('MATCH (b:Branch)'));
  assert.equal(res.rowCount, 0);
  assert.ok(typeof res.durationMs === 'number');
});
