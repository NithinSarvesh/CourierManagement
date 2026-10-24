/**
 * SwiftShip Netlify Functions - Vehicle Operations
 */
import { runQuery } from './database.mjs';
import crypto from 'crypto';

const ALLOWED_VEHICLE_TYPES = new Set(['VAN', 'TRUCK', 'BIKE']);

export async function registerVehicle(data) {
  if (!data.type || !data.type.trim()) {
    const err = new Error('Vehicle type is required');
    err.status = 400;
    throw err;
  }
  const typeUpper = data.type.trim().toUpperCase();
  if (!ALLOWED_VEHICLE_TYPES.has(typeUpper)) {
    const err = new Error(`Invalid vehicle type: ${data.type}. Allowed: VAN, TRUCK, BIKE`);
    err.status = 400;
    throw err;
  }

  let vehicleId = data.vehicleId ? data.vehicleId.trim() : '';
  if (!vehicleId) {
    const countRows = await runQuery('MATCH (v:Vehicle) RETURN count(v) AS total');
    const total = countRows[0]?.total || 0;
    vehicleId = 'V' + String(total + 1).padStart(3, '0');

    let exists = (await runQuery('MATCH (v:Vehicle {vehicleId: $id}) RETURN v.vehicleId AS id', { id: vehicleId })).length > 0;
    while (exists) {
      vehicleId = 'V' + crypto.randomUUID().substring(0, 4).toUpperCase();
      exists = (await runQuery('MATCH (v:Vehicle {vehicleId: $id}) RETURN v.vehicleId AS id', { id: vehicleId })).length > 0;
    }
  } else {
    const exists = (await runQuery('MATCH (v:Vehicle {vehicleId: $id}) RETURN v.vehicleId AS id', { id: vehicleId })).length > 0;
    if (exists) {
      const err = new Error(`Vehicle with ID '${vehicleId}' already exists`);
      err.status = 409;
      throw err;
    }
  }

  const status = data.status ? data.status.trim().toUpperCase() : 'AVAILABLE';
  const capacityKg = data.capacityKg !== undefined && data.capacityKg !== null ? Number(data.capacityKg) : null;
  const registration = data.registration ? data.registration.trim() : '';

  await runQuery(
    `MERGE (v:Vehicle {vehicleId: $vehicleId})
     ON CREATE SET v.type = $type, v.registration = $registration, v.capacityKg = $capacityKg, v.status = $status
     ON MATCH SET v.type = $type, v.registration = $registration, v.capacityKg = $capacityKg, v.status = $status
     RETURN v.vehicleId AS vehicleId`,
    {
      vehicleId,
      type: typeUpper,
      registration,
      capacityKg,
      status
    },
    { write: true }
  );

  return await getVehicleById(vehicleId);
}

export async function listVehicles() {
  const rows = await runQuery(`
    MATCH (v:Vehicle)
    OPTIONAL MATCH (v)-[:ASSIGNED_TO]-(da:DeliveryAgent)
    RETURN v.vehicleId AS vehicleId, v.type AS type,
           v.registration AS registration, v.capacityKg AS capacityKg,
           coalesce(v.status, CASE WHEN da IS NOT NULL THEN 'IN_USE' ELSE 'AVAILABLE' END) AS status,
           da.agentId AS assignedAgentId,
           da.name AS assignedAgentName
    ORDER BY v.vehicleId ASC
  `);

  return rows.map(r => ({
    vehicleId: r.vehicleId,
    type: r.type,
    registration: r.registration,
    capacityKg: r.capacityKg !== null && r.capacityKg !== undefined ? Number(r.capacityKg) : null,
    status: r.status,
    assignedAgentId: r.assignedAgentId || null,
    assignedAgentName: r.assignedAgentName || null
  }));
}

export async function getVehicleById(vehicleId) {
  const rows = await runQuery(
    `MATCH (v:Vehicle {vehicleId: $vehicleId})
     OPTIONAL MATCH (v)-[:ASSIGNED_TO]-(da:DeliveryAgent)
     RETURN v.vehicleId AS vehicleId, v.type AS type,
            v.registration AS registration, v.capacityKg AS capacityKg,
            coalesce(v.status, CASE WHEN da IS NOT NULL THEN 'IN_USE' ELSE 'AVAILABLE' END) AS status,
            da.agentId AS assignedAgentId,
            da.name AS assignedAgentName`,
    { vehicleId }
  );

  if (rows.length === 0 || !rows[0].vehicleId) {
    const err = new Error(`Vehicle not found with ID: ${vehicleId}`);
    err.status = 404;
    throw err;
  }

  const r = rows[0];
  return {
    vehicleId: r.vehicleId,
    type: r.type,
    registration: r.registration,
    capacityKg: r.capacityKg !== null && r.capacityKg !== undefined ? Number(r.capacityKg) : null,
    status: r.status,
    assignedAgentId: r.assignedAgentId || null,
    assignedAgentName: r.assignedAgentName || null
  };
}

export async function updateVehicle(vehicleId, data) {
  const existing = await getVehicleById(vehicleId);

  let typeUpper = existing.type;
  if (data.type) {
    typeUpper = data.type.trim().toUpperCase();
    if (!ALLOWED_VEHICLE_TYPES.has(typeUpper)) {
      const err = new Error(`Invalid vehicle type: ${data.type}. Allowed: VAN, TRUCK, BIKE`);
      err.status = 400;
      throw err;
    }
  }

  const registration = data.registration !== undefined ? data.registration.trim() : existing.registration;
  const capacityKg = data.capacityKg !== undefined && data.capacityKg !== null ? Number(data.capacityKg) : existing.capacityKg;
  const status = data.status !== undefined ? data.status.trim().toUpperCase() : existing.status;

  await runQuery(
    `MATCH (v:Vehicle {vehicleId: $vehicleId})
     SET v.type = $type, v.registration = $registration, v.capacityKg = $capacityKg, v.status = $status
     RETURN v.vehicleId AS vehicleId`,
    {
      vehicleId,
      type: typeUpper,
      registration,
      capacityKg,
      status
    },
    { write: true }
  );

  return await getVehicleById(vehicleId);
}

export async function assignVehicleToAgent(vehicleId, agentId) {
  await getVehicleById(vehicleId);

  const agentRows = await runQuery('MATCH (da:DeliveryAgent {agentId: $id}) RETURN da.agentId AS id', { id: agentId });
  if (agentRows.length === 0) {
    const err = new Error(`Delivery agent not found with ID: ${agentId}`);
    err.status = 404;
    throw err;
  }

  await runQuery(
    `MATCH (v:Vehicle {vehicleId: $vehicleId}), (da:DeliveryAgent {agentId: $agentId})
     OPTIONAL MATCH (v)-[oldRel1:ASSIGNED_TO]->(:DeliveryAgent)
     DELETE oldRel1
     OPTIONAL MATCH (:Vehicle)-[oldRel2:ASSIGNED_TO]->(da)
     DELETE oldRel2
     MERGE (v)-[:ASSIGNED_TO]->(da)
     SET v.status = 'IN_USE'
     RETURN v.vehicleId AS vehicleId`,
    { vehicleId, agentId },
    { write: true }
  );

  return await getVehicleById(vehicleId);
}

export async function unassignVehicle(vehicleId) {
  await getVehicleById(vehicleId);

  await runQuery(
    `MATCH (v:Vehicle {vehicleId: $vehicleId})
     OPTIONAL MATCH (v)-[r:ASSIGNED_TO]->(:DeliveryAgent)
     DELETE r
     SET v.status = 'AVAILABLE'
     RETURN v.vehicleId AS vehicleId`,
    { vehicleId },
    { write: true }
  );

  return await getVehicleById(vehicleId);
}
