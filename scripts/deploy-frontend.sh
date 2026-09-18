#!/bin/bash
# ==============================================================================
# deploy-frontend.sh - Build & Deploy React Frontend on EC2
# ==============================================================================

set -e

FRONTEND_DIR="/home/ec2-user/CourierManagement/courier_frontend_ui"
WEB_ROOT="/var/www/courier-management"

echo "=================================================="
echo "          DEPLOYING REACT FRONTEND                "
echo "=================================================="

cd "${FRONTEND_DIR}"

echo "[1/4] Checking dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
fi

echo "[2/4] Building production frontend with Vite..."
npm run build

if [ ! -d "dist" ]; then
    echo "[ERROR] Frontend build dist/ directory not found!"
    exit 1
fi

echo "[3/4] Publishing dist/ to ${WEB_ROOT}..."
sudo mkdir -p "${WEB_ROOT}"
sudo cp -r dist/* "${WEB_ROOT}/"
sudo chmod -R 755 "${WEB_ROOT}"

echo "[4/4] Reloading web server..."
if systemctl is-active --quiet caddy; then
    sudo systemctl reload caddy
    echo "[OK] Caddy reloaded successfully."
elif systemctl is-active --quiet nginx; then
    sudo systemctl reload nginx
    echo "[OK] Nginx reloaded successfully."
else
    echo "[WARN] No web server running to reload."
fi

echo ""
echo "[OK] Frontend deployment completed successfully!"