/**
 * SwiftShip Netlify Functions - Support Ticket Operations
 */
import { runQuery } from './database.mjs';
import { paginate } from './utils.mjs';
import crypto from 'crypto';

const ALLOWED_PRIORITIES = new Set(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
const ALLOWED_STATUSES = new Set(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);

export async function createTicket(data) {
  if (!data.customerId || !data.customerId.trim()) {
    const err = new Error('Customer ID is required');
    err.status = 400;
    throw err;
  }
  if (!data.subject || !data.subject.trim()) {
    const err = new Error('Ticket subject is required');
    err.status = 400;
    throw err;
  }

  const rawPriority = data.priority ? data.priority.trim().toUpperCase() : 'MEDIUM';
  if (!ALLOWED_PRIORITIES.has(rawPriority)) {
    const err = new Error(`Invalid ticket priority: ${data.priority}. Allowed: LOW, MEDIUM, HIGH, URGENT`);
    err.status = 400;
    throw err;
  }

  const custRows = await runQuery('MATCH (c:Customer {customerId: $id}) RETURN c.customerId AS id', { id: data.customerId.trim() });
  if (custRows.length === 0) {
    const err = new Error(`Customer not found with ID: ${data.customerId}`);
    err.status = 404;
    throw err;
  }

  const trackingNumber = data.trackingNumber && data.trackingNumber.trim() ? data.trackingNumber.trim() : null;
  if (trackingNumber) {
    const pRows = await runQuery('MATCH (p:Parcel {trackingNumber: $tn}) RETURN p.trackingNumber AS tn', { tn: trackingNumber });
    if (pRows.length === 0) {
      const err = new Error(`Parcel not found with tracking number: ${trackingNumber}`);
      err.status = 404;
      throw err;
    }
  }

  const countRows = await runQuery('MATCH (t:SupportTicket) RETURN count(t) AS total');
  const total = countRows[0]?.total || 0;
  let ticketId = 'TK' + String(total + 1).padStart(3, '0');
  let exists = (await runQuery('MATCH (t:SupportTicket {ticketId: $id}) RETURN t.ticketId AS id', { id: ticketId })).length > 0;
  while (exists) {
    ticketId = 'TK' + crypto.randomUUID().substring(0, 5).toUpperCase();
    exists = (await runQuery('MATCH (t:SupportTicket {ticketId: $id}) RETURN t.ticketId AS id', { id: ticketId })).length > 0;
  }

  const remarks = data.remarks && data.remarks.trim() ? data.remarks.trim() : 'Support ticket registered';
  const createdAt = new Date().toISOString();

  await runQuery(
    `MATCH (c:Customer {customerId: $customerId})
     CREATE (t:SupportTicket {ticketId: $ticketId, subject: $subject, status: 'OPEN', priority: $priority, remarks: $remarks, createdAt: datetime($createdAt)})
     MERGE (c)-[:RAISED]->(t)
     WITH t, c
     OPTIONAL MATCH (p:Parcel {trackingNumber: $trackingNumber})
     FOREACH (_ IN CASE WHEN p IS NOT NULL THEN [1] ELSE [] END | MERGE (t)-[:ABOUT_PARCEL]->(p))
     RETURN t.ticketId AS ticketId`,
    {
      ticketId,
      customerId: data.customerId.trim(),
      trackingNumber,
      subject: data.subject.trim(),
      priority: rawPriority,
      remarks,
      createdAt
    },
    { write: true }
  );

  return await getTicketById(ticketId);
}

export async function getTicketById(ticketId) {
  const rows = await runQuery(
    `MATCH (t:SupportTicket {ticketId: $ticketId})
     OPTIONAL MATCH (c:Customer)-[:RAISED]->(t)
     OPTIONAL MATCH (t)-[:ABOUT_PARCEL]->(p:Parcel)
     OPTIONAL MATCH (t)-[:ASSIGNED_TO]->(s:Staff)
     RETURN t.ticketId AS ticketId, c.customerId AS customerId, c.name AS customerName,
            p.trackingNumber AS trackingNumber, t.subject AS subject, t.status AS status,
            t.priority AS priority, t.remarks AS remarks,
            s.staffId AS assignedStaffId, s.name AS assignedStaffName,
            toString(t.createdAt) AS createdAt`,
    { ticketId }
  );

  if (rows.length === 0 || !rows[0].ticketId) {
    const err = new Error(`Support ticket not found with ID: ${ticketId}`);
    err.status = 404;
    throw err;
  }

  const r = rows[0];
  return {
    ticketId: r.ticketId,
    customerId: r.customerId || null,
    customerName: r.customerName || null,
    trackingNumber: r.trackingNumber || null,
    subject: r.subject,
    status: r.status,
    priority: r.priority,
    remarks: r.remarks,
    assignedStaffId: r.assignedStaffId || null,
    assignedStaffName: r.assignedStaffName || null,
    createdAt: r.createdAt
  };
}

export async function listTickets({ status = null, customerId = null, page = 0, size = 10 } = {}) {
  const p = Math.max(0, parseInt(page, 10) || 0);
  const s = Math.max(1, parseInt(size, 10) || 10);
  const skip = p * s;

  const filterStatus = status && status.trim() ? status.trim().toUpperCase() : null;
  const filterCustomer = customerId && customerId.trim() ? customerId.trim() : null;

  const [ticketRows, countRows] = await Promise.all([
    runQuery(
      `MATCH (t:SupportTicket)
       OPTIONAL MATCH (c:Customer)-[:RAISED]->(t)
       OPTIONAL MATCH (t)-[:ABOUT_PARCEL]->(p:Parcel)
       OPTIONAL MATCH (t)-[:ASSIGNED_TO]->(s:Staff)
       WHERE ($status IS NULL OR t.status = $status)
         AND ($customerId IS NULL OR c.customerId = $customerId)
       RETURN t.ticketId AS ticketId, c.customerId AS customerId, c.name AS customerName,
              p.trackingNumber AS trackingNumber, t.subject AS subject, t.status AS status,
              t.priority AS priority, t.remarks AS remarks,
              s.staffId AS assignedStaffId, s.name AS assignedStaffName,
              toString(t.createdAt) AS createdAt
       ORDER BY t.ticketId DESC SKIP toInteger($skip) LIMIT toInteger($limit)`,
      { status: filterStatus, customerId: filterCustomer, skip, limit: s }
    ),
    runQuery(
      `MATCH (t:SupportTicket)
       OPTIONAL MATCH (c:Customer)-[:RAISED]->(t)
       WHERE ($status IS NULL OR t.status = $status)
         AND ($customerId IS NULL OR c.customerId = $customerId)
       RETURN count(t) AS total`,
      { status: filterStatus, customerId: filterCustomer }
    )
  ]);

  const list = ticketRows.map(r => ({
    ticketId: r.ticketId,
    customerId: r.customerId || null,
    customerName: r.customerName || null,
    trackingNumber: r.trackingNumber || null,
    subject: r.subject,
    status: r.status,
    priority: r.priority,
    remarks: r.remarks,
    assignedStaffId: r.assignedStaffId || null,
    assignedStaffName: r.assignedStaffName || null,
    createdAt: r.createdAt
  }));

  const total = countRows[0]?.total || 0;
  return paginate(list, p, s, total);
}

export async function getTicketsByCustomerId(customerId) {
  const custRows = await runQuery('MATCH (c:Customer {customerId: $id}) RETURN c.customerId AS id', { id: customerId });
  if (custRows.length === 0) {
    const err = new Error(`Customer not found with ID: ${customerId}`);
    err.status = 404;
    throw err;
  }

  const rows = await runQuery(
    `MATCH (c:Customer {customerId: $customerId})-[:RAISED]->(t:SupportTicket)
     OPTIONAL MATCH (t)-[:ABOUT_PARCEL]->(p:Parcel)
     OPTIONAL MATCH (t)-[:ASSIGNED_TO]->(s:Staff)
     RETURN t.ticketId AS ticketId, c.customerId AS customerId, c.name AS customerName,
            p.trackingNumber AS trackingNumber, t.subject AS subject, t.status AS status,
            t.priority AS priority, t.remarks AS remarks,
            s.staffId AS assignedStaffId, s.name AS assignedStaffName,
            toString(t.createdAt) AS createdAt
     ORDER BY t.ticketId DESC`,
    { customerId }
  );

  return rows.map(r => ({
    ticketId: r.ticketId,
    customerId: r.customerId || null,
    customerName: r.customerName || null,
    trackingNumber: r.trackingNumber || null,
    subject: r.subject,
    status: r.status,
    priority: r.priority,
    remarks: r.remarks,
    assignedStaffId: r.assignedStaffId || null,
    assignedStaffName: r.assignedStaffName || null,
    createdAt: r.createdAt
  }));
}

export async function assignTicketToStaff(ticketId, staffId) {
  await getTicketById(ticketId);

  const staffRows = await runQuery('MATCH (s:Staff {staffId: $id}) RETURN s.staffId AS id', { id: staffId });
  if (staffRows.length === 0) {
    const err = new Error(`Staff member not found with ID: ${staffId}`);
    err.status = 404;
    throw err;
  }

  await runQuery(
    `MATCH (t:SupportTicket {ticketId: $ticketId}), (s:Staff {staffId: $staffId})
     OPTIONAL MATCH (t)-[oldRel:ASSIGNED_TO]->(:Staff)
     DELETE oldRel
     MERGE (t)-[:ASSIGNED_TO]->(s)
     SET t.status = 'IN_PROGRESS'
     RETURN t.ticketId AS ticketId`,
    { ticketId, staffId },
    { write: true }
  );

  return await getTicketById(ticketId);
}

export async function updateTicketStatus(ticketId, data) {
  await getTicketById(ticketId);

  const rawStatus = data.status ? data.status.trim().toUpperCase() : '';
  if (!ALLOWED_STATUSES.has(rawStatus)) {
    const err = new Error(`Invalid ticket status: ${data.status}. Allowed: OPEN, IN_PROGRESS, RESOLVED, CLOSED`);
    err.status = 400;
    throw err;
  }

  let priority = null;
  if (data.priority && data.priority.trim()) {
    priority = data.priority.trim().toUpperCase();
    if (!ALLOWED_PRIORITIES.has(priority)) {
      const err = new Error(`Invalid ticket priority: ${data.priority}. Allowed: LOW, MEDIUM, HIGH, URGENT`);
      err.status = 400;
      throw err;
    }
  }

  const remarks = data.remarks !== undefined && data.remarks !== null ? data.remarks.trim() : null;

  await runQuery(
    `MATCH (t:SupportTicket {ticketId: $ticketId})
     SET t.status = $status
     SET t.priority = CASE WHEN $priority IS NOT NULL THEN $priority ELSE t.priority END
     SET t.remarks = CASE WHEN $remarks IS NOT NULL THEN $remarks ELSE t.remarks END
     RETURN t.ticketId AS ticketId`,
    { ticketId, status: rawStatus, priority, remarks },
    { write: true }
  );

  return await getTicketById(ticketId);
}
