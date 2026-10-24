import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handler, router } from '../netlify/functions/api.mjs';

test('handler() responds to CORS OPTIONS preflight with 204', async () => {
  const event = {
    httpMethod: 'OPTIONS',
    path: '/api/customers'
  };

  const res = await handler(event, {});
  assert.equal(res.statusCode, 204);
  assert.equal(res.headers['Access-Control-Allow-Origin'], '*');
  assert.ok(res.headers['Access-Control-Allow-Methods'].includes('POST'));
});

test('handler() rejects malformed JSON with 400', async () => {
  const event = {
    httpMethod: 'POST',
    path: '/api/customers',
    body: '{ unclosed json'
  };

  const res = await handler(event, {});
  assert.equal(res.statusCode, 400);
  const body = JSON.parse(res.body);
  assert.ok(body.error.includes('Invalid JSON'));
});

test('router() returns 404 for unknown endpoints', async () => {
  const res = await router('GET', '/api/nonexistent-endpoint', {}, {});
  assert.equal(res.statusCode, 404);
  const body = JSON.parse(res.body);
  assert.ok(body.error.includes('Resource not found'));
});

test('router() returns 200 service metadata for root and /api', async () => {
  const resRoot = await router('GET', '/', {}, {});
  assert.equal(resRoot.statusCode, 200);
  const bodyRoot = JSON.parse(resRoot.body);
  assert.equal(bodyRoot.status, 'UP');
  assert.ok(bodyRoot.service.includes('SwiftShip'));

  const resApi = await router('GET', '/api', {}, {});
  assert.equal(resApi.statusCode, 200);
  const bodyApi = JSON.parse(resApi.body);
  assert.equal(bodyApi.status, 'UP');
});

test('router() validates required fields on customer creation', async () => {
  try {
    await router('POST', '/api/customers', {}, { email: 'test@example.com' });
    assert.fail('Should have thrown validation error');
  } catch (err) {
    assert.equal(err.status, 400);
    assert.ok(err.message.includes('name is required'));
  }
});

test('router() validates vehicle type restrictions', async () => {
  try {
    await router('POST', '/api/vehicles', {}, { type: 'SPACESHIP', registration: 'AB-123' });
    assert.fail('Should have thrown invalid vehicle type error');
  } catch (err) {
    assert.equal(err.status, 400);
    assert.ok(err.message.includes('Allowed: VAN, TRUCK, BIKE'));
  }
});

test('router() validates support ticket priority', async () => {
  try {
    await router('POST', '/api/support-tickets', {}, { customerId: 'C001', subject: 'Late delivery', priority: 'INVALID_PRIORITY' });
    assert.fail('Should have thrown invalid priority error');
  } catch (err) {
    assert.equal(err.status, 400);
    assert.ok(err.message.includes('Invalid ticket priority'));
  }
});

test('router() validates parcel booking inputs', async () => {
  try {
    await router('POST', '/api/parcels', {}, { customerId: 'C001' });
    assert.fail('Should have thrown validation error');
  } catch (err) {
    assert.equal(err.status, 400);
    assert.ok(err.message.includes('branch ID is required') || err.message.includes('weight'));
  }
});

test('router() validates delivery attempt result enum', async () => {
  try {
    await router('POST', '/api/delivery-attempts', {}, { trackingNumber: 'CR001', result: 'INVALID_RESULT' });
    assert.fail('Should have thrown invalid delivery result error');
  } catch (err) {
    assert.equal(err.status, 400);
    assert.ok(err.message.includes('Invalid delivery result'));
  }
});

test('router() validates payment method and status enums', async () => {
  try {
    await router('POST', '/api/payments', {}, { trackingNumber: 'CR001', method: 'BITCOIN', amount: 100 });
    assert.fail('Should have thrown invalid payment method error');
  } catch (err) {
    assert.equal(err.status, 400);
    assert.ok(err.message.includes('Invalid payment method'));
  }
});

test('router() validates branch creation inputs', async () => {
  try {
    await router('POST', '/api/branches', {}, { name: '' });
    assert.fail('Should have thrown validation error');
  } catch (err) {
    assert.equal(err.status, 400);
    assert.ok(err.message.includes('Branch name is required'));
  }
});

test('router() validates service creation inputs', async () => {
  try {
    await router('POST', '/api/services', {}, { name: '' });
    assert.fail('Should have thrown validation error');
  } catch (err) {
    assert.equal(err.status, 400);
    assert.ok(err.message.includes('Service name is required'));
  }
});

test('router() validates staff creation inputs', async () => {
  try {
    await router('POST', '/api/staff', {}, { name: '' });
    assert.fail('Should have thrown validation error');
  } catch (err) {
    assert.equal(err.status, 400);
    assert.ok(err.message.includes('Staff name is required'));
  }
});

test('router() handles health check route', async () => {
  const res = await router('GET', '/actuator/health', {}, {});
  assert.ok(res.statusCode === 200 || res.statusCode === 503);
  const body = JSON.parse(res.body);
  assert.ok(body.status === 'UP' || body.status === 'DOWN');
});

test('handler() supports Web Request signature (Netlify Functions v2)', async () => {
  const req = new Request('https://dbmsda3.netlify.app/api/nonexistent', {
    method: 'OPTIONS'
  });

  const res = await handler(req, {});
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*');
});
