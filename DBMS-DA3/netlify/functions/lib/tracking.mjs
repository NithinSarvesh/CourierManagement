/**
 * SwiftShip Netlify Functions - Tracking Operations
 */
import { runQuery } from './database.mjs';
import crypto from 'crypto';

export async function addTrackingEvent(trackingNumber, data) {
  if (!trackingNumber || !trackingNumber.trim()) {
    const err = new Error('Tracking number is required');
    err.status = 400;
    throw err;
  }
  if (!data.location || !data.location.trim()) {
    const err = new Error('Tracking location is required');
    err.status = 400;
    throw err;
  }
  if (!data.status || !data.status.trim()) {
    const err = new Error('Tracking status is required');
    err.status = 400;
    throw err;
  }

  const pRows = await runQuery('MATCH (p:Parcel {trackingNumber: $tn}) RETURN p.trackingNumber AS tn', { tn: trackingNumber.trim() });
  if (pRows.length === 0) {
    const err = new Error(`Parcel not found with tracking number: ${trackingNumber}`);
    err.status = 404;
    throw err;
  }

  const eventId = data.eventId ? data.eventId.trim() : 'T' + crypto.randomUUID().substring(0, 6).toUpperCase();
  const timestamp = data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString();
  const status = data.status.trim().toUpperCase();
  const remarks = data.remarks ? data.remarks.trim() : '';

  const rows = await runQuery(
    `MATCH (p:Parcel {trackingNumber: $trackingNumber})
     CREATE (te:TrackingEvent {eventId: $eventId, location: $location, status: $status, timestamp: datetime($timestamp), remarks: $remarks})
     MERGE (p)-[:HAS_TRACKING_EVENT]->(te)
     SET p.status = $status
     RETURN te.eventId AS eventId, p.trackingNumber AS trackingNumber, te.location AS location,
            te.status AS status, toString(te.timestamp) AS timestamp, te.remarks AS remarks`,
    {
      trackingNumber: trackingNumber.trim(),
      eventId,
      location: data.location.trim(),
      status,
      timestamp,
      remarks
    },
    { write: true }
  );

  return rows[0];
}

export async function getTrackingHistory(trackingNumber) {
  const pRows = await runQuery('MATCH (p:Parcel {trackingNumber: $tn}) RETURN p.trackingNumber AS tn', { tn: trackingNumber.trim() });
  if (pRows.length === 0) {
    const err = new Error(`Parcel not found with tracking number: ${trackingNumber}`);
    err.status = 404;
    throw err;
  }

  const rows = await runQuery(
    `MATCH (p:Parcel {trackingNumber: $trackingNumber})-[:HAS_TRACKING_EVENT]->(te:TrackingEvent)
     RETURN te.eventId AS eventId, p.trackingNumber AS trackingNumber, te.location AS location,
            te.status AS status, toString(te.timestamp) AS timestamp, te.remarks AS remarks
     ORDER BY te.timestamp ASC`,
    { trackingNumber: trackingNumber.trim() }
  );

  return rows;
}

export async function getCurrentStatus(trackingNumber) {
  const pRows = await runQuery('MATCH (p:Parcel {trackingNumber: $tn}) RETURN p.trackingNumber AS tn, p.status AS status', { tn: trackingNumber.trim() });
  if (pRows.length === 0) {
    const err = new Error(`Parcel not found with tracking number: ${trackingNumber}`);
    err.status = 404;
    throw err;
  }

  const latestRows = await runQuery(
    `MATCH (p:Parcel {trackingNumber: $trackingNumber})-[:HAS_TRACKING_EVENT]->(te:TrackingEvent)
     RETURN te.eventId AS eventId, p.trackingNumber AS trackingNumber, te.location AS location,
            te.status AS status, toString(te.timestamp) AS timestamp, te.remarks AS remarks
     ORDER BY te.timestamp DESC LIMIT 1`,
    { trackingNumber: trackingNumber.trim() }
  );

  return {
    trackingNumber: pRows[0].tn,
    currentStatus: pRows[0].status,
    latestEvent: latestRows[0] || null
  };
}

export async function getRecentEvents(limit = 20) {
  const l = Math.max(1, parseInt(limit, 10) || 20);
  const rows = await runQuery(
    `MATCH (p:Parcel)-[:HAS_TRACKING_EVENT]->(te:TrackingEvent)
     RETURN te.eventId AS eventId, p.trackingNumber AS trackingNumber, te.location AS location,
            te.status AS status, toString(te.timestamp) AS timestamp, te.remarks AS remarks
     ORDER BY te.timestamp DESC LIMIT $limit`,
    { limit: l }
  );
  return rows;
}
