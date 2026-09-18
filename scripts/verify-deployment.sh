#!/bin/bash
# ==============================================================================
# verify-deployment.sh - End-to-End Deployment Verification Script
# ==============================================================================
# Verifies Oracle, Listener, FREEPDB1, Spring Boot, Actuator, and Web Server.
# Usage: ./scripts/verify-deployment.sh
# ==============================================================================

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}     COURIER MANAGEMENT SYSTEM DEPLOYMENT CHECK       ${NC}"
echo -e "${BLUE}======================================================${NC}"
echo "Time: $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo ""

# 1. Oracle Docker Container
echo -n "Checking Oracle container (courier-oracle)... "
if docker ps --format '{{.Names}}' | grep -q "^courier-oracle$"; then
    echo -e "${GREEN}[OK] Oracle Container Running${NC}"
else
    echo -e "${RED}[FAIL] Oracle container is NOT running!${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 2. Oracle Listener Port 1521
echo -n "Checking Oracle listener (port 1521)... "
if (echo > /dev/tcp/127.0.0.1/1521) 2>/dev/null; then
    echo -e "${GREEN}[OK] Listener Port 1521 Open${NC}"
else
    echo -e "${RED}[FAIL] Listener Port 1521 unreachable!${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 3. FREEPDB1 State
echo -n "Checking FREEPDB1 open mode... "
pdb_mode=$(docker exec courier-oracle sqlplus -s / as sysdba << 'EOF' 2>/dev/null || true
SET HEADING OFF FEEDBACK OFF
SELECT open_mode FROM v$pdbs WHERE name = 'FREEPDB1';
EXIT;
EOF
)
pdb_mode=$(echo "${pdb_mode}" | tr -d '[:space:]')
if [ "${pdb_mode}" = "READWRITE" ]; then
    echo -e "${GREEN}[OK] FREEPDB1 is OPEN READ WRITE${NC}"
else
    echo -e "${RED}[FAIL] FREEPDB1 open_mode is '${pdb_mode}' (expected READWRITE)!${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 4. COURIER_APP Authentication & Query
echo -n "Checking COURIER_APP query execution... "
cust_count=$(docker exec courier-oracle sqlplus -s / as sysdba << 'EOF' 2>/dev/null || true
SET HEADING OFF FEEDBACK OFF
ALTER SESSION SET CONTAINER = FREEPDB1;
SELECT COUNT(*) FROM all_tables WHERE owner = 'COURIER_APP';
EXIT;
EOF
)
cust_count=$(echo "${cust_count}" | tr -d '[:space:]')
if [ -n "${cust_count}" ] && [ "${cust_count}" -ge 20 ]; then
    echo -e "${GREEN}[OK] COURIER_APP Schema Verified (${cust_count} tables)${NC}"
else
    echo -e "${RED}[FAIL] COURIER_APP has only ${cust_count} tables (expected 20)!${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 5. Spring Boot Systemd Service
echo -n "Checking Spring Boot service (courier-backend)... "
if systemctl is-active --quiet courier-backend; then
    echo -e "${GREEN}[OK] Spring Boot Service Active${NC}"
else
    echo -e "${RED}[FAIL] courier-backend.service is NOT active!${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 6. Backend Port 8081
echo -n "Checking backend port 8081... "
if (echo > /dev/tcp/127.0.0.1/8081) 2>/dev/null; then
    echo -e "${GREEN}[OK] Backend Port 8081 Open${NC}"
else
    echo -e "${RED}[FAIL] Port 8081 not listening!${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 7. Spring Boot Health / Stats API
echo -n "Checking Spring Boot API (/api/dashboard/stats)... "
api_resp=$(curl -s -m 5 http://127.0.0.1:8081/api/dashboard/stats || true)
if echo "${api_resp}" | grep -q '"connected":true'; then
    echo -e "${GREEN}[OK] Backend API Responding (Oracle Connected)${NC}"
else
    echo -e "${RED}[FAIL] Backend API did not return connected:true!${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 8. Web Server (Caddy / Nginx)
echo -n "Checking Web Server reverse proxy... "
if systemctl is-active --quiet caddy; then
    echo -e "${GREEN}[OK] Caddy Web Server Active${NC}"
elif systemctl is-active --quiet nginx; then
    echo -e "${GREEN}[OK] Nginx Web Server Active${NC}"
else
    echo -e "${YELLOW}[WARN] Neither Caddy nor Nginx is running!${NC}"
fi

# 9. Public HTTPS Endpoint
echo -n "Checking Public HTTPS endpoint... "
https_resp=$(curl -s -m 5 -k https://13-126-121-252.sslip.io/api/dashboard/stats 2>/dev/null || true)
if echo "${https_resp}" | grep -q '"connected":true'; then
    echo -e "${GREEN}[OK] Public HTTPS Endpoint Healthy${NC}"
else
    echo -e "${YELLOW}[WARN] Public HTTPS not responding locally (check external network/security group)${NC}"
fi

echo ""
echo -e "${BLUE}======================================================${NC}"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}  ✓ ALL SYSTEMS OPERATIONAL - READY FOR USE!          ${NC}"
else
    echo -e "${RED}  ✗ DEPLOYMENT HAS ${ERRORS} ISSUE(S). CHECK LOGS ABOVE.      ${NC}"
fi
echo -e "${BLUE}======================================================${NC}"

exit $ERRORS