# DBMS DA3: SwiftShip Courier Management System (Neo4j Graph Database)

This folder contains the complete **DBMS DA3** implementation of the SwiftShip Courier Management System inside the existing `CourierManagement` repository.

> **Architecture Note & Relationship to DA2:**  
> - **DA2** is an **Oracle Relational Database (RDBMS)** system utilizing Oracle 26ai Free, EER relational schemas (20 tables), PL/SQL procedures, and AWS EC2 deployment. All DA2 code, scripts, and Oracle configurations remain completely intact in the repository root.  
> - **DA3** is a **NoSQL Graph Database** system built on **Neo4j 5.x**, Cypher graph traversals, and property graphs. It models courier logistics as an interconnected graph (customers, parcels, hubs, agents, routes, tracking milestones, payments, and vehicles).

---

## 🏛️ System Architecture

### Production Deployment (Netlify Free + Neo4j AuraDB Free)
For 100% free cloud deployment, the application runs entirely on Netlify using Netlify Functions for the serverless API backend, connected to Neo4j AuraDB Free:

```
[ Web Browser Frontend ]
   (HTML5, CSS3, Vanilla JS SPA in DBMS-DA3/frontend)
         │
         │ Same-origin REST API (/api/* & /actuator/health)
         ▼
[ Netlify Functions (Node.js 20+) ]
   (DBMS-DA3/netlify/functions/api.mjs)
         │
         │ Bolt Protocol with TLS (neo4j+s://...databases.neo4j.io)
         ▼
[ Neo4j AuraDB Free Cloud Instance ]
   (Cloud Graph Database)
```

### Local Reference Backend (Spring Boot 3.3.5 / Java 21)
The reference Spring Boot backend remains fully functional inside `DBMS-DA3/backend/` and can be run locally with local Neo4j:

```
[ Web Browser Frontend ] ──HTTP (8082)──> [ Spring Boot 3.3.5 (Java 21) ] ──Bolt──> [ Local Neo4j (7687) ]
```

---

### Graph Domain Model:
- **Nodes**:
  - `(:Customer)` — Customer accounts with email, phone, and delivery addresses.
  - `(:Parcel)` — Shipment entities with tracking numbers, weight, status, and delivery charges.
  - `(:Branch)` — Logistics hub locations with geographic coordinates and city metadata.
  - `(:DeliveryAgent)` — Delivery personnel with availability states (`AVAILABLE`, `ON_DELIVERY`, `INACTIVE`).
  - `(:Vehicle)` — Fleet units (`VAN`, `TRUCK`, `BIKE`) with registered capacities.
  - `(:CourierService)` — Shipping offerings (Standard, Express, Same-Day).
  - `(:TrackingEvent)` — Point-in-time milestone scans with timestamp and status.
  - `(:Payment)` — Transaction receipts (UPI, Card, Cash) linked to parcels.
  - `(:SupportTicket)` — Customer service inquiries with priority ratings.
  - `(:Staff)` — Operational and administrative team members.
- **Relationships**:
  - `(Customer)-[:BOOKED]->(Parcel)`
  - `(Parcel)-[:ORIGINATED_AT]->(Branch)`
  - `(Parcel)-[:DESTINED_FOR]->(Branch)`
  - `(Parcel)-[:USES_SERVICE]->(CourierService)`
  - `(DeliveryAgent)-[:ASSIGNED_TO]->(Parcel)`
  - `(Vehicle)-[:ASSIGNED_TO]->(DeliveryAgent)`
  - `(Staff)-[:WORKS_AT]->(Branch)`
  - `(Branch)-[:CONNECTS_TO {distanceKm, estimatedDurationMinutes}]->(Branch)`
  - `(Parcel)-[:HAS_EVENT]->(TrackingEvent)`
  - `(Parcel)-[:HAS_PAYMENT]->(Payment)`
  - `(Customer)-[:SUBMITTED]->(SupportTicket)`

---

## 🛠️ Advanced Database Tools & Exploration

The console provides dedicated DBMS tools designed for database engineering and academic coursework:

1. **Interactive SQL Query Builder (`sqlbuilder`)**:
   - Visual relational query generator based on logistics conceptual schemas (parcels, customers, branches, agents, vehicles, tracking, payments, tickets, staff).
   - Dynamic `SELECT`, `JOIN` (INNER, LEFT, RIGHT), `WHERE`, `GROUP BY`, `HAVING`, `ORDER BY`, and `LIMIT` construction.
   - Formatted ANSI SQL output with live syntax highlighting, clipboard copy, and `.sql` file download.
   - Relational Algebra projection preview demonstrating relational operators ($\pi, \sigma, \bowtie, \gamma$).
   - 5 analytical logistics presets for instant scenario analysis.
   - *Explicit educational disclosure badge highlighting relational preview mode vs. cloud Neo4j graph execution.*

2. **Oracle PL/SQL Laboratory (`plsql`)**:
   - Interactive procedural database lab containing real, executable PL/SQL programs:
     - **Triggers**: `trg_parcel_status_audit` (autonomous audit logging), `trg_validate_parcel_pricing` (pricing floor validation), `trg_prevent_unassigned_dispatch` (dispatch integrity exception).
     - **Explicit Cursors**: `cur_overdue_deliveries` (parameterized cursor lifecycle), `cur_branch_manifest_for_loop` (driver manifest generation), `cur_agent_performance_eval` (pessimistic row locking with `FOR UPDATE` and `CURRENT OF`).
     - **Implicit Cursor Attributes**: Practical demonstrations of `SQL%ROWCOUNT`, `SQL%FOUND`, `SQL%NOTFOUND`, and `SQL%ISOPEN`.
     - **Packages & Autonomous Transactions**: `pkg_courier_operations` with procedures, custom exception binding, and independent commit logging (`PRAGMA AUTONOMOUS_TRANSACTION`).
   - "Run DBMS Simulation" button generates realistic `DBMS_OUTPUT.PUT_LINE` terminal output buffer streams.
   - One-click clipboard copy and `.pls` file download.

3. **Live Neo4j Graph Explorer (`graph`)**:
   - Real-time graph visualization engine powered by HTML5 Canvas force simulation (zero external library or CDN dependencies).
   - Queries live cloud data via `GET /api/graph/overview` with configurable limits (`nodeLimit`, `relationshipLimit`), category filters, and search queries.
   - Color-coded entity nodes with captions and directed relationship labels (`BOOKED`, `ASSIGNED_TO`, `DESTINED_FOR`, etc.).
   - Fluid physics simulation (Coulomb repulsion, Hooke spring attraction, centering gravity, damping).
   - Interactive panning, zooming, node dragging, and slide-in Node Inspector Drawer.
   - Graceful empty-state handling guiding users to seed data via the booking interfaces when 0 nodes are stored.

---

## 📁 Directory Structure

```text
DBMS-DA3/
├── README.md                     # This documentation
├── DEPLOYMENT.md                 # Complete Netlify Free + AuraDB deployment guide
├── netlify.toml                  # Authoritative Netlify build, redirect, and header rules
├── package.json                  # Node.js dependencies (neo4j-driver) and test scripts
├── frontend/                     # Pure HTML5/CSS3/JavaScript SPA
│   ├── index.html                # Main operations dashboard interface
│   ├── styles.css                # Custom responsive CSS design system
│   ├── app.js                    # Centralized async REST API client & view controllers
│   ├── config.js                 # Runtime API configuration (same-origin by default)
│   └── README.md                 # Frontend documentation
├── netlify/                      # Serverless backend implementation
│   └── functions/
│       ├── api.mjs               # Universal API router & Netlify Functions entrypoint
│       └── lib/                  # Modular domain service libraries:
│           ├── database.mjs      # Neo4j driver connection pool & type serialization
│           ├── utils.mjs         # Response formatting, CORS, pagination helpers
│           ├── dashboard.mjs     # Metrics aggregation & recent activity
│           ├── customers.mjs     # Customer management & parcel history
│           ├── parcels.mjs       # Parcel booking, pricing calculation, lifecycle
│           ├── tracking.mjs      # Milestone tracking events & current status
│           ├── delivery-attempts.mjs # Attempt recording & delivery result sync
│           ├── agents.mjs        # Delivery agent assignment & run tracking
│           ├── vehicles.mjs      # Fleet inventory & driver binding
│           ├── branches.mjs      # Logistics hubs & graph connectivity
│           ├── routes.mjs        # Shipping lane exploration
│           ├── payments.mjs      # Payment processing & financial summaries
│           ├── support-tickets.mjs # Customer inquiries & staff assignment
│           ├── services.mjs      # Shipping tiers & rate configuration
│           ├── staff.mjs         # Internal team member administration
│           └── graph.mjs         # Live Neo4j graph nodes, edges & structural stats
├── test/                         # Automated Node.js unit tests (30 passing tests)
│   ├── api_routing.test.mjs
│   ├── database_serialization.test.mjs
│   ├── graph.test.mjs
│   └── utils.test.mjs
└── backend/                      # Reference Java 21 / Spring Boot 3.3.5 backend
    ├── pom.xml                   # Maven dependencies (Java 21, Spring Boot, Neo4j)
    ├── mvnw / mvnw.cmd           # Maven wrapper scripts
    ├── Dockerfile                # Production container specification
    ├── schema/
    │   └── neo4j_schema.cypher   # Cypher constraints & performance indexes
    └── src/
        ├── main/java/com/courier/ # Full reference Java controllers & services
        └── test/                 # Mockito unit tests (30 passing tests)
```

---

## 🚀 How to Run the Application

### Option A: Serverless on Netlify Free (Production Recommended)
Refer to [`DBMS-DA3/DEPLOYMENT.md`](DEPLOYMENT.md) for step-by-step setup:
1. Base directory: `DBMS-DA3`
2. Build command: `npm install`
3. Publish directory: `frontend`
4. Functions directory: `netlify/functions`
5. Configure environment variables in Netlify (`NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`, `NEO4J_DATABASE`).

### Option B: Local Full-Stack with Netlify CLI
Run the entire serverless application locally:
```powershell
cd D:\projects\CourierManagement\DBMS-DA3
npm install
npx netlify dev
```
Serves both the static frontend and serverless functions together at `http://localhost:8888`.

### Option C: Local Java Reference Backend
1. Start local Neo4j (port 7687).
2. Start Spring Boot backend:
   ```powershell
   cd D:\projects\CourierManagement\DBMS-DA3\backend
   .\mvnw.cmd spring-boot:run
   ```
3. Open `DBMS-DA3/frontend/index.html` in your browser.

---

## 🧪 Automated Testing

### 1. Serverless Node.js Tests (25 Tests)
```powershell
cd D:\projects\CourierManagement\DBMS-DA3
npm test
```
**Results:** 25 tests pass in ~600ms, validating:
- Universal Lambda v1 and Web Request v2 function handlers
- CORS preflight responses (204)
- 404 handler for unmatched routes
- Strict request validation (vehicle types, ticket priorities, delivery results, payment methods)
- Neo4j 64-bit integer, temporal, node, and relationship deserialization
- Page response metrics calculation

### 2. Java Reference Backend Tests (30 Tests)
```powershell
cd D:\projects\CourierManagement\DBMS-DA3\backend
.\mvnw.cmd test
```
**Results:** 30 tests run, 0 failures, 0 errors.

---

## 🌐 REST API Endpoint Reference

All endpoints below are available under `https://<site>.netlify.app/api/...` (or `http://localhost:8082/api/...` on Spring Boot):

| Domain | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Health** | `GET` | `/actuator/health` or `/api/health` | Live database connectivity verification |
| **Dashboard** | `GET` | `/api/dashboard/summary` | Real-time operations metrics, workload, and revenue |
| **Parcels** | `POST` | `/api/parcels` | Book shipment with dynamic rate calculation |
| | `GET` | `/api/parcels` | Paged listing with status/customer/branch filters |
| | `GET` | `/api/parcels/{trackingNumber}` | Retrieve parcel details and delivery charge |
| | `PUT` | `/api/parcels/{trackingNumber}` | Update weight, charge, or status |
| | `POST` | `/api/parcels/{trackingNumber}/cancel` | Cancel an active parcel shipment |
| **Tracking** | `GET` | `/api/tracking/{trackingNumber}` | Retrieve complete chronological milestone event history |
| | `GET` | `/api/tracking/{trackingNumber}/current-status`| Latest scan status and location |
| | `POST` | `/api/tracking` | Record a new milestone scan |
| **Delivery Attempts** | `POST` | `/api/delivery-attempts` | Record delivery attempt with auto-sync to parcel |
| | `GET` | `/api/delivery-attempts` | List all delivery attempts |
| | `GET` | `/api/delivery-attempts/parcel/{trackingNumber}` | Attempts by parcel |
| **Customers** | `POST` | `/api/customers` | Register customer profile |
| | `GET` | `/api/customers` | Paged customer directory |
| | `GET` | `/api/customers/{customerId}` | Profile details |
| | `GET` | `/api/customers/{customerId}/history` | Full parcel booking history for customer |
| | `GET` | `/api/customers/search?query=` | Search by name, email, or phone |
| **Agents** | `POST` | `/api/agents` | Register field delivery personnel |
| | `GET` | `/api/agents` | List all agents |
| | `GET` | `/api/agents/available` | Filter agents ready for dispatch |
| | `PATCH`| `/api/agents/{agentId}/status` | Update status (`AVAILABLE`, `ON_DELIVERY`, `INACTIVE`) |
| | `POST` | `/api/agents/{agentId}/assign/{trackingNumber}` | Assign agent to delivery run |
| | `POST` | `/api/agents/{agentId}/complete/{trackingNumber}` | Mark delivery run complete |
| **Fleet** | `POST` | `/api/vehicles` | Register vehicle (`VAN`, `TRUCK`, `BIKE`) |
| | `GET` | `/api/vehicles` | List fleet with capacity and driver assignment |
| | `POST` | `/api/vehicles/{vehicleId}/assign-agent/{agentId}` | Assign driver to vehicle |
| | `POST` | `/api/vehicles/{vehicleId}/unassign` | Unassign driver from vehicle |
| **Branches** | `POST` | `/api/branches` | Create logistics hub |
| | `GET` | `/api/branches` | List all hubs with originating/destined counts |
| | `GET` | `/api/branches/{branchId}/connected` | Connected transit hubs in graph |
| **Routes** | `GET` | `/api/routes` | Explore transit lanes, distances, and transit times |
| **Payments** | `POST` | `/api/payments` | Record payment (`CASH`, `CARD`, `UPI`) |
| | `GET` | `/api/payments` | Paged transaction list |
| | `GET` | `/api/payments/summary` | Collected vs pending financial totals |
| **Support** | `POST` | `/api/support-tickets` | Create support inquiry |
| | `GET` | `/api/support-tickets` | List tickets with priority and status filters |
| | `PUT` | `/api/support-tickets/{ticketId}/status` | Update status (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`) |
| **Services** | `POST` | `/api/services` | Define shipping tier and pricing |
| | `GET` | `/api/services` | List shipping products |
| **Staff** | `POST` | `/api/staff` | Create operational staff accounts |
| | `GET` | `/api/staff` | List staff members and branch assignments |

---

## 🛠️ Project Preservation Confirmation

- **DA2 Oracle AWS Implementation**: Preserved untouched in `courier-backend/`, `courier_frontend_ui/`, `scripts/`, `systemd/`, root batch scripts, and Git history.
- **DA3 Java Backend**: Preserved untouched in `DBMS-DA3/backend/`.
- **DA3 Serverless Implementation**: Self-contained inside `DBMS-DA3/`.
