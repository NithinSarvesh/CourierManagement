import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEvent, json, noContent, error, paginate, CORS_HEADERS } from '../netlify/functions/lib/utils.mjs';

test('json() generates correct status code, headers, and body', () => {
  const payload = { success: true, count: 42 };
  const res = json(payload, 201, { 'X-Custom': 'test' });

  assert.equal(res.statusCode, 201);
  assert.equal(res.headers['Content-Type'], 'application/json');
  assert.equal(res.headers['Access-Control-Allow-Origin'], '*');
  assert.equal(res.headers['X-Custom'], 'test');
  assert.deepEqual(JSON.parse(res.body), payload);
});

test('noContent() generates 204 and empty body', () => {
  const res = noContent();
  assert.equal(res.statusCode, 204);
  assert.equal(res.body, '');
  assert.equal(res.headers['Access-Control-Allow-Origin'], '*');
});

test('error() generates structured error response', () => {
  const res = error('Item not found', 404, { id: '123' });
  assert.equal(res.statusCode, 404);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.error, 'Item not found');
  assert.equal(parsed.status, 404);
  assert.equal(parsed.details.id, '123');
  assert.ok(parsed.timestamp);
});

test('parseEvent() parses Lambda v1 events accurately', () => {
  const event = {
    httpMethod: 'post',
    path: '/.netlify/functions/api/api/customers',
    queryStringParameters: { page: '1', size: '20' },
    body: JSON.stringify({ name: 'John Doe', email: 'john@example.com' })
  };

  const parsed = parseEvent(event);
  assert.equal(parsed.method, 'POST');
  assert.equal(parsed.path, '/api/customers');
  assert.equal(parsed.query.page, '1');
  assert.equal(parsed.body.name, 'John Doe');
});

test('parseEvent() handles query route rewrite', () => {
  const event = {
    httpMethod: 'GET',
    path: '/.netlify/functions/api',
    queryStringParameters: { route: '/api/parcels/CR001' }
  };

  const parsed = parseEvent(event);
  assert.equal(parsed.path, '/api/parcels/CR001');
});

test('parseEvent() handles malformed JSON safely', () => {
  const event = {
    httpMethod: 'POST',
    path: '/api/parcels',
    body: 'this is not valid json'
  };

  const parsed = parseEvent(event);
  assert.equal(parsed.body, null);
});

test('paginate() calculates page metrics correctly', () => {
  const items = [{ id: 1 }, { id: 2 }];
  const res = paginate(items, 1, 10, 25);

  assert.equal(res.page, 1);
  assert.equal(res.size, 10);
  assert.equal(res.totalElements, 25);
  assert.equal(res.totalPages, 3);
  assert.equal(res.first, false);
  assert.equal(res.last, false);
});
