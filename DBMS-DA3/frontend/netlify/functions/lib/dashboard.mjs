/**
 * SwiftShip Netlify Functions - Dashboard Operations
 */
import { runQuery } from './database.mjs';
import { enrichParcels } from './parcels.mjs';

export async function getDashboardSummary() {
  const [
    custCountRows,
    parcelCountRows,
    statusRows,
    agentRows,
    outcomeRows,
    serviceRows,
    branchRows,
    paymentRows,
    recentBookingRows,
    recentTrackingRows
  ] = await Promise.all([
    runQuery('MATCH (c:Customer) RETURN count(c) AS total'),
    runQuery('MATCH (p:Parcel) RETURN count(p) AS total'),
    runQuery('MATCH (p:Parcel) RETURN p.status AS status, count(p) AS count ORDER BY count DESC'),
    runQuery(`
      MATCH (da:DeliveryAgent)
      OPTIONAL MATCH (da)-[:ASSIGNED_TO]->(p:Parcel)
      RETURN da.name AS agentName, count(p) AS count
      ORDER BY count DESC
    `),
    runQuery('MATCH (da:DeliveryAttempt) RETURN da.result AS result, count(da) AS count'),
    runQuery(`
      MATCH (cs:CourierService)
      OPTIONAL MATCH (p:Parcel)-[:USES_SERVICE]->(cs)
      RETURN cs.name AS serviceName, count(p) AS count
      ORDER BY count DESC
    `),
    runQuery(`
      MATCH (b:Branch)
      OPTIONAL MATCH (p1:Parcel)-[:ORIGINATED_AT]->(b)
      OPTIONAL MATCH (p2:Parcel)-[:DESTINED_FOR]->(b)
      RETURN b.branchId AS branchId, b.name AS branchName,
             count(DISTINCT p1) AS originating, count(DISTINCT p2) AS destined
    `),
    runQuery(`
      MATCH (pay:Payment)
      RETURN
        coalesce(sum(CASE WHEN pay.status = 'PAID' THEN pay.amount ELSE 0 END), 0) AS totalPaid,
        coalesce(sum(CASE WHEN pay.status = 'PENDING' THEN pay.amount ELSE 0 END), 0) AS totalPending,
        count(pay) AS totalCount,
        sum(CASE WHEN pay.status = 'PAID' THEN 1 ELSE 0 END) AS paidCount,
        sum(CASE WHEN pay.status = 'PENDING' THEN 1 ELSE 0 END) AS pendingCount,
        sum(CASE WHEN pay.status = 'FAILED' THEN 1 ELSE 0 END) AS failedCount
    `),
    runQuery(`
      MATCH (p:Parcel)
      WITH p ORDER BY p.trackingNumber DESC LIMIT 5
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
      ORDER BY p.trackingNumber DESC
    `),
    runQuery(`
      MATCH (p:Parcel)-[:HAS_TRACKING_EVENT]->(te:TrackingEvent)
      RETURN te.eventId AS eventId, p.trackingNumber AS trackingNumber, te.location AS location,
             te.status AS status, toString(te.timestamp) AS timestamp, te.remarks AS remarks
      ORDER BY te.timestamp DESC LIMIT 5
    `)
  ]);

  const totalCustomers = custCountRows[0]?.total || 0;
  const totalParcels = parcelCountRows[0]?.total || 0;

  const parcelsByStatus = {};
  for (const row of statusRows) {
    if (row.status) parcelsByStatus[row.status] = row.count || 0;
  }

  const agentWorkload = {};
  for (const row of agentRows) {
    if (row.agentName) agentWorkload[row.agentName] = row.count || 0;
  }

  const outcomeCounts = {};
  for (const row of outcomeRows) {
    if (row.result) outcomeCounts[row.result] = row.count || 0;
  }

  const courierServiceUsage = {};
  for (const row of serviceRows) {
    if (row.serviceName) courierServiceUsage[row.serviceName] = row.count || 0;
  }

  const branchParcelCounts = {};
  for (const row of branchRows) {
    if (row.branchName) {
      branchParcelCounts[row.branchName] = {
        originating: row.originating || 0,
        destined: row.destined || 0
      };
    }
  }

  const paySummary = paymentRows[0] || {};
  const totalCollectedRevenue = paySummary.totalPaid !== undefined ? Number(paySummary.totalPaid) : 0;
  const pendingPaymentTotal = paySummary.totalPending !== undefined ? Number(paySummary.totalPending) : 0;

  const deliveredParcelsCount = parcelsByStatus['DELIVERED'] || 0;
  const cancelledParcelsCount = parcelsByStatus['CANCELLED'] || 0;
  const pendingParcelsCount = Math.max(0, totalParcels - deliveredParcelsCount - cancelledParcelsCount);

  const successfulDeliveriesCount = outcomeCounts['SUCCESS'] || 0;
  let failedDeliveriesCount = 0;
  for (const [res, count] of Object.entries(outcomeCounts)) {
    if (res.toUpperCase() !== 'SUCCESS') {
      failedDeliveriesCount += count;
    }
  }

  // Format recent bookings
  const formattedBookings = recentBookingRows.map(mapParcelRow);
  await enrichParcels(formattedBookings);

  const formattedTracking = recentTrackingRows.map(row => ({
    eventId: row.eventId,
    trackingNumber: row.trackingNumber,
    location: row.location,
    status: row.status,
    remarks: row.remarks,
    timestamp: row.timestamp
  }));

  return {
    totalCustomers,
    totalParcels,
    deliveredParcelsCount,
    pendingParcelsCount,
    totalCollectedRevenue,
    pendingPaymentTotal,
    successfulDeliveriesCount,
    failedDeliveriesCount,
    parcelsByStatus,
    agentWorkload,
    branchParcelCounts,
    courierServiceUsage,
    recentBookings: formattedBookings,
    recentTrackingEvents: formattedTracking
  };
}

export function mapParcelRow(row) {
  if (!row) return null;
  const dto = {
    trackingNumber: row.trackingNumber,
    weight: row.weight !== null && row.weight !== undefined ? Number(row.weight) : null,
    deliveryCharge: row.deliveryCharge !== null && row.deliveryCharge !== undefined ? Number(row.deliveryCharge) : null,
    status: row.status,
    customer: null,
    originBranch: null,
    destinationBranch: null,
    courierService: null,
    assignedAgent: null,
    payment: null,
    trackingEvents: [],
    deliveryAttempts: []
  };

  if (row.customerId) {
    dto.customer = {
      customerId: row.customerId,
      name: row.customerName,
      email: row.customerEmail,
      phone: row.customerPhone,
      address: row.customerAddress,
      totalParcelsBooked: row.customerTotalParcels !== undefined ? Number(row.customerTotalParcels) : 0
    };
  }

  if (row.originBranchId) {
    dto.originBranch = {
      branchId: row.originBranchId,
      name: row.originBranchName,
      city: row.originCity
    };
  }

  if (row.destBranchId) {
    dto.destinationBranch = {
      branchId: row.destBranchId,
      name: row.destBranchName,
      city: row.destCity
    };
  }

  if (row.serviceId) {
    dto.courierService = {
      serviceId: row.serviceId,
      name: row.serviceName,
      estimatedDays: row.estimatedDays !== undefined ? Number(row.estimatedDays) : null,
      baseCharge: row.baseCharge !== undefined ? Number(row.baseCharge) : null,
      description: row.serviceDescription,
      active: row.serviceActive !== undefined ? Boolean(row.serviceActive) : true
    };
  }

  if (row.agentId) {
    dto.assignedAgent = {
      agentId: row.agentId,
      name: row.agentName,
      phone: row.agentPhone,
      status: row.agentStatus
    };
  }

  if (row.paymentId) {
    dto.payment = {
      paymentId: row.paymentId,
      amount: row.paymentAmount !== undefined ? Number(row.paymentAmount) : null,
      method: row.paymentMethod,
      status: row.paymentStatus,
      trackingNumber: row.trackingNumber,
      customerId: row.customerId,
      customerName: row.customerName,
      paymentDate: row.paymentDate,
      transactionRef: row.transactionRef
    };
  }

  return dto;
}
