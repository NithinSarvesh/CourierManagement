# SwiftShip DBMS-DA3 Deployment Guide: Netlify + Koyeb + Neo4j AuraDB

This guide provides end-to-end instructions for deploying the **SwiftShip Courier Management System (DBMS-DA3)** using **Netlify** (Static Frontend), **Koyeb** (Docker MicroVM Backend), and **Neo4j AuraDB** (Cloud Graph Database).

> [!NOTE]
> All deployment files and configurations are strictly confined to `DBMS-DA3/`. The existing DA2 project (Oracle database, EC2 scripts, and systemd services) remains 100% intact and preserved.

---

## 1. Architecture Overview

```mermaid
flowchart LR
    Browser["Client Browser"]
    Frontend["Netlify Static Site<br/><code>DBMS-DA3/frontend</code><br/>Vanilla JS / HTML / CSS"]
    Backend["Koyeb Web Service<br/><code>DBMS-DA3/backend</code><br/>Docker (Java 21 / Spring Boot 3.3.5)"]
    AuraDB["Neo4j AuraDB (Cloud)<br/><code>neo4j+s://...databases.neo4j.io</code>"]

    Browser -->|HTTPS| Frontend
    Frontend -->|REST API with Strict CORS| Backend
    Backend -->|Bolt+TLS (neo4j+s)| AuraDB
```

- **Frontend**: Hosted on **Netlify** (Free tier, global CDN) from `DBMS-DA3/frontend/`.
- **Backend**: Hosted on **Koyeb** (Free tier MicroVM, Docker build) from `DBMS-DA3/backend/`.
- **Database**: Cloud-hosted **Neo4j AuraDB Free** instance via secure `neo4j+s://`.

---

## 2. Step 1: Provision or Reuse Neo4j AuraDB

1. Log in to the [Neo4j Aura Console](https://console.neo4j.io/).
2. If you already have an active instance, you can reuse it. If creating a new one:
   - Click **New Instance** → Choose **AuraDB Free**.
   - Name: `SwiftShip-Courier` (or any preferred name).
   - **Download the credentials text file** containing:
     - **URI**: `neo4j+s://<dbid>.databases.neo4j.io`
     - **Username**: `neo4j`
     - **Password**: `<your-auradb-password>`
3. Once the instance state shows **Running**, click **Query** (or open Neo4j Browser) and execute the schema initialization script from:
   ```cypher
   // Copy and run the entire contents of:
   // DBMS-DA3/backend/schema/neo4j_schema.cypher
   ```
   This creates all uniqueness constraints and performance indexes using safe `IF NOT EXISTS` syntax without dropping existing data.

---

## 3. Step 2: Deploy Backend to Koyeb (Docker Web Service)

1. Sign up or log in to [Koyeb Dashboard](https://app.koyeb.com/).
2. Click **Create Service** and select **GitHub**.
3. Choose your repository: `NithinSarvesh/CourierManagement`.
4. Configure the service parameters:
   | Setting | Value | Explanation |
   |---|---|---|
   | **Branch** | `main` | Production branch |
   | **Builder** | **Dockerfile** | Uses multi-stage container build |
   | **Work directory** | `DBMS-DA3/backend` | Points directly to backend folder in monorepo |
   | **Dockerfile location** | `Dockerfile` | Relative to Work directory (`DBMS-DA3/backend/Dockerfile`) |
   | **Service Name** | `swiftship-backend` | Subdomain identifier |
   | **Instance Type** | **Free / Eco (Nano / 512 MB RAM)** | Default free microVM |

5. **Exposed Port Configuration**:
   - In the **Ports** section:
     - **Port**: `8080`
     - **Protocol**: `HTTP`
     - **Path**: `/`
   > [!TIP]
   > Koyeb exposes port `8080` to public HTTPS traffic (`https://<service-name>-<org>.koyeb.app`) and injects `PORT=8080` into the container. Spring Boot reads `${PORT:${SERVER_PORT:8082}}` and binds automatically to port 8080. Outside Docker (in local dev), it still runs on port 8082.

6. **Health Check Configuration**:
   - Type: `HTTP`
   - Path: `/actuator/health`
   - Port: `8080`
   - Grace period / Initial delay: `60s` (allows JVM container to initialize and verify database)
   - Interval: `30s`
   - Timeout: `5s`

7. **Environment Variables**:
   Add the following variables under **Environment variables**:
   | Variable | Value | Description |
   |---|---|---|
   | `NEO4J_URI` | `neo4j+s://<dbid>.databases.neo4j.io` | Your AuraDB connection URI |
   | `NEO4J_USERNAME` | `neo4j` | Database username |
   | `NEO4J_PASSWORD` | `<your-auradb-password>` | Database password |
   | `NEO4J_DATABASE` | `neo4j` | Database name |
   | `CORS_ALLOWED_ORIGINS` | `https://localhost` *(temporary until Netlify is created)* | Will be updated with your exact Netlify URL in Step 5 |

8. Click **Deploy**.
9. Wait for build and deployment to complete. Check the deployment logs:
   - Look for: `Neo4j database connectivity verified successfully (ping=1).`
   - Note your public Koyeb backend URL:
     `https://<service-name>-<org>.koyeb.app`

---

## 4. Step 3: Deploy Frontend to Netlify (Static Site)

1. Sign up or log in to [Netlify](https://app.netlify.com/).
2. Click **Add new site** → **Import an existing project**.
3. Choose **GitHub** and authorize access to `NithinSarvesh/CourierManagement`.
4. Configure the build & deploy settings:
   | Setting | Value |
   |---|---|
   | **Branch to deploy** | `main` |
   | **Base directory** | `DBMS-DA3/frontend` |
   | **Build command** | *(Leave empty - vanilla HTML/CSS/JS requires no build step)* |
   | **Publish directory** | `.` |

5. Click **Deploy site**.
6. Netlify will deploy immediately (under 10 seconds).
7. Note down your production Netlify URL:
   `https://<your-site-name>.netlify.app`
   *(You can rename your site subdomain under Site configuration → Change site name).*

---

## 5. Step 4: Configure Frontend API Base URL

To connect your Netlify frontend to your Koyeb backend:

### Option A: Via `config.js` (Recommended for Permanent Setup)
1. Open [`DBMS-DA3/frontend/config.js`](file:///d:/projects/CourierManagement/DBMS-DA3/frontend/config.js) in your local repository.
2. Set `apiBase` to your actual Koyeb public HTTPS URL:
   ```javascript
   window.SWIFTSHIP_CONFIG = {
     apiBase: 'https://swiftship-backend-<your-org>.koyeb.app'
   };
   ```
3. Commit and push to GitHub:
   ```bash
   git add DBMS-DA3/frontend/config.js
   git commit -m "fix(da3): point frontend config to production Koyeb backend"
   git push origin main
   ```
4. Netlify will auto-deploy the change in seconds.

### Option B: Instant In-Browser Setup (For Immediate Testing)
1. Open your published Netlify site (`https://<your-site>.netlify.app`).
2. You will see a banner: `⚠️ Action Required: Koyeb Backend URL Not Configured`.
3. Click **Configure URL** (or click the ⚙ icon in the top-left sidebar).
4. Enter your Koyeb URL: `https://swiftship-backend-<your-org>.koyeb.app`.
5. The page reloads, stores the URL in `localStorage`, and connects live.

---

## 6. Step 5: Update CORS in Koyeb Dashboard

Once you have your Netlify URL:
1. Go to your Koyeb Service → **Settings** → **Environment variables**.
2. Update `CORS_ALLOWED_ORIGINS` to your exact Netlify origin (no trailing slash):
   ```
   https://<your-site-name>.netlify.app
   ```
3. Click **Save and deploy**. Koyeb will perform a zero-downtime rolling restart.

---

## 7. Step 6: End-to-End Verification

1. **Verify Backend Actuator Health**:
   Open in your browser:
   `https://<your-koyeb-app>.koyeb.app/actuator/health`
   Expected response:
   ```json
   {
     "status": "UP",
     "components": {
       "diskSpace": { "status": "UP" },
       "neo4j": { "status": "UP", "details": { "edition": "aura" } },
       "ping": { "status": "UP" }
     }
   }
   ```

2. **Verify Frontend Live Connection**:
   Open your Netlify site. The sidebar status badge will change from yellow to green:
   `● Connected`

3. **Verify Business Workflows**:
   - **Dashboard**: Stats tiles, delivery distribution, agent performance leaderboard render live data.
   - **Customers**: Click **+ Add customer**, fill details, submit, and confirm customer appears in table.
   - **Parcels**: Click **+ New parcel**, select sender/receiver, set weight/destination, create.
   - **Tracking**: Navigate to **Tracking**, enter tracking number (e.g. `TRK...`), click Track, and confirm timeline steps render.

---

## 8. Memory Management & Troubleshooting

### Koyeb 512 MB RAM Optimization
Koyeb's free tier provides 512 MB RAM. Java 21 Spring Boot applications can easily exceed 512 MB if unconstrained, causing the container to be killed (`Exit code 137` / OOMKilled).

The [`DBMS-DA3/backend/Dockerfile`](file:///d:/projects/CourierManagement/DBMS-DA3/backend/Dockerfile) has been tuned specifically for this:
- **Serial GC** (`-XX:+UseSerialGC`): Saves 40–60 MB native memory overhead compared to G1GC.
- **Max Heap 55%** (`-XX:MaxRAMPercentage=55.0`): Caps heap at ~280 MB, reserving ~230 MB for Metaspace, threads, native Bolt buffers, and microVM overhead.
- **Metaspace Limit** (`-XX:MaxMetaspaceSize=128m`): Prevents unbounded class metadata growth.
- **Exit on OOM** (`-XX:+ExitOnOutOfMemoryError`): Ensures Koyeb restarts the container cleanly if memory peaks.

If Koyeb ever runs out of memory under peak traffic:
- In Koyeb Environment Variables, set `JAVA_OPTS`:
  `-XX:+UseContainerSupport -XX:MaxRAMPercentage=50.0 -XX:+UseSerialGC -XX:MaxMetaspaceSize=112m -XX:+ExitOnOutOfMemoryError`

### Common Errors & Solutions

| Error | Root Cause | Solution |
|---|---|---|
| **Mixed Content: The page was loaded over HTTPS but requested an insecure resource** | Frontend is on HTTPS (Netlify) but backend URL was entered as `http://` | Ensure backend URL in `config.js` starts with `https://`. Koyeb routes all traffic through HTTPS automatically. |
| **CORS Policy: No 'Access-Control-Allow-Origin' header** | `CORS_ALLOWED_ORIGINS` in Koyeb does not match Netlify URL | In Koyeb env vars, set `CORS_ALLOWED_ORIGINS=https://<your-site>.netlify.app` exactly (case-sensitive, no trailing slash). |
| **Backend crash with `CRITICAL: Failed to connect to Neo4j`** | Invalid Neo4j URI or password | Verify `NEO4J_URI` uses `neo4j+s://` and check password in Neo4j Aura console. Ensure AuraDB instance is in "Running" state. |
| **Koyeb Health check failing / deployment timeout** | Container takes longer to start than health check grace period | In Koyeb service settings, ensure Health Check **Grace period** is set to `60s` to give Spring Boot enough time to start up and verify AuraDB. |
| **Frontend displays "Setup API (Click ⚙)"** | `config.js` has empty `apiBase` and no override in `localStorage` | Click ⚙ in the sidebar or update `config.js` with your Koyeb URL and commit. |

---

## 9. Preservation Confirmation

- **DA2 AWS Oracle System**: Remains 100% intact in `courier-backend/`, `courier_frontend_ui/`, `scripts/`, `systemd/`, root files.
- **DA3 System**: Independent, fully self-contained in `DBMS-DA3/`.
