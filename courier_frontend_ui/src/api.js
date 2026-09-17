const API_BASE = 'http://localhost:8081/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage = (typeof data === 'object' && data.message)
        ? data.message
        : (typeof data === 'string' && data.length > 0 ? data : `HTTP ${response.status}: ${response.statusText}`);
      throw new Error(errorMessage);
    }
    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Backend server is offline or unreachable at http://localhost:8081. Please ensure Spring Boot is running.');
    }
    throw error;
  }
}

export const api = {
  // Customer
  getCustomers: () => request('/customers'),
  getCustomer: (id) => request(`/customers/${id}`),
  createCustomer: (data) => request('/customers', { method: 'POST', body: data }),
  updateCustomer: (id, data) => request(`/customers/${id}`, { method: 'PUT', body: data }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: 'DELETE' }),
  searchCustomers: (name) => request(`/customers/search?name=${encodeURIComponent(name)}`),

  // Courier
  getCouriers: () => request('/couriers'),
  getCourier: (id) => request(`/couriers/${id}`),
  createCourier: (data) => request('/couriers', { method: 'POST', body: data }),
  updateCourier: (id, data) => request(`/couriers/${id}`, { method: 'PUT', body: data }),
  deleteCourier: (id) => request(`/couriers/${id}`, { method: 'DELETE' }),
  searchCouriers: (name) => request(`/couriers/search?name=${encodeURIComponent(name)}`),

  // Branch
  getBranches: () => request('/branches'),
  getBranch: (id) => request(`/branches/${id}`),
  createBranch: (data) => request('/branches', { method: 'POST', body: data }),
  updateBranch: (id, data) => request(`/branches/${id}`, { method: 'PUT', body: data }),
  deleteBranch: (id) => request(`/branches/${id}`, { method: 'DELETE' }),

  // Staff
  getStaff: () => request('/staff'),
  getStaffById: (id) => request(`/staff/${id}`),
  createStaff: (data) => request('/staff', { method: 'POST', body: data }),
  updateStaff: (id, data) => request(`/staff/${id}`, { method: 'PUT', body: data }),
  deleteStaff: (id) => request(`/staff/${id}`, { method: 'DELETE' }),
  getStaffByBranch: (branchId) => request(`/staff/branch/${branchId}`),

  // Courier Service
  getServices: () => request('/courier-services'),
  getService: (id) => request(`/courier-services/${id}`),
  createService: (data) => request('/courier-services', { method: 'POST', body: data }),
  updateService: (id, data) => request(`/courier-services/${id}`, { method: 'PUT', body: data }),
  deleteService: (id) => request(`/courier-services/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: () => request('/orders'),
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (data) => request('/orders', { method: 'POST', body: data }),
  updateOrder: (id, data) => request(`/orders/${id}`, { method: 'PUT', body: data }),
  deleteOrder: (id) => request(`/orders/${id}`, { method: 'DELETE' }),
  searchOrders: (status) => request(`/orders/search?status=${encodeURIComponent(status)}`),
  getOrdersByCustomer: (customerId) => request(`/orders/customer/${customerId}`),

  // Payments
  getPayments: () => request('/payments'),
  getPayment: (id) => request(`/payments/${id}`),
  createPayment: (data) => request('/payments', { method: 'POST', body: data }),
  updatePayment: (id, data) => request(`/payments/${id}`, { method: 'PUT', body: data }),
  deletePayment: (id) => request(`/payments/${id}`, { method: 'DELETE' }),

  // Parcels
  getParcels: () => request('/parcels'),
  getParcel: (id) => request(`/parcels/${id}`),
  createParcel: (data) => request('/parcels', { method: 'POST', body: data }),
  updateParcel: (id, data) => request(`/parcels/${id}`, { method: 'PUT', body: data }),
  deleteParcel: (id) => request(`/parcels/${id}`, { method: 'DELETE' }),
  getParcelsByOrder: (orderId) => request(`/parcels/order/${orderId}`),

  // Tracking Events
  getTrackingEvents: () => request('/tracking-events'),
  getTrackingEvent: (id) => request(`/tracking-events/${id}`),
  createTrackingEvent: (data) => request('/tracking-events', { method: 'POST', body: data }),
  updateTrackingEvent: (id, data) => request(`/tracking-events/${id}`, { method: 'PUT', body: data }),
  deleteTrackingEvent: (id) => request(`/tracking-events/${id}`, { method: 'DELETE' }),
  getTrackingByParcel: (parcelId) => request(`/tracking-events/parcel/${parcelId}`),

  // Vehicles
  getVehicles: () => request('/vehicles'),
  getVehicle: (vehicleNo) => request(`/vehicles/${encodeURIComponent(vehicleNo)}`),
  createVehicle: (data) => request('/vehicles', { method: 'POST', body: data }),
  updateVehicle: (vehicleNo, data) => request(`/vehicles/${encodeURIComponent(vehicleNo)}`, { method: 'PUT', body: data }),
  deleteVehicle: (vehicleNo) => request(`/vehicles/${encodeURIComponent(vehicleNo)}`, { method: 'DELETE' }),

  // Delivery Attempts
  getDeliveryAttempts: () => request('/delivery-attempts'),
  createDeliveryAttempt: (data) => request('/delivery-attempts', { method: 'POST', body: data }),
  updateDeliveryAttempt: (branchId, attemptNo, data) => request(`/delivery-attempts/${branchId}/${attemptNo}`, { method: 'PUT', body: data }),
  deleteDeliveryAttempt: (branchId, attemptNo) => request(`/delivery-attempts/${branchId}/${attemptNo}`, { method: 'DELETE' }),

  // Database Demonstration: SQL Queries
  getSqlQueries: () => request('/database/queries'),
  runSqlQuery: (queryKey) => request(`/database/query/${queryKey}`),
  executeCustomSql: (sql) => request('/sql', { method: 'POST', body: { sql } }),
  executeSql: (sql) => request('/sql', { method: 'POST', body: { sql } }),

  // Database Demonstration: PL/SQL Operations
  getPlsqlOperations: () => request('/database/plsql/operations'),
  executePlsql: (payload) => request('/database/plsql/execute', { method: 'POST', body: payload }),
  getCustomerOrderCount: (customerId) => request(`/plsql/customer-orders/${customerId}`),

  // Database Schema Metadata
  getDatabaseSchema: () => request('/database/schema'),

  // Dashboard Stats
  getDashboardStats: () => request('/dashboard/stats'),
};

export default api;
