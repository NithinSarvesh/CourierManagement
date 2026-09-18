#!/bin/bash
# ==============================================================================
# wait-for-oracle.sh - Oracle & FREEPDB1 Readiness Gate for Systemd
# ==============================================================================
# Ensures Oracle container is running, port 1521 is open, and FREEPDB1 is
# OPEN READ WRITE before Spring Boot attempts to connect on boot.
# ==============================================================================

set -e

CONTAINER_NAME="courier-oracle"
PDB_NAME="FREEPDB1"
MAX_ATTEMPTS=60
SLEEP_INTERVAL=2

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting Oracle readiness verification..."

# 1. Ensure Docker daemon is running
if ! systemctl is-active --quiet docker; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Docker daemon not running. Starting docker.service..."
    sudo systemctl start docker
    sleep 3
fi

# 2. Ensure courier-oracle container exists and is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Container ${CONTAINER_NAME} is stopped. Starting it..."
        docker start "${CONTAINER_NAME}"
    else
        echo "[ERROR] Container ${CONTAINER_NAME} does not exist!"
        exit 1
    fi
fi

# 3. Wait for listener port 1521 to accept TCP connections
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Waiting for Oracle listener on port 1521..."
attempt=0
while [ $attempt -lt $MAX_ATTEMPTS ]; do
    if (echo > /dev/tcp/127.0.0.1/1521) 2>/dev/null; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] [OK] Port 1521 is OPEN."
        break
    fi
    attempt=$((attempt + 1))
    sleep $SLEEP_INTERVAL
done

if [ $attempt -ge $MAX_ATTEMPTS ]; then
    echo "[ERROR] Timeout waiting for Oracle port 1521 to open!"
    exit 1
fi

# 4. Wait for FREEPDB1 to be in READ WRITE mode
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Checking ${PDB_NAME} open_mode..."
attempt=0
while [ $attempt -lt $MAX_ATTEMPTS ]; do
    pdb_status=$(docker exec "${CONTAINER_NAME}" sqlplus -s / as sysdba << 'EOF' 2>/dev/null || true
SET HEADING OFF FEEDBACK OFF
SELECT open_mode FROM v$pdbs WHERE name = 'FREEPDB1';
EXIT;
EOF
)
    pdb_status=$(echo "${pdb_status}" | tr -d '[:space:]')

    if [ "${pdb_status}" = "READWRITE" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] [OK] ${PDB_NAME} is OPEN READ WRITE."
        break
    elif [ "${pdb_status}" = "MOUNTED" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ${PDB_NAME} is MOUNTED. Opening READ WRITE (one-time fallback)..."
        docker exec "${CONTAINER_NAME}" sqlplus -s / as sysdba << 'EOF' 2>/dev/null || true
ALTER PLUGGABLE DATABASE FREEPDB1 OPEN;
EXIT;
EOF
        sleep 2
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Waiting for ${PDB_NAME}... (status: '${pdb_status}')"
    fi

    attempt=$((attempt + 1))
    sleep $SLEEP_INTERVAL
done

if [ $attempt -ge $MAX_ATTEMPTS ]; then
    echo "[ERROR] Timeout waiting for ${PDB_NAME} to become READ WRITE!"
    exit 1
fi

# 5. Non-privileged query execution check inside FREEPDB1
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Testing SQL execution in ${PDB_NAME}..."
ENV_FILE="/etc/courier-backend.env"
test_query=""

if [ -f "${ENV_FILE}" ]; then
    DB_USER=$(grep -E '^SPRING_DATASOURCE_USERNAME=' "${ENV_FILE}" | cut -d '=' -f2- | tr -d ' "' || echo "COURIER_APP")
    DB_PASS=$(grep -E '^SPRING_DATASOURCE_PASSWORD=' "${ENV_FILE}" | cut -d '=' -f2- | tr -d ' "' || true)
fi

if [ -n "${DB_USER}" ] && [ -n "${DB_PASS}" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Testing connection with application user '${DB_USER}'..."
    test_query=$(docker exec -i "${CONTAINER_NAME}" sqlplus -s /nolog << EOF 2>/dev/null || true
CONNECT ${DB_USER}/${DB_PASS}@//localhost:1521/FREEPDB1
SET HEADING OFF FEEDBACK OFF
SELECT 1 FROM dual;
EXIT;
EOF
)
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Testing connection via local container session..."
    test_query=$(docker exec "${CONTAINER_NAME}" sqlplus -s / as sysdba << 'EOF' 2>/dev/null || true
SET HEADING OFF FEEDBACK OFF
ALTER SESSION SET CONTAINER = FREEPDB1;
SELECT 1 FROM dual;
EXIT;
EOF
)
fi

test_query=$(echo "${test_query}" | tr -d '[:space:]')

if [ "${test_query}" = "1" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [SUCCESS] Oracle and ${PDB_NAME} are 100% READY! Proceeding to launch Spring Boot."
    exit 0
else
    echo "[ERROR] SQL verification failed! Result: '${test_query}'"
    exit 1
fi