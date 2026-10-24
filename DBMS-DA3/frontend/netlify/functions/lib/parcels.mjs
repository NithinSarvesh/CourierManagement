/**
 * SwiftShip Netlify Functions - Parcel Operations
 */
import { runQuery } from './database.mjs';
import { paginate } from './utils.mjs';
import { mapParcelRow } from './dashboard.mjs';
import crypto from 'crypto';

export async function enrichParcels(parcels) {
  if (!parcels || parcels.length === 0) return;
  const trackingNumbers = parcels.map(p => p.trackingNumber).filter(Boolean);
  if (trackingNumbers.length === 0) return;

  const [eventRows, attemptRows] = await Promise.all([
    runQuery(
      `MATCH (p:Parcel)-[:HAS_TRACKING_EVENT]->(te:TrackingEvent)
       WHERE p.trackingNumber IN $trackingNumbers
       RETURN te.eventId AS eventId, p.trackingNumber AS trackingNumber,
              te.location AS location, te.status AS status,
              toString(te.timestamp) AS timestamp, te.remarks AS remarks
       ORDER BY te.timestamp ASC`,
      { trackingNumbers }
    ),
    runQuery(
      `MATCH (p:Parcel)-[:HAS_DELIVERY_ATTEMPT]->(da:DeliveryAttempt)
       WHERE p.trackingNumber IN $trackingNumbers
       RETURN da.attemptId AS attemptId, p.trackingNumber AS trackingNumber,
              da.attemptNumber AS attemptNumber, da.result AS result,
              da.remarks AS remarks, toString(da.timestamp) AS timestamp
       ORDER BY da.attemptNumber ASC`,
      { trackingNumbers }
    )
  ]);

  const eventMap = new Map();
  for (const ev of eventRows) {
    if (!eventMap.has(ev.trackingNumber)) {
      eventMap.set(ev.trackingNumber, []);
    }
    eventMap.get(ev.trackingNumber).push({
      eventId: ev.eventId,
      trackingNumber: ev.trackingNumber,
      location: ev.location,
      status: ev.status,
      remarks: ev.remarks,
      timestamp: ev.timestamp
    });
  }

  const attemptMap = new Map();
  for (const att of attemptRows) {
    if (!attemptMap.has(att.trackingNumber)) {
      attemptMap.set(att.trackingNumber, []);
    }
    attemptMap.get(att.trackingNumber).push({
      attemptId: att.attemptId,
      trackingNumber: att.trackingNumber,
      attemptNumber: att.attemptNumber !== undefined ? Number(att.attemptNumber) : 1,
      result: att.result,
      remarks: att.remarks,
      timestamp: att.timestamp
    });
  }

  for (const p of parcels) {
    if (!p.trackingEvents || p.trackingEvents.length === 0) {
      p.trackingEvents = eventMap.get(p.trackingNumber) || [];
    }
    if (!p.deliveryAttempts || p.deliveryAttempts.length === 0) {
      p.deliveryAttempts = attemptMap.get(p.trackingNumber) || [];
    }
  }
}

export async function getParcelByTrackingNumber(trackingNumber) {
  const rows = await runQuery(
    `MATCH (p:Parcel {trackingNumber: $trackingNumber})
     OPTIONAL MATCH (c:Customer)-[:BOOKED]->(p)
     OPTIONAL MATCH (p)-[:ORIGINATED_AT]->(ob:Branch)
     OPTIONAL MATCH (p)-[:DESTINED_FOR]->(db:Branch)
     OPTIONAL MATCH (p)-[:USES_SERVICE]->(cs:CourierService)
     OPTIONAL MATCH (da:DeliveryAgent)-[:ASSIGNED_TO]->(p)
     OPTIONAL MATCH (p)-[:HAS_PAYMENT]->(pay:Payment)
     RETURN p.trackingNumber AS trackingNumber,
            p.weight AS weight, p.deliveryCharge AS deliveryCharge, p.status AS status,
            c.customerId AS customerId, c.name AS customerName,
            c.email AS customerEmail, c.phone AS customerPhone, c.address AS customerAddress,
            COUNT { (c)-[:BOOKED]->(:Parcel) } AS customerTotalParcels,
            ob.branchId AS originBranchId, ob.name AS originBranchName, ob.city AS originCity,
            db.branchId AS destBranchId, db.name AS destBranchName, db.city AS destCity,
            cs.serviceId AS serviceId, cs.name AS serviceName,
            cs.estimatedDays AS estimatedDays, cs.baseCharge AS baseCharge,
            cs.description AS serviceDescription, coalesce(cs.active, true) AS serviceActive,
            da.agentId AS agentId, da.name AS agentName,
            da.phone AS agentPhone, da.status AS agentStatus,
            pay.paymentId AS paymentId, pay.amount AS paymentAmount,
            pay.method AS paymentMethod, pay.status AS paymentStatus,
            toString(pay.paymentDate) AS paymentDate, pay.transactionRef AS transactionRef`,
    { trackingNumber }
  );

  if (!rows || rows.length === 0 || !rows[0].trackingNumber) {
    const err = new Error(`Parcel not found with tracking number: ${trackingNumber}`);
    err.status = 404;
    throw err;
  }

  const dto = mapParcelRow(rows[0]);
  await enrichParcels([dto]);
  return dto;
}

export async function searchParcels({
  status = null,
  customerId = null,
  branchId = null,
  trackingNumber = null,
  page = 0,
  size = 10
} = {}) {
  const p = Math.max(0, parseInt(page, 10) || 0);
  const s = Math.max(1, parseInt(size, 10) || 10);
  const skip = p * s;

  const filterStatus = status && status.trim() ? status.trim().toUpperCase() : null;
  const filterCustomer = customerId && customerId.trim() ? customerId.trim() : null;
  const filterBranch = branchId && branchId.trim() ? branchId.trim() : null;
  const filterTrk = trackingNumber && trackingNumber.trim() ? trackingNumber.trim() : null;

  const [parcelRows, countRows] = await Promise.all([
    runQuery(
      `MATCH (p:Parcel)
       OPTIONAL MATCH (c:Customer)-[:BOOKED]->(p)
       OPTIONAL MATCH (p)-[:ORIGINATED_AT]->(ob:Branch)
       OPTIONAL MATCH (p)-[:DESTINED_FOR]->(db:Branch)
       OPTIONAL MATCH (p)-[:USES_SERVICE]->(cs:CourierService)
       OPTIONAL MATCH (da:DeliveryAgent)-[:ASSIGNED_TO]->(p)
       OPTIONAL MATCH (p)-[:HAS_PAYMENT]->(pay:Payment)
       WHERE ($status IS NULL OR p.status = $status)
         AND ($customerId IS NULL OR c.customerId = $customerId)
         AND ($branchId IS NULL OR ob.branchId = $branchId OR db.branchId = $branchId)
         AND ($trackingNumber IS NULL OR p.trackingNumber CONTAINS $trackingNumber)
       RETURN p.trackingNumber AS trackingNumber,
              p.weight AS weight, p.deliveryCharge AS deliveryCharge, p.status AS status,
              c.customerId AS customerId, c.name AS customerName,
              c.email AS customerEmail, c.phone AS customerPhone, c.address AS customerAddress,
              COUNT { (c)-[:BOOKED]->(:Parcel) } AS customerTotalParcels,
              ob.branchId AS originBranchId, ob.name AS originBranchName, ob.city AS originCity,
              db.branchId AS destBranchId, db.name AS destBranchName, db.city AS destCity,
              cs.serviceId AS serviceId, cs.name AS serviceName,
              cs.estimatedDays AS estimatedDays, cs.baseCharge AS baseCharge,
              cs.description AS serviceDescription, coalesce(cs.active, true) AS serviceActive,
              da.agentId AS agentId, da.name AS agentName,
              da.phone AS agentPhone, da.status AS agentStatus,
              pay.paymentId AS paymentId, pay.amount AS paymentAmount,
              pay.method AS paymentMethod, pay.status AS paymentStatus,
              toString(pay.paymentDate) AS paymentDate, pay.transactionRef AS transactionRef
       ORDER BY p.trackingNumber DESC SKIP $skip LIMIT $limit`,
      {
        status: filterStatus,
        customerId: filterCustomer,
        branchId: filterBranch,
        trackingNumber: filterTrk,
        skip,
        limit: s
      }
    ),
    runQuery(
      `MATCH (p:Parcel)
       OPTIONAL MATCH (c:Customer)-[:BOOKED]->(p)
       OPTIONAL MATCH (p)-[:ORIGINATED_AT]->(ob:Branch)
       OPTIONAL MATCH (p)-[:DESTINED_FOR]->(db:Branch)
       WHERE ($status IS NULL OR p.status = $status)
         AND ($customerId IS NULL OR c.customerId = $customerId)
         AND ($branchId IS NULL OR ob.branchId = $branchId OR db.branchId = $branchId)
         AND ($trackingNumber IS NULL OR p.trackingNumber CONTAINS $trackingNumber)
       RETURN count(DISTINCT p) AS total`,
      {
        status: filterStatus,
        customerId: filterCustomer,
        branchId: filterBranch,
        trackingNumber: filterTrk
      }
    )
  ]);

  const parcels = parcelRows.map(mapParcelRow);
  await enrichParcels(parcels);

  const total = countRows[0]?.total || 0;
  return paginate(parcels, p, s, total);
}

export async function bookParcel(data) {
  if (!data.customerId || !data.customerId.trim()) {
    const err = new Error('Customer ID is required');
    err.status = 400;
    throw err;
  }
  if (!data.originBranchId || !data.originBranchId.trim()) {
    const err = new Error('Origin branch ID is required');
    err.status = 400;
    throw err;
  }
  if (!data.destinationBranchId || !data.destinationBranchId.trim()) {
    const err = new Error('Destination branch ID is required');
    err.status = 400;
    throw err;
  }
  if (!data.serviceId || !data.serviceId.trim()) {
    const err = new Error('Courier service ID is required');
    err.status = 400;
    throw err;
  }
  if (data.weight === undefined || data.weight === null || Number(data.weight) <= 0) {
    const err = new Error('Parcel weight must be greater than zero');
    err.status = 400;
    throw err;
  }

  // Validate related entities
  const [custRows, originRows, destRows, serviceRows] = await Promise.all([
    runQuery('MATCH (c:Customer {customerId: $id}) RETURN c.customerId AS id', { id: data.customerId.trim() }),
    runQuery('MATCH (b:Branch {branchId: $id}) RETURN b.branchId AS id, b.name AS name', { id: data.originBranchId.trim() }),
    runQuery('MATCH (b:Branch {branchId: $id}) RETURN b.branchId AS id, b.name AS name', { id: data.destinationBranchId.trim() }),
    runQuery('MATCH (cs:CourierService {serviceId: $id}) RETURN cs.serviceId AS id, cs.name AS name, cs.baseCharge AS baseCharge', { id: data.serviceId.trim() })
  ]);

  if (custRows.length === 0) {
    const err = new Error(`Customer not found with ID: ${data.customerId}`);
    err.status = 404;
    throw err;
  }
  if (originRows.length === 0) {
    const err = new Error(`Origin branch not found with ID: ${data.originBranchId}`);
    err.status = 404;
    throw err;
  }
  if (destRows.length === 0) {
    const err = new Error(`Destination branch not found with ID: ${data.destinationBranchId}`);
    err.status = 404;
    throw err;
  }
  if (serviceRows.length === 0) {
    const err = new Error(`Courier service not found with ID: ${data.serviceId}`);
    err.status = 404;
    throw err;
  }

  let trackingNumber = data.trackingNumber ? data.trackingNumber.trim() : '';
  if (!trackingNumber) {
    const countRows = await runQuery('MATCH (p:Parcel) RETURN count(p) AS total');
    const total = countRows[0]?.total || 0;
    trackingNumber = 'CR' + String(total + 1).padStart(3, '0');

    let exists = (await runQuery('MATCH (p:Parcel {trackingNumber: $tn}) RETURN p.trackingNumber AS tn', { tn: trackingNumber })).length > 0;
    while (exists) {
      trackingNumber = 'CR' + crypto.randomUUID().substring(0, 5).toUpperCase();
      exists = (await runQuery('MATCH (p:Parcel {trackingNumber: $tn}) RETURN p.trackingNumber AS tn', { tn: trackingNumber })).length > 0;
    }
  } else {
    const exists = (await runQuery('MATCH (p:Parcel {trackingNumber: $tn}) RETURN p.trackingNumber AS tn', { tn: trackingNumber })).length > 0;
    if (exists) {
      const err = new Error(`Parcel with tracking number '${trackingNumber}' already exists`);
      err.status = 409;
      throw err;
    }
  }

  // Calculate delivery charge
  const baseCharge = serviceRows[0].baseCharge !== undefined ? Number(serviceRows[0].baseCharge) : 100.0;
  const weight = Number(data.weight);
  const extraWeight = Math.max(0.0, weight - 1.0);
  const deliveryCharge = Math.round((baseCharge + extraWeight * 40.0) * 100.0) / 100.0;

  // Create Parcel and Relationships
  await runQuery(
    `MATCH (c:Customer {customerId: $customerId}),
           (ob:Branch {branchId: $originBranchId}),
           (db:Branch {branchId: $destinationBranchId}),
           (cs:CourierService {serviceId: $serviceId})
     CREATE (p:Parcel {trackingNumber: $trackingNumber, weight: $weight, deliveryCharge: $deliveryCharge, status: 'BOOKED'})
     MERGE (c)-[:BOOKED]->(p)
     MERGE (p)-[:ORIGINATED_AT]->(ob)
     MERGE (p)-[:DESTINED_FOR]->(db)
     MERGE (p)-[:USES_SERVICE]->(cs)
     RETURN p.trackingNumber AS trackingNumber`,
    {
      trackingNumber,
      weight,
      deliveryCharge,
      customerId: data.customerId.trim(),
      originBranchId: data.originBranchId.trim(),
      destinationBranchId: data.destinationBranchId.trim(),
      serviceId: data.serviceId.trim()
    },
    { write: true }
  );

  // Add initial tracking event
  const originName = originRows[0].name || 'Origin Hub';
  const serviceName = serviceRows[0].name || 'Standard';
  const eventId = 'T' + crypto.randomUUID().substring(0, 6).toUpperCase();
  const nowIso = new Date().toISOString();

  await runQuery(
    `MATCH (p:Parcel {trackingNumber: $trackingNumber})
     CREATE (te:TrackingEvent {eventId: $eventId, location: $location, status: 'BOOKED', timestamp: datetime($timestamp), remarks: $remarks})
     MERGE (p)-[:HAS_TRACKING_EVENT]->(te)
     RETURN te.eventId AS eventId`,
    {
      trackingNumber,
      eventId,
      location: originName,
      timestamp: nowIso,
      remarks: `Parcel booked at ${originName} via ${serviceName}`
    },
    { write: true }
  );

  return await getParcelByTrackingNumber(trackingNumber);
}

export async function updateParcel(trackingNumber, data) {
  const parcel = await getParcelByTrackingNumber(trackingNumber);

  if (parcel.status === 'DELIVERED') {
    const err = new Error('Delivered parcels cannot be modified');
    err.status = 400;
    throw err;
  }
  if (parcel.status === 'CANCELLED') {
    const err = new Error('Cancelled parcels cannot be modified');
    err.status = 400;
    throw err;
  }

  const newWeight = data.weight !== undefined && data.weight !== null ? Number(data.weight) : parcel.weight;
  let newCharge = parcel.deliveryCharge;

  if (data.weight !== undefined && data.weight !== null && Number(data.weight) !== parcel.weight) {
    const weightDiff = newWeight - parcel.weight;
    newCharge = Math.max(100.0, Math.round((parcel.deliveryCharge + weightDiff * 40.0) * 100.0) / 100.0);

    // If charge changed and payment is already PAID, prevent change
    if (Math.abs(newCharge - parcel.deliveryCharge) > 0.001) {
      const payRows = await runQuery(
        'MATCH (p:Parcel {trackingNumber: $tn})-[:HAS_PAYMENT]->(pay:Payment) RETURN pay.status AS status',
        { tn: trackingNumber }
      );
      if (payRows.length > 0 && String(payRows[0].status).toUpperCase() === 'PAID') {
        const err = new Error('Cannot change delivery charge because this parcel already has a PAID payment');
        err.status = 400;
        throw err;
      }
    }
  }

  await runQuery(
    `MATCH (p:Parcel {trackingNumber: $trackingNumber})
     SET p.weight = $weight, p.deliveryCharge = $deliveryCharge
     RETURN p.trackingNumber AS trackingNumber`,
    {
      trackingNumber,
      weight: newWeight,
      deliveryCharge: newCharge
    },
    { write: true }
  );

  return await getParcelByTrackingNumber(trackingNumber);
}

export async function cancelParcel(trackingNumber, reason = null) {
  const parcel = await getParcelByTrackingNumber(trackingNumber);

  if (parcel.status === 'DELIVERED') {
    const err = new Error('Delivered parcels cannot be cancelled');
    err.status = 400;
    throw err;
  }
  if (parcel.status === 'CANCELLED') {
    const err = new Error('Parcel is already cancelled');
    err.status = 400;
    throw err;
  }

  await runQuery(
    `MATCH (p:Parcel {trackingNumber: $trackingNumber})
     SET p.status = 'CANCELLED'
     RETURN p.trackingNumber AS trackingNumber`,
    { trackingNumber },
    { write: true }
  );

  const eventId = 'T' + crypto.randomUUID().substring(0, 6).toUpperCase();
  const remarks = reason && reason.trim() ? reason.trim() : 'Parcel booking cancelled by customer';
  const nowIso = new Date().toISOString();

  await runQuery(
    `MATCH (p:Parcel {trackingNumber: $trackingNumber})
     CREATE (te:TrackingEvent {eventId: $eventId, location: 'Origin / Central Hub', status: 'CANCELLED', timestamp: datetime($timestamp), remarks: $remarks})
     MERGE (p)-[:HAS_TRACKING_EVENT]->(te)
     RETURN te.eventId AS eventId`,
    {
      trackingNumber,
      eventId,
      timestamp: nowIso,
      remarks
    },
    { write: true }
  );

  return await getParcelByTrackingNumber(trackingNumber);
}
