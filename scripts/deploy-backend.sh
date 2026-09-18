#!/bin/bash
# ==============================================================================
# deploy-backend.sh - Build & Deploy Spring Boot Backend on EC2
# ==============================================================================

set -e

APP_DIR="/home/ec2-user/CourierManagement/courier-backend"
SERVICE_NAME="courier-backend"

echo "=================================================="
echo "         DEPLOYING SPRING BOOT BACKEND            "
echo "=================================================="

cd "${APP_DIR}"

echo "[1/4] Pulling latest code..."
git pull origin online-demo || git pull origin main || echo "Local git pull skipped or up to date."

echo "[2/4] Building production JAR..."
chmod +x ./mvnw
./mvnw clean package -DskipTests

if [ ! -f "target/courier-backend-0.0.1-SNAPSHOT.jar" ]; then
    echo "[ERROR] Built JAR not found in target/!"
    exit 1
fi
echo "[OK] Built JAR: $(ls -lh target/courier-backend-0.0.1-SNAPSHOT.jar | awk '{print $5, $9}')"

echo "[3/4] Restarting ${SERVICE_NAME} service..."
sudo systemctl restart "${SERVICE_NAME}"

echo "[4/4] Verifying service status..."
sleep 5
sudo systemctl status "${SERVICE_NAME}" --no-pager

echo ""
echo "[OK] Backend deployment completed successfully!"