// ==============================================================================
// Courier Management System - Neo4j Schema & Constraints
// ==============================================================================
// All constraints use "IF NOT EXISTS" to safely preserve existing data.
// DO NOT DROP OR RECREATE EXISTING DATA.

// Uniqueness Constraints
CREATE CONSTRAINT customer_id_unique IF NOT EXISTS FOR (c:Customer) REQUIRE c.customerId IS UNIQUE;
CREATE CONSTRAINT parcel_tracking_unique IF NOT EXISTS FOR (p:Parcel) REQUIRE p.trackingNumber IS UNIQUE;
CREATE CONSTRAINT branch_id_unique IF NOT EXISTS FOR (b:Branch) REQUIRE b.branchId IS UNIQUE;
CREATE CONSTRAINT agent_id_unique IF NOT EXISTS FOR (a:DeliveryAgent) REQUIRE a.agentId IS UNIQUE;
CREATE CONSTRAINT vehicle_id_unique IF NOT EXISTS FOR (v:Vehicle) REQUIRE v.vehicleId IS UNIQUE;
CREATE CONSTRAINT payment_id_unique IF NOT EXISTS FOR (pay:Payment) REQUIRE pay.paymentId IS UNIQUE;
CREATE CONSTRAINT service_id_unique IF NOT EXISTS FOR (cs:CourierService) REQUIRE cs.serviceId IS UNIQUE;
CREATE CONSTRAINT event_id_unique IF NOT EXISTS FOR (te:TrackingEvent) REQUIRE te.eventId IS UNIQUE;
CREATE CONSTRAINT attempt_id_unique IF NOT EXISTS FOR (da:DeliveryAttempt) REQUIRE da.attemptId IS UNIQUE;
CREATE CONSTRAINT ticket_id_unique IF NOT EXISTS FOR (st:SupportTicket) REQUIRE st.ticketId IS UNIQUE;
CREATE CONSTRAINT staff_id_unique IF NOT EXISTS FOR (s:Staff) REQUIRE s.staffId IS UNIQUE;

// Indexes for common query acceleration
CREATE INDEX customer_email_idx IF NOT EXISTS FOR (c:Customer) ON (c.email);
CREATE INDEX customer_phone_idx IF NOT EXISTS FOR (c:Customer) ON (c.phone);
CREATE INDEX parcel_status_idx IF NOT EXISTS FOR (p:Parcel) ON (p.status);
CREATE INDEX tracking_timestamp_idx IF NOT EXISTS FOR (te:TrackingEvent) ON (te.timestamp);
