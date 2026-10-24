/**
 * SwiftShip Netlify Functions - Branch Operations
 */
import { runQuery } from './database.mjs';
import { mapParcelRow } from './dashboard.mjs';
import { enrichParcels } from './parcels.mjs';
import crypto from 'crypto';

export async function createBranch(data) {
  if (!data.name || !data.name.trim()) {
    const err = new Error('Branch name is required');
    err.status = 400;
    throw err;
  }
  if (!data.city || !data.city.trim()) {
    const err = new Error('Branch city is required');
    err.status = 400;
    throw err;
  }

  let branchId = data.branchId ? data.branchId.trim() : '';
  if (!branchId) {
    const countRows = await runQuery('MATCH (b:Branch) RETURN count(b) AS total');
    const total = countRows[0]?.total || 0;
    branchId = 'B' + String(total + 1).padStart(3, '0');

    let exists = (await runQuery('MATCH (b:Branch {branchId: $id}) RETURN b.branchId AS id', { id: branchId })).length > 0;
    while (exists) {
      branchId = 'B' + crypto.randomUUID().substring(0, 4).toUpperCase();
      exists = (await runQuery('MATCH (b:Branch {branchId: $id}) RETURN b.branchId AS id', { id: branchId })).length > 0;
    }
  } else {
    const exists = (await runQuery('MATCH (b:Branch {branchId: $id}) RETURN b.branchId AS id', { id: branchId })).length > 0;
    if (exists) {
      const err = new Error(`Branch with ID '${branchId}' already exists`);
      err.status = 409;
      throw err;
    }
  }

  await runQuery(
    `MERGE (b:Branch {branchId: $branchId})
     ON CREATE SET b.name = $name, b.city = $city
     ON MATCH SET b.name = $name, b.city = $city
     RETURN b.branchId AS branchId`,
    {
      branchId,
      name: data.name.trim(),
      city: data.city.trim()
    },
    { write: true }
  );

  return await getBranchById(branchId);
}

export async function listBranches() {
  const rows = await runQuery(`
    MATCH (b:Branch)
    OPTIONAL MATCH (p1:Parcel)-[:ORIGINATED_AT]->(b)
    OPTIONAL MATCH (p2:Parcel)-[:DESTINED_FOR]->(b)
    RETURN b.branchId AS branchId, b.name AS name, b.city AS city,
           count(DISTINCT p1) AS originatingParcelsCount,
           count(DISTINCT p2) AS destinedParcelsCount
    ORDER BY b.branchId ASC
  `);

  return rows.map(r => ({
    branchId: r.branchId,
    name: r.name,
    city: r.city,
    originatingParcelsCount: Number(r.originatingParcelsCount || 0),
    destinedParcelsCount: Number(r.destinedParcelsCount || 0)
  }));
}

export async function searchBranches(query) {
  if (!query || !query.trim()) {
    return await listBranches();
  }

  const rows = await runQuery(
    `MATCH (b:Branch)
     WHERE toLower(b.name) CONTAINS toLower($query)
        OR toLower(b.city) CONTAINS toLower($query)
        OR b.branchId CONTAINS $query
     OPTIONAL MATCH (p1:Parcel)-[:ORIGINATED_AT]->(b)
     OPTIONAL MATCH (p2:Parcel)-[:DESTINED_FOR]->(b)
     RETURN b.branchId AS branchId, b.name AS name, b.city AS city,
            count(DISTINCT p1) AS originatingParcelsCount,
            count(DISTINCT p2) AS destinedParcelsCount
     ORDER BY b.name ASC`,
    { query: query.trim() }
  );

  return rows.map(r => ({
    branchId: r.branchId,
    name: r.name,
    city: r.city,
    originatingParcelsCount: Number(r.originatingParcelsCount || 0),
    destinedParcelsCount: Number(r.destinedParcelsCount || 0)
  }));
}

export async function getBranchById(branchId) {
  const rows = await runQuery(
    `MATCH (b:Branch {branchId: $branchId})
     OPTIONAL MATCH (p1:Parcel)-[:ORIGINATED_AT]->(b)
     OPTIONAL MATCH (p2:Parcel)-[:DESTINED_FOR]->(b)
     RETURN b.branchId AS branchId, b.name AS name, b.city AS city,
            count(DISTINCT p1) AS originatingParcelsCount,
            count(DISTINCT p2) AS destinedParcelsCount`,
    { branchId }
  );

  if (rows.length === 0 || !rows[0].branchId) {
    const err = new Error(`Branch not found with ID: ${branchId}`);
    err.status = 404;
    throw err;
  }

  const r = rows[0];
  return {
    branchId: r.branchId,
    name: r.name,
    city: r.city,
    originatingParcelsCount: Number(r.originatingParcelsCount || 0),
    destinedParcelsCount: Number(r.destinedParcelsCount || 0)
  };
}

export async function updateBranch(branchId, data) {
  const existing = await getBranchById(branchId);

  const name = data.name !== undefined ? data.name.trim() : existing.name;
  const city = data.city !== undefined ? data.city.trim() : existing.city;

  await runQuery(
    `MATCH (b:Branch {branchId: $branchId})
     SET b.name = $name, b.city = $city
     RETURN b.branchId AS branchId`,
    { branchId, name, city },
    { write: true }
  );

  return await getBranchById(branchId);
}

export async function deleteBranch(branchId) {
  const existing = await getBranchById(branchId);

  if (existing.originatingParcelsCount > 0) {
    const err = new Error(`Cannot delete branch '${branchId}' because ${existing.originatingParcelsCount} parcel(s) originate from here`);
    err.status = 400;
    throw err;
  }
  if (existing.destinedParcelsCount > 0) {
    const err = new Error(`Cannot delete branch '${branchId}' because ${existing.destinedParcelsCount} parcel(s) are destined for here`);
    err.status = 400;
    throw err;
  }

  await runQuery(
    'MATCH (b:Branch {branchId: $branchId}) DETACH DELETE b',
    { branchId },
    { write: true }
  );
}

export async function getParcelsByBranch(branchId, type = 'all') {
  await getBranchById(branchId);

  const filterType = type && type.trim() ? type.trim().toLowerCase() : 'all';

  const rows = await runQuery(
    `MATCH (p:Parcel)
     WHERE (($type = 'origin' OR $type = 'all') AND
     EXISTS { MATCH (p)-[:ORIGINATED_AT]->(:Branch {branchId: $branchId}) })
     OR (($type = 'destination' OR $type = 'all') AND
     EXISTS { MATCH (p)-[:DESTINED_FOR]->(:Branch {branchId: $branchId}) })
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
            toString(pay.paymentDate) AS paymentDate, pay.transactionRef AS transactionRef
     ORDER BY p.trackingNumber DESC`,
    { branchId, type: filterType }
  );

  const parcels = rows.map(mapParcelRow);
  await enrichParcels(parcels);
  return parcels;
}

export async function getConnectedBranches(branchId) {
  await getBranchById(branchId);

  const rows = await runQuery(
    `MATCH (origin:Branch {branchId: $branchId})<-[:ORIGINATED_AT]-(p:Parcel)-[:DESTINED_FOR]->(dest:Branch)
     RETURN dest.branchId AS branchId, dest.name AS name, dest.city AS city, count(p) AS parcelCount
     ORDER BY parcelCount DESC`,
    { branchId }
  );

  return rows.map(r => ({
    branchId: r.branchId,
    name: r.name,
    city: r.city,
    parcelCount: Number(r.parcelCount || 0)
  }));
}
