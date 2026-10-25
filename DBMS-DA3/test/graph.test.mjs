import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeProperties, getNodeCaption } from '../netlify/functions/lib/graph.mjs';

test('sanitizeProperties() removes sensitive keys while preserving logistics attributes', () => {
  const input = {
    trackingNumber: 'CR123456789',
    recipientName: 'Alice Smith',
    password: 'supersecretpass',
    authToken: 'eyJhbGciOi...',
    secretKey: 'xyz123',
    weight: 2.5,
    status: 'IN_TRANSIT'
  };

  const clean = sanitizeProperties(input);
  assert.equal(clean.trackingNumber, 'CR123456789');
  assert.equal(clean.recipientName, 'Alice Smith');
  assert.equal(clean.weight, 2.5);
  assert.equal(clean.status, 'IN_TRANSIT');
  assert.equal(clean.password, undefined);
  assert.equal(clean.authToken, undefined);
  assert.equal(clean.secretKey, undefined);
});

test('getNodeCaption() formats primary logistics identifiers accurately', () => {
  assert.equal(getNodeCaption(['Parcel'], { trackingNumber: 'CR998877' }, 'p-1'), 'CR998877');
  assert.equal(getNodeCaption(['Customer'], { name: 'Acme Corp', customerId: 'C100' }, 'c-1'), 'Acme Corp');
  assert.equal(getNodeCaption(['Branch'], { branchId: 'BR-NYC' }, 'b-1'), 'BR-NYC');
  assert.equal(getNodeCaption(['Vehicle'], { registrationNumber: 'DL-01-AB-1234' }, 'v-1'), 'DL-01-AB-1234');
  assert.equal(getNodeCaption(['CustomNode'], {}, 'elem:4:abc:9942'), 'CustomNode #9942');
  assert.equal(getNodeCaption([], {}, 'elem:4:xyz:1234'), 'Node #1234');
});
