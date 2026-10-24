/**
 * SwiftShip Netlify Functions - Payment Operations
 */
import { runQuery } from './database.mjs';
import { paginate } from './utils.mjs';
import crypto from 'crypto';

const ALLOWED_METHODS = new Set(['CASH', 'CARD', 'UPI']);
const ALLOWED_STATUSES = new Set(['PENDING', 'PAID', 'FAILED']);

export async function recordPayment(data) {
  const trackingNumber = data.trackingNumber ? data.trackingNumber.trim() : '';
  if (!trackingNumber) {
    const err = new Error('Tracking number is required');
    err.status = 400;
    throw err;
  }

  const rawMethod = data.method ? data.method.trim().toUpperCase() : '';
  if (!ALLOWED_METHODS.has(rawMethod)) {
    const err = new Error(`Invalid payment method: ${data.method}. Allowed: CASH, CARD, UPI`);
    err.status = 400;
    throw err;
  }

  const rawStatus = data.status ? data.status.trim().toUpperCase() : 'PAID';
  if (!ALLOWED_STATUSES.has(rawStatus)) {
    const err = new Error(`Invalid payment status: ${data.status}. Allowed: PENDING, PAID, FAILED`);
    err.status = 400;
    throw err;
  }

  const pRows = await runQuery('MATCH (p:Parcel {trackingNumber: $tn}) RETURN p.trackingNumber AS tn, p.deliveryCharge AS deliveryCharge', { tn: trackingNumber });
  if (pRows.length === 0) {
    const err = new Error(`Parcel not found with tracking number: ${trackingNumber}`);
    err.status = 404;
    throw err;
  }

  const parcel = pRows[0];

  // Check if existing payment is already PAID
  const existingPay = await runQuery(
    'MATCH (p:Parcel {trackingNumber: $tn})-[:HAS_PAYMENT]->(pay:Payment) RETURN pay.paymentId AS paymentId, pay.status AS status',
    { tn: trackingNumber }
  );
  if (existingPay.length > 0 && String(existingPay[0].status).toUpperCase() === 'PAID') {
    const err = new Error(`Parcel '${trackingNumber}' already has a completed PAID payment (ID: ${existingPay[0].paymentId})`);
    err.status = 400;
    throw err;
  }

  const amount = data.amount !== undefined && data.amount !== null ? Number(data.amount) : Number(parcel.deliveryCharge);
  if (parcel.deliveryCharge !== null && Math.abs(amount - Number(parcel.deliveryCharge)) > 0.009) {
    const err = new Error(`Payment amount must match the parcel delivery charge of Rs. ${parcel.deliveryCharge}`);
    err.status = 400;
    throw err;
  }

  const countRows = await runQuery('MATCH (pay:Payment) RETURN count(pay) AS total');
  const total = countRows[0]?.total || 0;
  let paymentId = 'PAY' + String(total + 1).padStart(3, '0');
  let exists = (await runQuery('MATCH (pay:Payment {paymentId: $id}) RETURN pay.paymentId AS id', { id: paymentId })).length > 0;
  while (exists) {
    paymentId = 'PAY' + crypto.randomUUID().substring(0, 5).toUpperCase();
    exists = (await runQuery('MATCH (pay:Payment {paymentId: $id}) RETURN pay.paymentId AS id', { id: paymentId })).length > 0;
  }

  const transactionRef = data.transactionRef && data.transactionRef.trim()
    ? data.transactionRef.trim()
    : 'TXN-' + crypto.randomUUID().substring(0, 8).toUpperCase();
  const paymentDate = data.paymentDate ? new Date(data.paymentDate).toISOString() : new Date().toISOString();

  const rows = await runQuery(
    `MATCH (p:Parcel {trackingNumber: $trackingNumber})
     CREATE (pay:Payment {paymentId: $paymentId, amount: $amount, method: $method, status: $status, paymentDate: datetime($paymentDate), transactionRef: $transactionRef})
     MERGE (p)-[:HAS_PAYMENT]->(pay)
     OPTIONAL MATCH (c:Customer)-[:BOOKED]->(p)
     RETURN pay.paymentId AS paymentId, p.trackingNumber AS trackingNumber,
            c.customerId AS customerId, c.name AS customerName,
            pay.amount AS amount, pay.method AS method, pay.status AS status,
            toString(pay.paymentDate) AS paymentDate, pay.transactionRef AS transactionRef`,
    {
      trackingNumber,
      paymentId,
      amount,
      method: rawMethod,
      status: rawStatus,
      paymentDate,
      transactionRef
    },
    { write: true }
  );

  const r = rows[0];
  return {
    paymentId: r.paymentId,
    trackingNumber: r.trackingNumber,
    customerId: r.customerId || null,
    customerName: r.customerName || null,
    amount: Number(r.amount),
    method: r.method,
    status: r.status,
    paymentDate: r.paymentDate,
    transactionRef: r.transactionRef
  };
}

export async function getPaymentById(paymentId) {
  const rows = await runQuery(
    `MATCH (p:Parcel)-[:HAS_PAYMENT]->(pay:Payment {paymentId: $paymentId})
     OPTIONAL MATCH (c:Customer)-[:BOOKED]->(p)
     RETURN pay.paymentId AS paymentId, p.trackingNumber AS trackingNumber,
            c.customerId AS customerId, c.name AS customerName,
            pay.amount AS amount, pay.method AS method, pay.status AS status,
            toString(pay.paymentDate) AS paymentDate, pay.transactionRef AS transactionRef`,
    { paymentId }
  );

  if (rows.length === 0 || !rows[0].paymentId) {
    const err = new Error(`Payment not found with ID: ${paymentId}`);
    err.status = 404;
    throw err;
  }

  const r = rows[0];
  return {
    paymentId: r.paymentId,
    trackingNumber: r.trackingNumber,
    customerId: r.customerId || null,
    customerName: r.customerName || null,
    amount: Number(r.amount),
    method: r.method,
    status: r.status,
    paymentDate: r.paymentDate,
    transactionRef: r.transactionRef
  };
}

export async function getPaymentByParcel(trackingNumber) {
  const pRows = await runQuery('MATCH (p:Parcel {trackingNumber: $tn}) RETURN p.trackingNumber AS tn', { tn: trackingNumber.trim() });
  if (pRows.length === 0) {
    const err = new Error(`Parcel not found with tracking number: ${trackingNumber}`);
    err.status = 404;
    throw err;
  }

  const rows = await runQuery(
    `MATCH (p:Parcel {trackingNumber: $trackingNumber})-[:HAS_PAYMENT]->(pay:Payment)
     OPTIONAL MATCH (c:Customer)-[:BOOKED]->(p)
     RETURN pay.paymentId AS paymentId, p.trackingNumber AS trackingNumber,
            c.customerId AS customerId, c.name AS customerName,
            pay.amount AS amount, pay.method AS method, pay.status AS status,
            toString(pay.paymentDate) AS paymentDate, pay.transactionRef AS transactionRef`,
    { trackingNumber: trackingNumber.trim() }
  );

  if (rows.length === 0 || !rows[0].paymentId) {
    const err = new Error(`No payment record found for parcel: ${trackingNumber}`);
    err.status = 404;
    throw err;
  }

  const r = rows[0];
  return {
    paymentId: r.paymentId,
    trackingNumber: r.trackingNumber,
    customerId: r.customerId || null,
    customerName: r.customerName || null,
    amount: Number(r.amount),
    method: r.method,
    status: r.status,
    paymentDate: r.paymentDate,
    transactionRef: r.transactionRef
  };
}

export async function getPaymentsByCustomerId(customerId) {
  const rows = await runQuery(
    `MATCH (c:Customer {customerId: $customerId})-[:BOOKED]->(p:Parcel)-[:HAS_PAYMENT]->(pay:Payment)
     RETURN pay.paymentId AS paymentId, p.trackingNumber AS trackingNumber,
            c.customerId AS customerId, c.name AS customerName,
            pay.amount AS amount, pay.method AS method, pay.status AS status,
            toString(pay.paymentDate) AS paymentDate, pay.transactionRef AS transactionRef
     ORDER BY pay.paymentId DESC`,
    { customerId }
  );

  return rows.map(r => ({
    paymentId: r.paymentId,
    trackingNumber: r.trackingNumber,
    customerId: r.customerId || null,
    customerName: r.customerName || null,
    amount: Number(r.amount),
    method: r.method,
    status: r.status,
    paymentDate: r.paymentDate,
    transactionRef: r.transactionRef
  }));
}

export async function listPayments({ status = null, method = null, page = 0, size = 10 } = {}) {
  const p = Math.max(0, parseInt(page, 10) || 0);
  const s = Math.max(1, parseInt(size, 10) || 10);
  const skip = p * s;

  const filterStatus = status && status.trim() ? status.trim().toUpperCase() : null;
  const filterMethod = method && method.trim() ? method.trim().toUpperCase() : null;

  const [paymentRows, countRows] = await Promise.all([
    runQuery(
      `MATCH (p:Parcel)-[:HAS_PAYMENT]->(pay:Payment)
       OPTIONAL MATCH (c:Customer)-[:BOOKED]->(p)
       WHERE ($status IS NULL OR pay.status = $status)
         AND ($method IS NULL OR pay.method = $method)
       RETURN pay.paymentId AS paymentId, p.trackingNumber AS trackingNumber,
              c.customerId AS customerId, c.name AS customerName,
              pay.amount AS amount, pay.method AS method, pay.status AS status,
              toString(pay.paymentDate) AS paymentDate, pay.transactionRef AS transactionRef
       ORDER BY pay.paymentId DESC SKIP $skip LIMIT $limit`,
      { status: filterStatus, method: filterMethod, skip, limit: s }
    ),
    runQuery(
      `MATCH (p:Parcel)-[:HAS_PAYMENT]->(pay:Payment)
       WHERE ($status IS NULL OR pay.status = $status)
         AND ($method IS NULL OR pay.method = $method)
       RETURN count(pay) AS total`,
      { status: filterStatus, method: filterMethod }
    )
  ]);

  const list = paymentRows.map(r => ({
    paymentId: r.paymentId,
    trackingNumber: r.trackingNumber,
    customerId: r.customerId || null,
    customerName: r.customerName || null,
    amount: Number(r.amount),
    method: r.method,
    status: r.status,
    paymentDate: r.paymentDate,
    transactionRef: r.transactionRef
  }));

  const total = countRows[0]?.total || 0;
  return paginate(list, p, s, total);
}

export async function getPaymentSummary() {
  const rows = await runQuery(`
    MATCH (pay:Payment)
    RETURN
      coalesce(sum(CASE WHEN pay.status = 'PAID' THEN pay.amount ELSE 0 END), 0) AS totalPaid,
      coalesce(sum(CASE WHEN pay.status = 'PENDING' THEN pay.amount ELSE 0 END), 0) AS totalPending,
      count(pay) AS totalCount,
      sum(CASE WHEN pay.status = 'PAID' THEN 1 ELSE 0 END) AS paidCount,
      sum(CASE WHEN pay.status = 'PENDING' THEN 1 ELSE 0 END) AS pendingCount,
      sum(CASE WHEN pay.status = 'FAILED' THEN 1 ELSE 0 END) AS failedCount
  `);

  const summary = rows[0] || {};
  return {
    totalPaid: Number(summary.totalPaid || 0),
    totalPending: Number(summary.totalPending || 0),
    totalTransactions: Number(summary.totalCount || 0),
    paidCount: Number(summary.paidCount || 0),
    pendingCount: Number(summary.pendingCount || 0),
    failedCount: Number(summary.failedCount || 0)
  };
}
