/**
 * SwiftShip Netlify Functions - Staff Operations
 */
import { runQuery } from './database.mjs';
import crypto from 'crypto';

export async function createStaff(data) {
  if (!data.name || !data.name.trim()) {
    const err = new Error('Staff name is required');
    err.status = 400;
    throw err;
  }
  if (!data.role || !data.role.trim()) {
    const err = new Error('Staff role is required');
    err.status = 400;
    throw err;
  }

  let staffId = data.staffId ? data.staffId.trim() : '';
  if (!staffId) {
    const countRows = await runQuery('MATCH (s:Staff) RETURN count(s) AS total');
    const total = countRows[0]?.total || 0;
    staffId = 'ST' + String(total + 1).padStart(3, '0');

    let exists = (await runQuery('MATCH (s:Staff {staffId: $id}) RETURN s.staffId AS id', { id: staffId })).length > 0;
    while (exists) {
      staffId = 'ST' + crypto.randomUUID().substring(0, 4).toUpperCase();
      exists = (await runQuery('MATCH (s:Staff {staffId: $id}) RETURN s.staffId AS id', { id: staffId })).length > 0;
    }
  } else {
    const exists = (await runQuery('MATCH (s:Staff {staffId: $id}) RETURN s.staffId AS id', { id: staffId })).length > 0;
    if (exists) {
      const err = new Error(`Staff with ID '${staffId}' already exists`);
      err.status = 409;
      throw err;
    }
  }

  const email = data.email ? data.email.trim() : '';
  const branchId = data.branchId ? data.branchId.trim() : null;
  const active = data.active !== undefined ? Boolean(data.active) : true;

  await runQuery(
    `MERGE (s:Staff {staffId: $staffId})
     ON CREATE SET s.name = $name, s.role = $role, s.email = $email, s.branchId = $branchId, s.active = $active
     ON MATCH SET s.name = $name, s.role = $role, s.email = $email, s.branchId = $branchId, s.active = $active
     WITH s
     OPTIONAL MATCH (s)-[r:WORKS_AT]->(:Branch)
     DELETE r
     WITH s
     OPTIONAL MATCH (b:Branch {branchId: $branchId})
     FOREACH (_ IN CASE WHEN b IS NOT NULL THEN [1] ELSE [] END | MERGE (s)-[:WORKS_AT]->(b))
     RETURN s.staffId AS staffId`,
    {
      staffId,
      name: data.name.trim(),
      role: data.role.trim(),
      email,
      branchId,
      active
    },
    { write: true }
  );

  return await getStaffById(staffId);
}

export async function listStaff() {
  const rows = await runQuery(`
    MATCH (s:Staff)
    OPTIONAL MATCH (s)-[:WORKS_AT]->(b:Branch)
    RETURN s.staffId AS staffId, s.name AS name, s.role AS role,
           s.email AS email, s.branchId AS branchId, b.name AS branchName,
           coalesce(s.active, true) AS active
    ORDER BY s.staffId ASC
  `);

  return rows.map(r => ({
    staffId: r.staffId,
    name: r.name,
    role: r.role,
    email: r.email || '',
    branchId: r.branchId || null,
    branchName: r.branchName || null,
    active: Boolean(r.active)
  }));
}

export async function getStaffById(staffId) {
  const rows = await runQuery(
    `MATCH (s:Staff {staffId: $staffId})
     OPTIONAL MATCH (s)-[:WORKS_AT]->(b:Branch)
     RETURN s.staffId AS staffId, s.name AS name, s.role AS role,
            s.email AS email, s.branchId AS branchId, b.name AS branchName,
            coalesce(s.active, true) AS active`,
    { staffId }
  );

  if (rows.length === 0 || !rows[0].staffId) {
    const err = new Error(`Staff member not found with ID: ${staffId}`);
    err.status = 404;
    throw err;
  }

  const r = rows[0];
  return {
    staffId: r.staffId,
    name: r.name,
    role: r.role,
    email: r.email || '',
    branchId: r.branchId || null,
    branchName: r.branchName || null,
    active: Boolean(r.active)
  };
}

export async function updateStaff(staffId, data) {
  const existing = await getStaffById(staffId);

  const name = data.name !== undefined ? data.name.trim() : existing.name;
  const role = data.role !== undefined ? data.role.trim() : existing.role;
  const email = data.email !== undefined ? data.email.trim() : existing.email;
  const branchId = data.branchId !== undefined ? (data.branchId ? data.branchId.trim() : null) : existing.branchId;
  const active = data.active !== undefined ? Boolean(data.active) : existing.active;

  await runQuery(
    `MATCH (s:Staff {staffId: $staffId})
     SET s.name = $name, s.role = $role, s.email = $email, s.branchId = $branchId, s.active = $active
     WITH s
     OPTIONAL MATCH (s)-[r:WORKS_AT]->(:Branch)
     DELETE r
     WITH s
     OPTIONAL MATCH (b:Branch {branchId: $branchId})
     FOREACH (_ IN CASE WHEN b IS NOT NULL THEN [1] ELSE [] END | MERGE (s)-[:WORKS_AT]->(b))
     RETURN s.staffId AS staffId`,
    {
      staffId,
      name,
      role,
      email,
      branchId,
      active
    },
    { write: true }
  );

  return await getStaffById(staffId);
}

export async function deleteStaff(staffId) {
  await getStaffById(staffId);

  await runQuery(
    'MATCH (s:Staff {staffId: $staffId}) DETACH DELETE s',
    { staffId },
    { write: true }
  );
}

export async function getStaffByRole(role) {
  const rows = await runQuery(
    `MATCH (s:Staff)
     WHERE toLower(s.role) CONTAINS toLower($role)
     OPTIONAL MATCH (s)-[:WORKS_AT]->(b:Branch)
     RETURN s.staffId AS staffId, s.name AS name, s.role AS role,
            s.email AS email, s.branchId AS branchId, b.name AS branchName,
            coalesce(s.active, true) AS active
     ORDER BY s.name ASC`,
    { role: role.trim() }
  );

  return rows.map(r => ({
    staffId: r.staffId,
    name: r.name,
    role: r.role,
    email: r.email || '',
    branchId: r.branchId || null,
    branchName: r.branchName || null,
    active: Boolean(r.active)
  }));
}
