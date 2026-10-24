/**
 * SwiftShip Netlify Functions - Courier Service Operations
 */
import { runQuery } from './database.mjs';
import crypto from 'crypto';

export async function createService(data) {
  if (!data.name || !data.name.trim()) {
    const err = new Error('Service name is required');
    err.status = 400;
    throw err;
  }

  let serviceId = data.serviceId ? data.serviceId.trim() : '';
  if (!serviceId) {
    const countRows = await runQuery('MATCH (cs:CourierService) RETURN count(cs) AS total');
    const total = countRows[0]?.total || 0;
    serviceId = 'S' + String(total + 1).padStart(3, '0');

    let exists = (await runQuery('MATCH (cs:CourierService {serviceId: $id}) RETURN cs.serviceId AS id', { id: serviceId })).length > 0;
    while (exists) {
      serviceId = 'S' + crypto.randomUUID().substring(0, 4).toUpperCase();
      exists = (await runQuery('MATCH (cs:CourierService {serviceId: $id}) RETURN cs.serviceId AS id', { id: serviceId })).length > 0;
    }
  } else {
    const exists = (await runQuery('MATCH (cs:CourierService {serviceId: $id}) RETURN cs.serviceId AS id', { id: serviceId })).length > 0;
    if (exists) {
      const err = new Error(`Courier service with ID '${serviceId}' already exists`);
      err.status = 409;
      throw err;
    }
  }

  const estimatedDays = data.estimatedDays !== undefined && data.estimatedDays !== null ? parseInt(data.estimatedDays, 10) : 3;
  const baseCharge = data.baseCharge !== undefined && data.baseCharge !== null ? Number(data.baseCharge) : 100.0;
  const description = data.description ? data.description.trim() : '';
  const active = data.active !== undefined ? Boolean(data.active) : true;

  await runQuery(
    `MERGE (cs:CourierService {serviceId: $serviceId})
     ON CREATE SET cs.name = $name, cs.estimatedDays = $estimatedDays, cs.baseCharge = $baseCharge, cs.description = $description, cs.active = $active
     ON MATCH SET cs.name = $name, cs.estimatedDays = $estimatedDays, cs.baseCharge = $baseCharge, cs.description = $description, cs.active = $active
     RETURN cs.serviceId AS serviceId`,
    {
      serviceId,
      name: data.name.trim(),
      estimatedDays,
      baseCharge,
      description,
      active
    },
    { write: true }
  );

  return await getServiceById(serviceId);
}

export async function listServices() {
  const rows = await runQuery('MATCH (cs:CourierService) RETURN cs ORDER BY cs.serviceId ASC');
  return rows.map(r => ({
    serviceId: r.cs.serviceId,
    name: r.cs.name,
    estimatedDays: r.cs.estimatedDays !== undefined ? Number(r.cs.estimatedDays) : null,
    baseCharge: r.cs.baseCharge !== undefined ? Number(r.cs.baseCharge) : null,
    description: r.cs.description || '',
    active: r.cs.active !== undefined ? Boolean(r.cs.active) : true
  }));
}

export async function getServiceById(serviceId) {
  const rows = await runQuery('MATCH (cs:CourierService {serviceId: $serviceId}) RETURN cs', { serviceId });
  if (rows.length === 0 || !rows[0].cs) {
    const err = new Error(`Courier service not found with ID: ${serviceId}`);
    err.status = 404;
    throw err;
  }

  const s = rows[0].cs;
  return {
    serviceId: s.serviceId,
    name: s.name,
    estimatedDays: s.estimatedDays !== undefined ? Number(s.estimatedDays) : null,
    baseCharge: s.baseCharge !== undefined ? Number(s.baseCharge) : null,
    description: s.description || '',
    active: s.active !== undefined ? Boolean(s.active) : true
  };
}

export async function updateService(serviceId, data) {
  const existing = await getServiceById(serviceId);

  const name = data.name !== undefined ? data.name.trim() : existing.name;
  const estimatedDays = data.estimatedDays !== undefined && data.estimatedDays !== null ? parseInt(data.estimatedDays, 10) : existing.estimatedDays;
  const baseCharge = data.baseCharge !== undefined && data.baseCharge !== null ? Number(data.baseCharge) : existing.baseCharge;
  const description = data.description !== undefined ? data.description.trim() : existing.description;
  const active = data.active !== undefined ? Boolean(data.active) : existing.active;

  await runQuery(
    `MATCH (cs:CourierService {serviceId: $serviceId})
     SET cs.name = $name, cs.estimatedDays = $estimatedDays, cs.baseCharge = $baseCharge, cs.description = $description, cs.active = $active
     RETURN cs.serviceId AS serviceId`,
    {
      serviceId,
      name,
      estimatedDays,
      baseCharge,
      description,
      active
    },
    { write: true }
  );

  return await getServiceById(serviceId);
}
