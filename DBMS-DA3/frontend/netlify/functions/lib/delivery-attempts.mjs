/**
 * SwiftShip Netlify Functions - Delivery Attempt Operations
 */
import { runQuery } from './database.mjs';
import crypto from 'crypto';

const ALLOWED_RESULTS = new Set([
  'SUCCESS',
  'CUSTOMER_UNAVAILABLE',
  'ADDRESS_NOT_FOUND',
  'REJECTED',
  'RESCHEDULED',
  'FAILED'
]);

export async function recordAttempt(data) {
  const trackingNumber = data.trackingNumber ? data.trackingNumber.trim() : '';
  if (!trackingNumber) {
    const err = new Error('Tracking number is required');
    err.status = 400;
    throw err;
  }

  const rawResult = data.result ? String(data.result).trim().toUpperCase() : '';
  if (!ALLOWED_RESULTS.has(rawResult)) {
    const err = new Error(`Invalid delivery result: ${data.result}. Allowed values: SUCCESS, CUSTOMER_UNAVAILABLE, ADDRESS_NOT_FOUND, REJECTED, RESCHEDULED, FAILED`);
    err.status = 400;
    throw err;
  }

  const pRows = await runQuery('MATCH (p:Parcel {trackingNumber: $tn}) RETURN p.trackingNumber AS tn, p.status AS status', { tn: trackingNumber });
  if (pRows.length === 0) {
    const err = new Error(`Parcel not found with tracking number: ${trackingNumber}`);
    err.status = 404;
    throw err;
  }

  const parcel = pRows[0];
  if (parcel.status === 'DELIVERED') {
    const err = new Error('Parcel is already delivered; no further delivery attempts allowed.');
    err.status = 400;
    throw err;
  }
  if (parcel.status === 'CANCELLED') {
    const err = new Error('Parcel is cancelled; cannot make delivery attempt.');
    err.status = 400;
    throw err;
  }

  let attemptNumber = data.attemptNumber !== undefined && data.attemptNumber !== null ? parseInt(data.attemptNumber, 10) : 0;
  if (!attemptNumber || attemptNumber <= 0) {
    const existing = await runQuery(
      'MATCH (p:Parcel {trackingNumber: $tn})-[:HAS_DELIVERY_ATTEMPT]->(da:DeliveryAttempt) RETURN count(da) AS count',
      { tn: trackingNumber }
    );
    attemptNumber = (existing[0]?.count || 0) + 1;
  }

  const countRows = await runQuery('MATCH (da:DeliveryAttempt) RETURN count(da) AS total');
  const total = countRows[0]?.total || 0;
  let attemptId = 'DA' + String(total + 1).padStart(3, '0');
  let exists = (await runQuery('MATCH (da:DeliveryAttempt {attemptId: $id}) RETURN da.attemptId AS id', { id: attemptId })).length > 0;
  while (exists) {
    attemptId = 'DA' + crypto.randomUUID().substring(0, 5).toUpperCase();
    exists = (await runQuery('MATCH (da:DeliveryAttempt {attemptId: $id}) RETURN da.attemptId AS id', { id: attemptId })).length > 0;
  }

  const timestamp = data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString();
  const remarks = data.remarks ? data.remarks.trim() : '';

  const rows = await runQuery(
    `MATCH (p:Parcel {trackingNumber: $trackingNumber})
     CREATE (da:DeliveryAttempt {attemptId: $attemptId, attemptNumber: $attemptNumber, result: $result, remarks: $remarks, timestamp: datetime($timestamp)})
     MERGE (p)-[:HAS_DELIVERY_ATTEMPT]->(da)
     RETURN da.attemptId AS attemptId, p.trackingNumber AS trackingNumber, da.attemptNumber AS attemptNumber,
            da.result AS result, da.remarks AS remarks, toString(da.timestamp) AS timestamp`,
    {
      trackingNumber,
      attemptId,
      attemptNumber,
      result: rawResult,
      remarks,
      timestamp
    },
    { write: true }
  );

  // Synchronize parcel status & tracking
  if (rawResult === 'SUCCESS') {
    await runQuery('MATCH (p:Parcel {trackingNumber: $tn}) SET p.status = "DELIVERED"', { tn: trackingNumber }, { write: true });
    const eventId = 'T' + crypto.randomUUID().substring(0, 6).toUpperCase();
    await runQuery(
      `MATCH (p:Parcel {trackingNumber: $tn})
       CREATE (te:TrackingEvent {eventId: $eventId, location: "Destination Address", status: "DELIVERED", timestamp: datetime($timestamp), remarks: "Delivery attempt successful. Parcel delivered."})
       MERGE (p)-[:HAS_TRACKING_EVENT]->(te)`,
      { tn: trackingNumber, eventId, timestamp: new Date().toISOString() },
      { write: true }
    );
  } else if (attemptNumber >= 3) {
    await runQuery('MATCH (p:Parcel {trackingNumber: $tn}) SET p.status = "DELIVERY_FAILED"', { tn: trackingNumber }, { write: true });
    const eventId = 'T' + crypto.randomUUID().substring(0, 6).toUpperCase();
    await runQuery(
      `MATCH (p:Parcel {trackingNumber: $tn})
       CREATE (te:TrackingEvent {eventId: $eventId, location: "Destination Delivery Station", status: "DELIVERY_FAILED", timestamp: datetime($timestamp), remarks: $remarks})
       MERGE (p)-[:HAS_TRACKING_EVENT]->(te)`,
      { tn: trackingNumber, eventId, timestamp: new Date().toISOString(), remarks: `Max delivery attempts exceeded: ${rawResult}` },
      { write: true }
    );
  }

  const created = rows[0];
  return {
    attemptId: created.attemptId,
    trackingNumber: created.trackingNumber,
    attemptNumber: Number(created.attemptNumber),
    result: created.result,
    remarks: created.remarks,
    timestamp: created.timestamp
  };
}

export async function getAttemptsByParcel(trackingNumber) {
  const pRows = await runQuery('MATCH (p:Parcel {trackingNumber: $tn}) RETURN p.trackingNumber AS tn', { tn: trackingNumber.trim() });
  if (pRows.length === 0) {
    const err = new Error(`Parcel not found with tracking number: ${trackingNumber}`);
    err.status = 404;
    throw err;
  }

  const rows = await runQuery(
    `MATCH (p:Parcel {trackingNumber: $trackingNumber})-[:HAS_DELIVERY_ATTEMPT]->(da:DeliveryAttempt)
     RETURN da.attemptId AS attemptId, p.trackingNumber AS trackingNumber, da.attemptNumber AS attemptNumber,
            da.result AS result, da.remarks AS remarks, toString(da.timestamp) AS timestamp
     ORDER BY da.attemptNumber ASC`,
    { trackingNumber: trackingNumber.trim() }
  );

  return rows.map(r => ({
    attemptId: r.attemptId,
    trackingNumber: r.trackingNumber,
    attemptNumber: Number(r.attemptNumber),
    result: r.result,
    remarks: r.remarks,
    timestamp: r.timestamp
  }));
}

export async function getAllAttempts() {
  const rows = await runQuery(
    `MATCH (p:Parcel)-[:HAS_DELIVERY_ATTEMPT]->(da:DeliveryAttempt)
     RETURN da.attemptId AS attemptId, p.trackingNumber AS trackingNumber, da.attemptNumber AS attemptNumber,
            da.result AS result, da.remarks AS remarks, toString(da.timestamp) AS timestamp
     ORDER BY da.timestamp DESC`
  );

  return rows.map(r => ({
    attemptId: r.attemptId,
    trackingNumber: r.trackingNumber,
    attemptNumber: Number(r.attemptNumber),
    result: r.result,
    remarks: r.remarks,
    timestamp: r.timestamp
  }));
}
