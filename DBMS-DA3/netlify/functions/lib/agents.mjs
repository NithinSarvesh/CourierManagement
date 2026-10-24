/**
 * SwiftShip Netlify Functions - Delivery Agent Operations
 */
import { runQuery } from './database.mjs';
import { getParcelByTrackingNumber, enrichParcels } from './parcels.mjs';
import { mapParcelRow } from './dashboard.mjs';
import crypto from 'crypto';

const ALLOWED_STATUSES = new Set(['AVAILABLE', 'ON_DELIVERY', 'INACTIVE']);

export async function mapAgentDto(agent) {
  if (!agent) return null;
  const agentId = agent.agentId;

  const [countRows, vehicleRows] = await Promise.all([
    runQuery(
      `MATCH (da:DeliveryAgent {agentId: $agentId})-[:ASSIGNED_TO]->(p:Parcel)
       WHERE p.status IN ['BOOKED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY']
       RETURN count(p) AS activeCount`,
      { agentId }
    ),
    runQuery(
      `MATCH (v:Vehicle)-[:ASSIGNED_TO]-(da:DeliveryAgent {agentId: $agentId})
       RETURN v.vehicleId AS vehicleId, v.registration AS registration, v.type AS type`,
      { agentId }
    )
  ]);

  const activeDeliveriesCount = countRows[0]?.activeCount || 0;
  const veh = vehicleRows[0] || null;

  return {
    agentId: agent.agentId,
    name: agent.name,
    phone: agent.phone,
    status: agent.status,
    activeDeliveriesCount,
    assignedVehicleId: veh?.vehicleId || null,
    assignedVehicleRegistration: veh?.registration || null
  };
}

export async function registerAgent(data) {
  if (!data.name || !data.name.trim()) {
    const err = new Error('Agent name is required');
    err.status = 400;
    throw err;
  }
  if (!data.phone || !data.phone.trim()) {
    const err = new Error('Agent phone is required');
    err.status = 400;
    throw err;
  }

  let agentId = data.agentId ? data.agentId.trim() : '';
  if (!agentId) {
    const countRows = await runQuery('MATCH (da:DeliveryAgent) RETURN count(da) AS total');
    const total = countRows[0]?.total || 0;
    agentId = 'A' + String(total + 1).padStart(3, '0');

    let exists = (await runQuery('MATCH (da:DeliveryAgent {agentId: $id}) RETURN da.agentId AS id', { id: agentId })).length > 0;
    while (exists) {
      agentId = 'A' + crypto.randomUUID().substring(0, 4).toUpperCase();
      exists = (await runQuery('MATCH (da:DeliveryAgent {agentId: $id}) RETURN da.agentId AS id', { id: agentId })).length > 0;
    }
  } else {
    const exists = (await runQuery('MATCH (da:DeliveryAgent {agentId: $id}) RETURN da.agentId AS id', { id: agentId })).length > 0;
    if (exists) {
      const err = new Error(`Delivery agent with ID '${agentId}' already exists`);
      err.status = 409;
      throw err;
    }
  }

  const initialStatus = data.status && ALLOWED_STATUSES.has(data.status.trim().toUpperCase())
    ? data.status.trim().toUpperCase()
    : 'AVAILABLE';

  await runQuery(
    `MERGE (da:DeliveryAgent {agentId: $agentId})
     ON CREATE SET da.name = $name, da.phone = $phone, da.status = $status
     ON MATCH SET da.name = $name, da.phone = $phone, da.status = $status
     RETURN da.agentId AS agentId`,
    {
      agentId,
      name: data.name.trim(),
      phone: data.phone.trim(),
      status: initialStatus
    },
    { write: true }
  );

  return await getAgentById(agentId);
}

export async function listAgents() {
  const rows = await runQuery('MATCH (da:DeliveryAgent) RETURN da ORDER BY da.agentId ASC');
  const dtoList = await Promise.all(rows.map(r => mapAgentDto(r.da)));
  return dtoList;
}

export async function getAvailableAgents() {
  const rows = await runQuery('MATCH (da:DeliveryAgent {status: "AVAILABLE"}) RETURN da ORDER BY da.name ASC');
  const dtoList = await Promise.all(rows.map(r => mapAgentDto(r.da)));
  return dtoList;
}

export async function getAgentById(agentId) {
  const rows = await runQuery('MATCH (da:DeliveryAgent {agentId: $agentId}) RETURN da', { agentId });
  if (rows.length === 0 || !rows[0].da) {
    const err = new Error(`Delivery agent not found with ID: ${agentId}`);
    err.status = 404;
    throw err;
  }
  return await mapAgentDto(rows[0].da);
}

export async function updateAgent(agentId, data) {
  const existing = await getAgentById(agentId);

  const status = data.status && ALLOWED_STATUSES.has(data.status.trim().toUpperCase())
    ? data.status.trim().toUpperCase()
    : existing.status;

  await runQuery(
    `MATCH (da:DeliveryAgent {agentId: $agentId})
     SET da.name = $name, da.phone = $phone, da.status = $status
     RETURN da.agentId AS agentId`,
    {
      agentId,
      name: data.name !== undefined ? data.name.trim() : existing.name,
      phone: data.phone !== undefined ? data.phone.trim() : existing.phone,
      status
    },
    { write: true }
  );

  return await getAgentById(agentId);
}

export async function updateAgentStatus(agentId, status) {
  await getAgentById(agentId);

  const upperStatus = status ? status.trim().toUpperCase() : '';
  if (!ALLOWED_STATUSES.has(upperStatus)) {
    const err = new Error(`Invalid agent status: ${status}. Allowed values: AVAILABLE, ON_DELIVERY, INACTIVE`);
    err.status = 400;
    throw err;
  }

  await runQuery(
    `MATCH (da:DeliveryAgent {agentId: $agentId})
     SET da.status = $status
     RETURN da.agentId AS agentId`,
    { agentId, status: upperStatus },
    { write: true }
  );

  return await getAgentById(agentId);
}

export async function assignAgentToParcel(agentId, trackingNumber) {
  const agent = await getAgentById(agentId);
  if (agent.status === 'INACTIVE') {
    const err = new Error(`Cannot assign parcel to inactive agent: ${agentId}`);
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
  if (parcel.status === 'DELIVERED' || parcel.status === 'CANCELLED') {
    const err = new Error(`Cannot assign agent to a parcel that is already ${parcel.status}`);
    err.status = 400;
    throw err;
  }

  await runQuery(
    `MATCH (p:Parcel {trackingNumber: $trackingNumber}), (da:DeliveryAgent {agentId: $agentId})
     OPTIONAL MATCH (:DeliveryAgent)-[oldRel:ASSIGNED_TO]->(p)
     DELETE oldRel
     MERGE (da)-[:ASSIGNED_TO]->(p)
     SET da.status = 'ON_DELIVERY'
     RETURN p.trackingNumber AS trackingNumber`,
    { trackingNumber, agentId },
    { write: true }
  );

  if (parcel.status !== 'OUT_FOR_DELIVERY') {
    await runQuery('MATCH (p:Parcel {trackingNumber: $tn}) SET p.status = "OUT_FOR_DELIVERY"', { tn: trackingNumber }, { write: true });
  }

  return await getParcelByTrackingNumber(trackingNumber);
}

export async function reassignAgentToParcel(newAgentId, trackingNumber) {
  return await assignAgentToParcel(newAgentId, trackingNumber);
}

export async function completeAssignment(agentId, trackingNumber) {
  await getAgentById(agentId);

  const pRows = await runQuery('MATCH (p:Parcel {trackingNumber: $tn}) RETURN p.trackingNumber AS tn', { tn: trackingNumber });
  if (pRows.length === 0) {
    const err = new Error(`Parcel not found with tracking number: ${trackingNumber}`);
    err.status = 404;
    throw err;
  }

  await runQuery(
    `MATCH (:DeliveryAgent)-[r:ASSIGNED_TO]->(p:Parcel {trackingNumber: $trackingNumber})
     DELETE r`,
    { trackingNumber },
    { write: true }
  );

  const countRows = await runQuery(
    `MATCH (da:DeliveryAgent {agentId: $agentId})-[:ASSIGNED_TO]->(p:Parcel)
     WHERE p.status IN ['BOOKED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY']
     RETURN count(p) AS activeCount`,
    { agentId }
  );
  const activeCount = countRows[0]?.activeCount || 0;
  if (activeCount === 0) {
    await runQuery('MATCH (da:DeliveryAgent {agentId: $agentId}) SET da.status = "AVAILABLE"', { agentId }, { write: true });
  }

  return await getParcelByTrackingNumber(trackingNumber);
}

export async function getParcelsByAgent(agentId) {
  await getAgentById(agentId);

  const rows = await runQuery(
    `MATCH (da:DeliveryAgent {agentId: $agentId})-[:ASSIGNED_TO]->(p:Parcel)
     OPTIONAL MATCH (c:Customer)-[:BOOKED]->(p)
     OPTIONAL MATCH (p)-[:ORIGINATED_AT]->(ob:Branch)
     OPTIONAL MATCH (p)-[:DESTINED_FOR]->(db:Branch)
     OPTIONAL MATCH (p)-[:USES_SERVICE]->(cs:CourierService)
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
    { agentId }
  );

  const parcels = rows.map(mapParcelRow);
  await enrichParcels(parcels);
  return parcels;
}

export async function getAgentDeliveries(agentId) {
  const agent = await getAgentById(agentId);
  const allParcels = await getParcelsByAgent(agentId);

  const pending = [];
  const completed = [];

  for (const p of allParcels) {
    if (String(p.status).toUpperCase() === 'DELIVERED') {
      completed.push(p);
    } else {
      pending.push(p);
    }
  }

  return {
    agentId: agent.agentId,
    agentName: agent.name,
    status: agent.status,
    pendingDeliveries: pending,
    completedDeliveries: completed
  };
}
