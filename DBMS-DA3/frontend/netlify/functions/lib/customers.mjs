/**
 * SwiftShip Netlify Functions - Customer Operations
 */
import { runQuery } from './database.mjs';
import { paginate } from './utils.mjs';
import { enrichParcels } from './parcels.mjs';
import { mapParcelRow } from './dashboard.mjs';
import crypto from 'crypto';

export async function listCustomers({ page = 0, size = 10 } = {}) {
  const p = Math.max(0, parseInt(page, 10) || 0);
  const s = Math.max(1, parseInt(size, 10) || 10);
  const skip = p * s;

  const [customerRows, countRows] = await Promise.all([
    runQuery(
      `MATCH (c:Customer)
       OPTIONAL MATCH (c)-[:BOOKED]->(p:Parcel)
       RETURN c.customerId AS customerId, c.name AS name, c.email AS email,
              c.phone AS phone, c.address AS address, count(p) AS totalParcelsBooked
       ORDER BY c.customerId ASC SKIP $skip LIMIT $limit`,
      { skip, limit: s }
    ),
    runQuery('MATCH (c:Customer) RETURN count(c) AS total')
  ]);

  const total = countRows[0]?.total || 0;
  return paginate(customerRows, p, s, total);
}

export async function searchCustomers(query) {
  if (!query || !query.trim()) {
    const listRes = await listCustomers({ page: 0, size: 50 });
    return listRes.content;
  }

  const rows = await runQuery(
    `MATCH (c:Customer)
     WHERE toLower(c.name) CONTAINS toLower($query)
        OR toLower(c.email) CONTAINS toLower($query)
        OR c.phone CONTAINS $query
     OPTIONAL MATCH (c)-[:BOOKED]->(p:Parcel)
     RETURN c.customerId AS customerId, c.name AS name, c.email AS email,
            c.phone AS phone, c.address AS address, count(p) AS totalParcelsBooked
     ORDER BY c.name ASC`,
    { query: query.trim() }
  );

  return rows;
}

export async function getCustomerById(customerId) {
  const rows = await runQuery(
    `MATCH (c:Customer {customerId: $customerId})
     OPTIONAL MATCH (c)-[:BOOKED]->(p:Parcel)
     RETURN c.customerId AS customerId, c.name AS name, c.email AS email,
            c.phone AS phone, c.address AS address, count(p) AS totalParcelsBooked`,
    { customerId }
  );

  if (!rows || rows.length === 0 || !rows[0].customerId) {
    const err = new Error(`Customer not found with ID: ${customerId}`);
    err.status = 404;
    throw err;
  }

  return rows[0];
}

export async function createCustomer(data) {
  if (!data.name || !data.name.trim()) {
    const err = new Error('Customer name is required');
    err.status = 400;
    throw err;
  }
  if (!data.email || !data.email.trim()) {
    const err = new Error('Customer email is required');
    err.status = 400;
    throw err;
  }
  if (!data.phone || !data.phone.trim()) {
    const err = new Error('Customer phone is required');
    err.status = 400;
    throw err;
  }

  // Check email uniqueness
  const emailRows = await runQuery('MATCH (c:Customer {email: $email}) RETURN c.customerId AS id', { email: data.email.trim() });
  if (emailRows.length > 0) {
    const err = new Error(`Customer with email '${data.email}' already exists`);
    err.status = 409;
    throw err;
  }

  // Check phone uniqueness
  const phoneRows = await runQuery('MATCH (c:Customer {phone: $phone}) RETURN c.customerId AS id', { phone: data.phone.trim() });
  if (phoneRows.length > 0) {
    const err = new Error(`Customer with phone '${data.phone}' already exists`);
    err.status = 409;
    throw err;
  }

  let customerId = data.customerId ? data.customerId.trim() : '';
  if (!customerId) {
    const totalCountRows = await runQuery('MATCH (c:Customer) RETURN count(c) AS total');
    const total = totalCountRows[0]?.total || 0;
    customerId = 'C' + String(total + 1).padStart(3, '0');

    let exists = (await runQuery('MATCH (c:Customer {customerId: $id}) RETURN c.customerId AS id', { id: customerId })).length > 0;
    while (exists) {
      customerId = 'C' + crypto.randomUUID().substring(0, 5).toUpperCase();
      exists = (await runQuery('MATCH (c:Customer {customerId: $id}) RETURN c.customerId AS id', { id: customerId })).length > 0;
    }
  } else {
    const exists = (await runQuery('MATCH (c:Customer {customerId: $id}) RETURN c.customerId AS id', { id: customerId })).length > 0;
    if (exists) {
      const err = new Error(`Customer with ID '${customerId}' already exists`);
      err.status = 409;
      throw err;
    }
  }

  await runQuery(
    `MERGE (c:Customer {customerId: $customerId})
     ON CREATE SET c.name = $name, c.email = $email, c.phone = $phone, c.address = $address
     ON MATCH SET c.name = $name, c.email = $email, c.phone = $phone, c.address = $address
     RETURN c.customerId AS customerId`,
    {
      customerId,
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      address: data.address ? data.address.trim() : ''
    },
    { write: true }
  );

  return await getCustomerById(customerId);
}

export async function updateCustomer(customerId, data) {
  const existing = await getCustomerById(customerId);

  if (data.email && data.email.trim()) {
    const otherEmailRows = await runQuery(
      'MATCH (c:Customer {email: $email}) WHERE c.customerId <> $customerId RETURN c.customerId AS id',
      { email: data.email.trim(), customerId }
    );
    if (otherEmailRows.length > 0) {
      const err = new Error(`Email '${data.email}' is already in use by another customer`);
      err.status = 409;
      throw err;
    }
  }

  if (data.phone && data.phone.trim()) {
    const otherPhoneRows = await runQuery(
      'MATCH (c:Customer {phone: $phone}) WHERE c.customerId <> $customerId RETURN c.customerId AS id',
      { phone: data.phone.trim(), customerId }
    );
    if (otherPhoneRows.length > 0) {
      const err = new Error(`Phone '${data.phone}' is already in use by another customer`);
      err.status = 409;
      throw err;
    }
  }

  await runQuery(
    `MATCH (c:Customer {customerId: $customerId})
     SET c.name = $name, c.email = $email, c.phone = $phone, c.address = $address
     RETURN c.customerId AS customerId`,
    {
      customerId,
      name: data.name !== undefined ? data.name.trim() : existing.name,
      email: data.email !== undefined ? data.email.trim() : existing.email,
      phone: data.phone !== undefined ? data.phone.trim() : existing.phone,
      address: data.address !== undefined ? data.address.trim() : existing.address
    },
    { write: true }
  );

  return await getCustomerById(customerId);
}

export async function deleteCustomer(customerId) {
  await getCustomerById(customerId);

  const parcelCheck = await runQuery(
    'MATCH (c:Customer {customerId: $customerId})-[:BOOKED]->(p:Parcel) RETURN count(p) AS count',
    { customerId }
  );
  const parcelCount = parcelCheck[0]?.count || 0;
  if (parcelCount > 0) {
    const err = new Error(`Cannot delete customer '${customerId}' because they have ${parcelCount} booked parcel(s)`);
    err.status = 400;
    throw err;
  }

  const ticketCheck = await runQuery(
    'MATCH (c:Customer {customerId: $customerId})-[:RAISED]->(t:SupportTicket) RETURN count(t) AS count',
    { customerId }
  );
  const ticketCount = ticketCheck[0]?.count || 0;
  if (ticketCount > 0) {
    const err = new Error(`Cannot delete customer '${customerId}' because they have ${ticketCount} active support ticket(s)`);
    err.status = 400;
    throw err;
  }

  await runQuery(
    'MATCH (c:Customer {customerId: $customerId}) DETACH DELETE c',
    { customerId },
    { write: true }
  );
}

export async function getCustomerParcels(customerId) {
  await getCustomerById(customerId);

  const rows = await runQuery(
    `MATCH (c:Customer {customerId: $customerId})-[:BOOKED]->(p:Parcel)
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
    { customerId }
  );

  const parcels = rows.map(mapParcelRow);
  await enrichParcels(parcels);
  return parcels;
}

export async function getCustomerHistory(customerId) {
  const customer = await getCustomerById(customerId);
  const parcels = await getCustomerParcels(customerId);

  const [paymentRows, ticketRows] = await Promise.all([
    runQuery(
      `MATCH (c:Customer {customerId: $customerId})-[:BOOKED]->(p:Parcel)-[:HAS_PAYMENT]->(pay:Payment)
       RETURN pay.paymentId AS paymentId, p.trackingNumber AS trackingNumber,
              c.customerId AS customerId, c.name AS customerName,
              pay.amount AS amount, pay.method AS method, pay.status AS status,
              toString(pay.paymentDate) AS paymentDate, pay.transactionRef AS transactionRef
       ORDER BY pay.paymentId DESC`,
      { customerId }
    ),
    runQuery(
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
    )
  ]);

  return {
    customerId: customer.customerId,
    name: customer.name,
    email: customer.email,
    parcels,
    payments: paymentRows,
    tickets: ticketRows
  };
}
