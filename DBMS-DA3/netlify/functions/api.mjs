/**
 * SwiftShip Netlify Functions - Main Serverless API Entrypoint
 * Replaces Spring Boot backend on Netlify Free while maintaining full REST API compatibility with Neo4j AuraDB.
 */

import { json, error, noContent, parseEvent, CORS_HEADERS } from './lib/utils.mjs';
import { pingDatabase } from './lib/database.mjs';
import { getDashboardSummary } from './lib/dashboard.mjs';
import * as customers from './lib/customers.mjs';
import * as parcels from './lib/parcels.mjs';
import * as tracking from './lib/tracking.mjs';
import * as attempts from './lib/delivery-attempts.mjs';
import * as agents from './lib/agents.mjs';
import * as vehicles from './lib/vehicles.mjs';
import * as branches from './lib/branches.mjs';
import * as routes from './lib/routes.mjs';
import * as payments from './lib/payments.mjs';
import * as tickets from './lib/support-tickets.mjs';
import * as services from './lib/services.mjs';
import * as staff from './lib/staff.mjs';

/**
 * Main HTTP router function
 */
export async function router(method, path, query, body) {
  // 0. API Root / Service Info
  if ((path === '/' || path === '/api' || path === '') && method === 'GET') {
    return json({
      service: 'SwiftShip Courier Management API',
      version: '1.0.0',
      status: 'UP',
      docs: '/api/health'
    });
  }

  // 1. Health checks
  if ((path === '/api/health' || path === '/actuator/health') && method === 'GET') {
    try {
      const isConnected = await pingDatabase();
      if (isConnected) {
        return json({ status: 'UP', neo4j: 'UP' }, 200);
      }
      return json({ status: 'DOWN', neo4j: 'DOWN', error: 'Database ping returned false' }, 503);
    } catch (err) {
      return json({ status: 'DOWN', neo4j: 'DOWN', error: err.message }, 503);
    }
  }

  // 2. Dashboard
  if ((path === '/api/dashboard' || path === '/api/dashboard/summary') && method === 'GET') {
    const summary = await getDashboardSummary();
    return json(summary);
  }

  // 3. Customers
  if (path === '/api/customers' && method === 'POST') {
    const created = await customers.createCustomer(body);
    return json(created, 201);
  }
  if (path === '/api/customers' && method === 'GET') {
    const res = await customers.listCustomers(query);
    return json(res);
  }
  if (path === '/api/customers/search' && method === 'GET') {
    const res = await customers.searchCustomers(query.query);
    return json(res);
  }
  const custHistoryMatch = path.match(/^\/api\/customers\/([^/]+)\/history$/);
  if (custHistoryMatch && method === 'GET') {
    const res = await customers.getCustomerHistory(decodeURIComponent(custHistoryMatch[1]));
    return json(res);
  }
  const custParcelsMatch = path.match(/^\/api\/customers\/([^/]+)\/parcels$/);
  if (custParcelsMatch && method === 'GET') {
    const res = await customers.getCustomerParcels(decodeURIComponent(custParcelsMatch[1]));
    return json(res);
  }
  const custIdMatch = path.match(/^\/api\/customers\/([^/]+)$/);
  if (custIdMatch) {
    const id = decodeURIComponent(custIdMatch[1]);
    if (method === 'GET') {
      const res = await customers.getCustomerById(id);
      return json(res);
    }
    if (method === 'PUT') {
      const res = await customers.updateCustomer(id, body);
      return json(res);
    }
    if (method === 'DELETE') {
      await customers.deleteCustomer(id);
      return noContent();
    }
  }

  // 4. Parcels
  if (path === '/api/parcels' && method === 'POST') {
    const created = await parcels.bookParcel(body);
    return json(created, 201);
  }
  if ((path === '/api/parcels' || path === '/api/parcels/search') && method === 'GET') {
    const res = await parcels.searchParcels(query);
    return json(res);
  }
  const parcelCancelMatch = path.match(/^\/api\/parcels\/([^/]+)\/cancel$/);
  if (parcelCancelMatch && (method === 'POST' || method === 'PATCH')) {
    const trackingNumber = decodeURIComponent(parcelCancelMatch[1]);
    const res = await parcels.cancelParcel(trackingNumber, body?.reason);
    return json(res);
  }
  const parcelTrackingMatch = path.match(/^\/api\/parcels\/([^/]+)$/);
  if (parcelTrackingMatch) {
    const trackingNumber = decodeURIComponent(parcelTrackingMatch[1]);
    if (method === 'GET') {
      const res = await parcels.getParcelByTrackingNumber(trackingNumber);
      return json(res);
    }
    if (method === 'PUT') {
      const res = await parcels.updateParcel(trackingNumber, body);
      return json(res);
    }
  }

  // 5. Tracking
  if (path === '/api/tracking' && method === 'POST') {
    const created = await tracking.addTrackingEvent(body.trackingNumber, body);
    return json(created, 201);
  }
  if ((path === '/api/tracking' || path === '/api/tracking/recent') && method === 'GET') {
    const res = await tracking.getRecentEvents(query.limit);
    return json(res);
  }
  const trackingStatusMatch = path.match(/^\/api\/tracking\/([^/]+)\/current-status$/);
  if (trackingStatusMatch && method === 'GET') {
    const res = await tracking.getCurrentStatus(decodeURIComponent(trackingStatusMatch[1]));
    return json(res);
  }
  const trackingNumberMatch = path.match(/^\/api\/tracking\/([^/]+)$/);
  if (trackingNumberMatch) {
    const tn = decodeURIComponent(trackingNumberMatch[1]);
    if (method === 'GET') {
      const res = await tracking.getTrackingHistory(tn);
      return json(res);
    }
    if (method === 'POST') {
      const res = await tracking.addTrackingEvent(tn, body);
      return json(res, 201);
    }
  }

  // 6. Delivery Attempts
  if (path === '/api/delivery-attempts' && method === 'POST') {
    const created = await attempts.recordAttempt(body);
    return json(created, 201);
  }
  if (path === '/api/delivery-attempts' && method === 'GET') {
    const res = await attempts.getAllAttempts();
    return json(res);
  }
  const attemptParcelMatch = path.match(/^\/api\/delivery-attempts\/parcel\/([^/]+)$/);
  if (attemptParcelMatch && method === 'GET') {
    const res = await attempts.getAttemptsByParcel(decodeURIComponent(attemptParcelMatch[1]));
    return json(res);
  }

  // 7. Delivery Agents
  if (path === '/api/agents' && method === 'POST') {
    const created = await agents.registerAgent(body);
    return json(created, 201);
  }
  if (path === '/api/agents' && method === 'GET') {
    const res = await agents.listAgents();
    return json(res);
  }
  if (path === '/api/agents/available' && method === 'GET') {
    const res = await agents.getAvailableAgents();
    return json(res);
  }
  const agentStatusMatch = path.match(/^\/api\/agents\/([^/]+)\/status$/);
  if (agentStatusMatch && method === 'PATCH') {
    const res = await agents.updateAgentStatus(decodeURIComponent(agentStatusMatch[1]), body?.status || query?.status);
    return json(res);
  }
  const agentAssignMatch = path.match(/^\/api\/agents\/([^/]+)\/assign\/([^/]+)$/);
  if (agentAssignMatch && method === 'POST') {
    const res = await agents.assignAgentToParcel(decodeURIComponent(agentAssignMatch[1]), decodeURIComponent(agentAssignMatch[2]));
    return json(res);
  }
  const agentReassignMatch = path.match(/^\/api\/agents\/([^/]+)\/reassign\/([^/]+)$/);
  if (agentReassignMatch && method === 'POST') {
    const res = await agents.reassignAgentToParcel(decodeURIComponent(agentReassignMatch[1]), decodeURIComponent(agentReassignMatch[2]));
    return json(res);
  }
  const agentCompleteMatch = path.match(/^\/api\/agents\/([^/]+)\/complete\/([^/]+)$/);
  if (agentCompleteMatch && method === 'POST') {
    const res = await agents.completeAssignment(decodeURIComponent(agentCompleteMatch[1]), decodeURIComponent(agentCompleteMatch[2]));
    return json(res);
  }
  const agentParcelsMatch = path.match(/^\/api\/agents\/([^/]+)\/parcels$/);
  if (agentParcelsMatch && method === 'GET') {
    const res = await agents.getParcelsByAgent(decodeURIComponent(agentParcelsMatch[1]));
    return json(res);
  }
  const agentDeliveriesMatch = path.match(/^\/api\/agents\/([^/]+)\/deliveries$/);
  if (agentDeliveriesMatch && method === 'GET') {
    const res = await agents.getAgentDeliveries(decodeURIComponent(agentDeliveriesMatch[1]));
    return json(res);
  }
  const agentIdMatch = path.match(/^\/api\/agents\/([^/]+)$/);
  if (agentIdMatch) {
    const id = decodeURIComponent(agentIdMatch[1]);
    if (method === 'GET') {
      const res = await agents.getAgentById(id);
      return json(res);
    }
    if (method === 'PUT') {
      const res = await agents.updateAgent(id, body);
      return json(res);
    }
  }

  // 8. Vehicles
  if (path === '/api/vehicles' && method === 'POST') {
    const created = await vehicles.registerVehicle(body);
    return json(created, 201);
  }
  if (path === '/api/vehicles' && method === 'GET') {
    const res = await vehicles.listVehicles();
    return json(res);
  }
  const vehicleAssignMatch = path.match(/^\/api\/vehicles\/([^/]+)\/assign-agent\/([^/]+)$/);
  if (vehicleAssignMatch && method === 'POST') {
    const res = await vehicles.assignVehicleToAgent(decodeURIComponent(vehicleAssignMatch[1]), decodeURIComponent(vehicleAssignMatch[2]));
    return json(res);
  }
  const vehicleUnassignMatch = path.match(/^\/api\/vehicles\/([^/]+)\/unassign$/);
  if (vehicleUnassignMatch && method === 'POST') {
    const res = await vehicles.unassignVehicle(decodeURIComponent(vehicleUnassignMatch[1]));
    return json(res);
  }
  const vehicleIdMatch = path.match(/^\/api\/vehicles\/([^/]+)$/);
  if (vehicleIdMatch) {
    const id = decodeURIComponent(vehicleIdMatch[1]);
    if (method === 'GET') {
      const res = await vehicles.getVehicleById(id);
      return json(res);
    }
    if (method === 'PUT') {
      const res = await vehicles.updateVehicle(id, body);
      return json(res);
    }
  }

  // 9. Branches
  if (path === '/api/branches' && method === 'POST') {
    const created = await branches.createBranch(body);
    return json(created, 201);
  }
  if (path === '/api/branches' && method === 'GET') {
    const res = await branches.listBranches();
    return json(res);
  }
  if (path === '/api/branches/search' && method === 'GET') {
    const res = await branches.searchBranches(query.query);
    return json(res);
  }
  const branchParcelsMatch = path.match(/^\/api\/branches\/([^/]+)\/parcels$/);
  if (branchParcelsMatch && method === 'GET') {
    const res = await branches.getParcelsByBranch(decodeURIComponent(branchParcelsMatch[1]), query.type);
    return json(res);
  }
  const branchConnectedMatch = path.match(/^\/api\/branches\/([^/]+)\/connected$/);
  if (branchConnectedMatch && method === 'GET') {
    const res = await branches.getConnectedBranches(decodeURIComponent(branchConnectedMatch[1]));
    return json(res);
  }
  const branchIdMatch = path.match(/^\/api\/branches\/([^/]+)$/);
  if (branchIdMatch) {
    const id = decodeURIComponent(branchIdMatch[1]);
    if (method === 'GET') {
      const res = await branches.getBranchById(id);
      return json(res);
    }
    if (method === 'PUT') {
      const res = await branches.updateBranch(id, body);
      return json(res);
    }
    if (method === 'DELETE') {
      await branches.deleteBranch(id);
      return noContent();
    }
  }

  // 10. Routes
  if ((path === '/api/routes' || path === '/api/routes/explore') && method === 'GET') {
    const res = await routes.exploreRoutes(query.from, query.to);
    return json(res);
  }

  // 11. Payments
  if (path === '/api/payments' && method === 'POST') {
    const created = await payments.recordPayment(body);
    return json(created, 201);
  }
  if (path === '/api/payments' && method === 'GET') {
    const res = await payments.listPayments(query);
    return json(res);
  }
  if (path === '/api/payments/summary' && method === 'GET') {
    const res = await payments.getPaymentSummary();
    return json(res);
  }
  const paymentParcelMatch = path.match(/^\/api\/payments\/parcel\/([^/]+)$/);
  if (paymentParcelMatch && method === 'GET') {
    const res = await payments.getPaymentByParcel(decodeURIComponent(paymentParcelMatch[1]));
    return json(res);
  }
  const paymentCustomerMatch = path.match(/^\/api\/payments\/customer\/([^/]+)$/);
  if (paymentCustomerMatch && method === 'GET') {
    const res = await payments.getPaymentsByCustomerId(decodeURIComponent(paymentCustomerMatch[1]));
    return json(res);
  }
  const paymentIdMatch = path.match(/^\/api\/payments\/([^/]+)$/);
  if (paymentIdMatch && method === 'GET') {
    const res = await payments.getPaymentById(decodeURIComponent(paymentIdMatch[1]));
    return json(res);
  }

  // 12. Support Tickets
  if (path === '/api/support-tickets' && method === 'POST') {
    const created = await tickets.createTicket(body);
    return json(created, 201);
  }
  if (path === '/api/support-tickets' && method === 'GET') {
    const res = await tickets.listTickets(query);
    return json(res);
  }
  const ticketStatusMatch = path.match(/^\/api\/support-tickets\/([^/]+)\/status$/);
  if (ticketStatusMatch && method === 'PUT') {
    const res = await tickets.updateTicketStatus(decodeURIComponent(ticketStatusMatch[1]), body);
    return json(res);
  }
  const ticketAssignMatch = path.match(/^\/api\/support-tickets\/([^/]+)\/assign\/([^/]+)$/);
  if (ticketAssignMatch && method === 'POST') {
    const res = await tickets.assignTicketToStaff(decodeURIComponent(ticketAssignMatch[1]), decodeURIComponent(ticketAssignMatch[2]));
    return json(res);
  }
  const ticketCustomerMatch = path.match(/^\/api\/support-tickets\/customer\/([^/]+)$/);
  if (ticketCustomerMatch && method === 'GET') {
    const res = await tickets.getTicketsByCustomerId(decodeURIComponent(ticketCustomerMatch[1]));
    return json(res);
  }
  const ticketIdMatch = path.match(/^\/api\/support-tickets\/([^/]+)$/);
  if (ticketIdMatch && method === 'GET') {
    const res = await tickets.getTicketById(decodeURIComponent(ticketIdMatch[1]));
    return json(res);
  }

  // 13. Courier Services
  if (path === '/api/services' && method === 'POST') {
    const created = await services.createService(body);
    return json(created, 201);
  }
  if (path === '/api/services' && method === 'GET') {
    const res = await services.listServices();
    return json(res);
  }
  const serviceIdMatch = path.match(/^\/api\/services\/([^/]+)$/);
  if (serviceIdMatch) {
    const id = decodeURIComponent(serviceIdMatch[1]);
    if (method === 'GET') {
      const res = await services.getServiceById(id);
      return json(res);
    }
    if (method === 'PUT') {
      const res = await services.updateService(id, body);
      return json(res);
    }
  }

  // 14. Staff
  if (path === '/api/staff' && method === 'POST') {
    const created = await staff.createStaff(body);
    return json(created, 201);
  }
  if (path === '/api/staff' && method === 'GET') {
    const res = await staff.listStaff();
    return json(res);
  }
  const staffRoleMatch = path.match(/^\/api\/staff\/role\/([^/]+)$/);
  if (staffRoleMatch && method === 'GET') {
    const res = await staff.getStaffByRole(decodeURIComponent(staffRoleMatch[1]));
    return json(res);
  }
  const staffIdMatch = path.match(/^\/api\/staff\/([^/]+)$/);
  if (staffIdMatch) {
    const id = decodeURIComponent(staffIdMatch[1]);
    if (method === 'GET') {
      const res = await staff.getStaffById(id);
      return json(res);
    }
    if (method === 'PUT') {
      const res = await staff.updateStaff(id, body);
      return json(res);
    }
    if (method === 'DELETE') {
      await staff.deleteStaff(id);
      return noContent();
    }
  }

  // If no route matched
  return error(`Resource not found for ${method} ${path}`, 404);
}

/**
 * Universal Handler supporting both Netlify Functions v1 (Lambda event) and v2 (standard Request)
 */
export async function handler(event, context) {
  // Check if first argument is a Web standard Request (Netlify v2)
  if (typeof Request !== 'undefined' && event instanceof Request) {
    const req = event;
    const url = new URL(req.url);
    const method = req.method.toUpperCase();

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    let body = {};
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        const text = await req.text();
        if (text) body = JSON.parse(text);
      } catch (_) {}
    }

    const query = Object.fromEntries(url.searchParams.entries());
    let path = url.pathname;
    if (query.route) {
      path = query.route;
    }
    path = '/' + path.replace(/^\/+|\/+$/g, '');
    if (path.startsWith('/.netlify/functions/api')) {
      path = path.slice('/.netlify/functions/api'.length);
      if (!path.startsWith('/')) path = '/' + path;
    }

    if (path === '/' || path === '') {
      const orig = req.headers?.get?.('x-forwarded-uri') || req.headers?.get?.('x-original-uri');
      if (orig) {
        try {
          const u = new URL(orig, 'http://localhost');
          if (u.pathname && !u.pathname.startsWith('/.netlify/functions')) path = u.pathname;
        } catch (_) {
          if (orig.startsWith('/') && !orig.startsWith('/.netlify/functions')) path = orig;
        }
      }
    }
    path = '/' + path.replace(/^\/+|\/+$/g, '');

    try {
      const res = await router(method, path, query, body);
      const responseBody = (res.statusCode === 204 || res.statusCode === 304 || method === 'HEAD') ? null : res.body;
      return new Response(responseBody, {
        status: res.statusCode,
        headers: res.headers
      });
    } catch (err) {
      const status = err.status || 500;
      return new Response(JSON.stringify({ error: err.message, status, timestamp: new Date().toISOString() }), {
        status,
        headers: CORS_HEADERS
      });
    }
  }

  // Otherwise, handle as Netlify Functions v1 (AWS Lambda event format)
  const { method, path, query, body } = parseEvent(event);

  if (method === 'OPTIONS') {
    return noContent();
  }

  if (body === null) {
    return error('Invalid JSON payload in request body', 400);
  }

  try {
    return await router(method, path, query, body);
  } catch (err) {
    const status = err.status || 500;
    return error(err.message || 'Internal Server Error', status);
  }
}

export default handler;
