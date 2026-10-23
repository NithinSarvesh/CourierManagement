# DBMS DA3: SwiftShip Courier Management System (Neo4j Graph Database)

This folder contains the complete **DBMS DA3** implementation of the SwiftShip Courier Management System inside the existing `CourierManagement` repository.

> **Architecture Note & Relationship to DA2:**  
> - **DA2** is an **Oracle Relational Database (RDBMS)** system utilizing Oracle 26ai Free, EER relational schemas (20 tables), PL/SQL procedures, and AWS EC2 deployment. All DA2 code, scripts, and Oracle configurations remain completely intact in the repository root.  
> - **DA3** is a **NoSQL Graph Database** system built on **Neo4j 5.x**, Cypher graph traversals, and Spring Data Neo4j. It models courier logistics as an interconnected property graph (customers, parcels, hubs, agents, routes, tracking milestones, and vehicles).

---

## 🏛️ System Architecture

```
[ Web Browser Frontend ]
   (HTML5, CSS3, Vanilla JS SPA in DBMS-DA3/frontend)
         │
         │ REST API (JSON) over HTTP
         ▼
[ Spring Boot 3.3.5 Backend (Java 21) ]
   (DBMS-DA3/backend - Listening on port 8082)
         │
         │ Bolt Protocol (bolt://localhost:7687)
         ▼
[ Neo4j 5.x Graph Database ]
   (Graph Nodes & Directed Relationships)
```

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

## 📁 Directory Structure

```text
DBMS-DA3/
├── README.md                     # This documentation
├── frontend/                     # Pure HTML5/CSS3/JavaScript SPA
│   ├── index.html                # Main operations dashboard interface
│   ├── styles.css                # Custom responsive CSS design system
│   ├── app.js                    # Centralized async REST API client & view controllers
│   └── README.md                 # Frontend documentation
└── backend/                      # Spring Boot 3.3.5 + Spring Data Neo4j
    ├── pom.xml                   # Maven dependencies (Java 21, Spring Boot, Neo4j)
    ├── mvnw / mvnw.cmd           # Maven wrapper scripts
    ├── .env.example              # Environment variables template
    ├── test-all-apis.sh          # Comprehensive automated curl test suite
    ├── schema/
    │   └── neo4j_schema.cypher   # Cypher constraints & performance indexes
    └── src/
        ├── main/
        │   ├── java/com/courier/
        │   │   ├── config/       # CorsConfig, DataInitializer
        │   │   ├── controller/   # 13 REST API controllers
        │   │   ├── dto/          # 26 Request / Response DTO models
        │   │   ├── exception/    # Global exception handler & error response
        │   │   ├── model/        # Neo4j @Node entity definitions
        │   │   ├── repository/   # Spring Data Neo4j Cypher repositories
        │   │   └── service/      # Business logic & graph transactions
        │   └── resources/
        │       └── application.properties # Neo4j & server configuration
        └── test/                 # Mockito unit tests (30 passing tests)
```

---

## ⚙️ Environment Variables & Configuration

The backend reads configuration from `application.properties` or environment variables:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `SERVER_PORT` | `8082` | HTTP port for the Spring Boot REST API |
| `NEO4J_URI` | `bolt://localhost:7687` | Neo4j Bolt connection endpoint |
| `NEO4J_USERNAME` | `neo4j` | Neo4j database username |
| `NEO4J_PASSWORD` | `12345678` | Neo4j database password |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:5173` | Allowed CORS origins (wildcard patterns supported) |

---

## 🚀 How to Run the DA3 Application

### Step 1: Start Neo4j Database

If you have Docker installed:
```bash
docker run -d \
  --name courier-neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/12345678 \
  neo4j:5-community
```
*(Alternatively, use **Neo4j Desktop** or a local Neo4j 5.x installation with port `7687` and password matching your config).*

Apply constraints and indexes (optional but recommended):
```bash
# Execute schema/neo4j_schema.cypher in the Neo4j Browser at http://localhost:7474
```

### Step 2: Build & Start the Backend

Open a terminal in `DBMS-DA3/backend`:
```powershell
# On Windows PowerShell:
.\mvnw.cmd spring-boot:run

# On Linux / macOS:
./mvnw spring-boot:run
```
The backend starts up on **port 8082**:
- Health endpoint: `http://localhost:8082/actuator/health`
- Base API: `http://localhost:8082/api`

### Step 3: Run the Frontend

The frontend is a standalone, dependency-free HTML/CSS/JavaScript application:
1. Simply double-click or open `DBMS-DA3/frontend/index.html` in any modern web browser (Chrome, Edge, Firefox).
2. Or serve it using any local static web server:
   ```powershell
   cd D:\projects\CourierManagement\DBMS-DA3\frontend
   # Using Python:
   python -m http.server 8080
   # Or using Node:
   npx serve .
   ```
3. Open `http://localhost:8080` in your browser. The connection indicator in the sidebar will display **"Connected (8082)"** once the backend is reachable.

---

## 🧪 Testing & Verification

### 1. Backend Unit Test Suite (30 Tests)
Run all 30 Mockito controller and service tests:
```powershell
cd D:\projects\CourierManagement\DBMS-DA3\backend
.\mvnw.cmd test
```
**Test Results:**
```text
[INFO] Results:
[INFO] Tests run: 30, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

### 2. End-to-End REST API Test Suite
With Neo4j and the backend running, execute the automated Bash test suite:
```bash
cd DBMS-DA3/backend
bash test-all-apis.sh
```

---

## 🌐 REST API Endpoint Reference

| Domain | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Dashboard** | `GET` | `/api/dashboard/summary` | Live metrics, status counts, revenue, and recent activity |
| **Parcels** | `POST` | `/api/parcels` | Book shipment with customer, origin/destination hubs, service |
| | `GET` | `/api/parcels` | Paged listing with status/customer/branch filters |
| | `GET` | `/api/parcels/{trackingNumber}` | Retrieve parcel details and delivery charge |
| | `PUT` | `/api/parcels/{trackingNumber}` | Update weight, charge, or status |
| | `POST` | `/api/parcels/{trackingNumber}/cancel` | Cancel an active parcel shipment |
| **Tracking** | `GET` | `/api/tracking/{trackingNumber}` | Retrieve complete chronological milestone event history |
| | `GET` | `/api/tracking/{trackingNumber}/current-status`| Latest scan status and location |
| | `POST` | `/api/tracking` | Record a new milestone scan (picked up, transit, delivered) |
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
| | `GET` | `/api/vehicles` | List fleet with capacity and status |
| | `POST` | `/api/vehicles/{vehicleId}/assign-agent/{agentId}` | Assign driver to vehicle |
| | `POST` | `/api/vehicles/{vehicleId}/unassign` | Unassign driver from vehicle |
| **Branches** | `POST` | `/api/branches` | Create logistics hub |
| | `GET` | `/api/branches` | List all hubs |
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

## 🛠️ Troubleshooting

1. **Backend Fails to Start (`Connection refused: /127.0.0.1:7687`)**:
   - Ensure Neo4j is running. Verify via `curl -I http://localhost:7474` or check port `7687`.
   - Verify credentials in `application.properties` match your Neo4j instance (`neo4j` / `12345678`).
2. **Frontend Shows "Offline (8082)"**:
   - Verify Spring Boot is running on port 8082 (`curl http://localhost:8082/actuator/health`).
   - Click the connection status in the sidebar to view or change the configured API base URL.
3. **CORS Rejection**:
   - `CorsConfig.java` has been configured with `setAllowedOriginPatterns(Arrays.asList("*"))` allowing all browser origins, local file schemes, and local dev servers.
