#!/bin/bash
# ==============================================================================
# check-oracle.sh - Oracle Database Diagnostic & Health Inspection Script
# ==============================================================================

set -e

CONTAINER="courier-oracle"

echo "=================================================="
echo "          ORACLE 26ai DIAGNOSTIC REPORT           "
echo "=================================================="
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo ""

echo "--- 1. CONTAINER STATUS ---"
if docker ps --filter "name=${CONTAINER}" --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep -q "${CONTAINER}"; then
    docker ps --filter "name=${CONTAINER}" --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
    echo "[OK] Container ${CONTAINER} is running."
else
    echo "[FAIL] Container ${CONTAINER} is NOT running!"
    exit 1
fi
echo ""

echo "--- 2. LISTENER STATUS ---"
docker exec "${CONTAINER}" lsnrctl status | grep -E "STATUS of the LISTENER|Services Summary|freepdb1" || true
echo ""

echo "--- 3. PDB OPEN MODE ---"
docker exec "${CONTAINER}" sqlplus -s / as sysdba << 'EOF'
SET LINESIZE 120 PAGESIZE 50
COL NAME FORMAT A20
COL OPEN_MODE FORMAT A15
SELECT name, open_mode, restricted FROM v$pdbs;
EXIT;
EOF
echo ""

echo "--- 4. COURIER_APP SCHEMA OBJECTS & ROW COUNTS ---"
docker exec "${CONTAINER}" sqlplus -s / as sysdba << 'EOF'
SET LINESIZE 120 PAGESIZE 50
ALTER SESSION SET CONTAINER = FREEPDB1;
COL TABLE_NAME FORMAT A25
COL NUM_ROWS FORMAT 999999
SELECT table_name, num_rows FROM all_tables WHERE owner = 'COURIER_APP' ORDER BY table_name;
EXIT;
EOF
echo ""
echo "[OK] Oracle diagnostics check completed successfully."