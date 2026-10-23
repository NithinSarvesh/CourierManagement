# SwiftShip DBMS-DA3 Deployment Guide: Render & Neo4j AuraDB

This guide provides end-to-end instructions for deploying the **SwiftShip Courier Management System (DBMS-DA3)** to the public internet using **Render** (Static Site + Docker Web Service) and **Neo4j AuraDB** (Cloud Graph Database).

> [!NOTE]
> All changes and deployment configurations are strictly confined to `DBMS-DA3/`. The existing DA2 project (Oracle database, EC2 scripts, and systemd services) remains completely untouched and preserved.

---

## Architecture Overview

```mermaid
flowchart LR
    Browser["Client Browser"]
    Frontend["Render Static Site<br/><code>DBMS-DA3/frontend</code><br/>Vanilla JS / HTML / CSS"]
    Backend["Render Web Service<br/><code>DBMS-DA3/backend</code><br/>Docker (Java 21 / Spring Boot 3.3.5)"]
    AuraDB["Neo4j AuraDB (Cloud)<br/><code>neo4j+s://...databases.neo4j.io</code>"]

    Browser -->|HTTPS| Frontend
    Frontend -->|REST API with CORS| Backend
    Backend -->|Bolt+TLS (neo4j+s)| AuraDB
```

- **Frontend**: Render Static Site serving vanilla HTML/CSS/JavaScript from `DBMS-DA3/frontend/`.
- **Backend**: Render Web Service running a multi-stage Docker container with Spring Boot 3.3.5 and Eclipse Temurin Java 21 from `DBMS-DA3/backend/`.
- **Database**: Managed Neo4j AuraDB Free instance accessible securely via `neo4j+s://`.

---

## Step 1: Provision Neo4j AuraDB Instance

1. Go to [Neo4j Aura Console](https://console.neo4j.io/) and sign up or log in.
2. Click **New Instance** and choose **AuraDB Free**.
3. Give your instance a name (e.g., `SwiftShip-Courier`).
4. **Download and save the generated credentials text file** containing:
   - **Connection URI**: `neo4j+s://<db-id>.databases.neo4j.io`
   - **Username**: `neo4j`
   - **Password**: `<your-secure-password>`
5. Once the instance state is **Running**, click **Query** (or open Neo4j Browser) and run the schema constraints script located in:
   ```cypher
   // Copy and execute the contents of:
   // DBMS-DA3/backend/schema/neo4j_schema.cypher
   ```
   This creates all uniqueness constraints and performance indexes using safe `IF NOT EXISTS` syntax.

---

## Step 2: Deploy Backend to Render (Docker Web Service)

1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** and select **Web Service**.
3. Select **Build and deploy from a Git repository** and connect:
   - **Repository**: `NithinSarvesh/CourierManagement`
   - **Branch**: `online-demo` (or `main`)
4. Configure the service parameters:
   | Setting | Value |
   |---|---|
   | **Name** | `swiftship-courier-backend` (or your choice) |
   | **Region** | Singapore / Frankfurt / Oregon (nearest to you) |
   | **Root Directory** | `DBMS-DA3/backend` |
   | **Runtime** | **Docker** |
   | **DockerfilePath** | `Dockerfile` |
   | **Instance Type** | Free |

5. Under **Advanced Settings**, configure:
   - **Health Check Path**: `/actuator/health`

6. In the **Environment Variables** section, add the following variables:
   | Variable | Value | Description |
   |---|---|---|
   | `NEO4J_URI` | `neo4j+s://<db-id>.databases.neo4j.io` | Your AuraDB connection URI |
   | `NEO4J_USERNAME` | `neo4j` | Database username |
   | `NEO4J_PASSWORD` | `<your-auradb-password>` | Database password |
   | `NEO4J_DATABASE` | `neo4j` | Default database name |
   | `CORS_ALLOWED_ORIGINS` | `https://swiftship-courier-frontend.onrender.com` | Your frontend Render URL (without trailing slash) |

   > [!IMPORTANT]
   > Do **NOT** set `PORT` in Render environment variables. Render automatically injects `PORT=10000` into the container, and Spring Boot is pre-configured with `server.port=${PORT:${SERVER_PORT:8082}}` to bind dynamically.

7. Click **Create Web Service**.
8. Wait for the build and deployment to complete. Check the logs:
   - You should see: `Neo4j database connectivity verified successfully (ping=1).`
   - Note down the generated backend URL: `https://<backend-subdomain>.onrender.com`.

---

## Step 3: Deploy Frontend to Render (Static Site)

1. In Render Dashboard, click **New +** and select **Static Site**.
2. Connect the same repository: `NithinSarvesh/CourierManagement`.
3. Configure the static site parameters:
   | Setting | Value |
   |---|---|
   | **Name** | `swiftship-courier-frontend` |
   | **Branch** | `online-demo` (or `main`) |
   | **Root Directory** | `DBMS-DA3/frontend` |
   | **Build Command** | *(Leave empty)* |
   | **Publish Directory** | `.` |

4. Click **Create Static Site**.
5. Once deployed, note your frontend URL: `https://<frontend-subdomain>.onrender.com`.

---

## Step 4: Connect Frontend to Backend

You have two simple ways to point the frontend to your live backend:

### Option A: Edit `config.js` (Recommended for production)
In `DBMS-DA3/frontend/config.js`, set your deployed backend URL:
```javascript
window.SWIFTSHIP_CONFIG = {
  apiBase: 'https://swiftship-courier-backend.onrender.com'
};
```
Commit and push this change to GitHub. Render will automatically redeploy the static site.

### Option B: Runtime UI Configuration
You can also configure the backend URL directly in the live browser:
1. Open your deployed frontend static site in the browser.
2. In the top-left sidebar, click the workspace status indicator:
   `[Checking backend... ⚙]`
3. In the prompt, enter your backend URL:
   `https://swiftship-courier-backend.onrender.com`
4. The page will reload and persist this setting in `localStorage`.

---

## Step 5: Update CORS in Backend

Once your frontend is deployed and its URL is known:
1. Go to your Backend Web Service in Render -> **Environment**.
2. Set `CORS_ALLOWED_ORIGINS` to your exact frontend origin:
   ```
   https://swiftship-courier-frontend.onrender.com
   ```
3. Click **Save Changes**. Render will automatically restart the backend service.

---

## Verification & Health Check

1. **Verify Backend Health**:
   Open in your browser:
   `https://<backend-url>/actuator/health`
   Expected response:
   ```json
   {
     "status": "UP",
     "components": {
       "diskSpace": { "status": "UP" },
       "neo4j": { "status": "UP", "details": { "edition": "aura", ... } },
       "ping": { "status": "UP" }
     }
   }
   ```

2. **Verify Frontend Live Connection**:
   Open the frontend URL. The sidebar status badge will change from amber/red to green:
   `● Connected`

3. **Verify End-to-End Functionality**:
   - Navigate to **Overview** (Dashboard loads statistics, live deliveries, agent leaderboard).
   - Navigate to **Parcels** and create a test parcel.
   - Navigate to **Tracking** and track the parcel number.
   - Navigate to **Customers** and create or inspect customer records.

---

## Troubleshooting Guide

| Issue | Cause | Resolution |
|---|---|---|
| **CORS error in browser console** | Frontend origin does not match `CORS_ALLOWED_ORIGINS` | Check the browser console. Copy the exact Origin (e.g. `https://my-app.onrender.com` without trailing slash) and set it in the backend's `CORS_ALLOWED_ORIGINS` env var on Render. |
| **Backend crashes on startup with `CRITICAL: Failed to connect to Neo4j`** | Invalid Neo4j URI, username, or password | Verify that `NEO4J_URI` uses `neo4j+s://`, not plain `bolt://`, and that the instance password is correct. Check AuraDB Console to ensure the instance is "Running". |
| **First request takes 30-50 seconds** | Render Free Tier spin-down | Render free tier web services spin down after 15 minutes of inactivity. The first incoming request triggers a wake-up. Subsequent requests are fast. |
| **Status badge shows "Offline"** | Backend is waking up or `apiBase` is incorrect | Click `[Offline ⚙]` in the sidebar to verify or update the backend URL. Check that `https://<backend-url>/actuator/health` returns `UP`. |

---

## Clean Separation Confirmation

- **DA2 AWS Configuration**: Preserved untouched in `courier-backend/`, `courier_frontend_ui/`, `scripts/`, `systemd/`, root files.
- **DA3 Render Configuration**: Self-contained in `DBMS-DA3/`.
