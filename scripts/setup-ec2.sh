#!/bin/bash
# ==============================================================================
# setup-ec2.sh - One-Time Automated EC2 Host Setup for Amazon Linux 2023
# ==============================================================================

set -e

PROJECT_DIR="/home/ec2-user/CourierManagement"
WEB_ROOT="/var/www/courier-management"

echo "=================================================="
echo "      COURIER MANAGEMENT EC2 AUTOMATED SETUP      "
echo "=================================================="

# 1. System Packages (Java 21 JDK, Git)
echo "[1/8] Installing Java 21 JDK and Git..."
sudo dnf install -y java-21-amazon-corretto-devel git

# 2. Swap configuration (4 GiB for t4g.small)
echo "[2/8] Checking swap space..."
if [ $(swapon --show | wc -l) -le 1 ]; then
    echo "Creating 4 GiB swap file..."
    sudo dd if=/dev/zero of=/swapfile bs=128M count=32
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    if ! grep -q '/swapfile' /etc/fstab; then
        echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
    fi
    echo "[OK] Swap created and enabled."
else
    echo "[OK] Swap already active."
fi

# 3. Docker Service Enablement
echo "[3/8] Enabling Docker on boot..."
sudo systemctl enable docker
sudo systemctl start docker

# 4. Oracle PDB Auto-Open Configuration
echo "[4/8] Configuring Oracle FREEPDB1 to persist READ WRITE state..."
if docker ps --format '{{.Names}}' | grep -q "^courier-oracle$"; then
    docker exec courier-oracle sqlplus -s / as sysdba << 'EOF' || true
ALTER PLUGGABLE DATABASE FREEPDB1 OPEN READ WRITE;
ALTER PLUGGABLE DATABASE FREEPDB1 SAVE STATE;
EXIT;
EOF
    echo "[OK] FREEPDB1 state saved in Oracle."
else
    echo "[WARN] courier-oracle container not running. Start container to save state."
fi

# 5. Make all scripts executable
echo "[5/8] Setting executable permissions on scripts..."
chmod +x "${PROJECT_DIR}/scripts/"*.sh
chmod +x "${PROJECT_DIR}/courier-backend/mvnw"

# 6. Environment configuration file
echo "[6/8] Configuring /etc/courier-backend.env..."
if [ ! -f "/etc/courier-backend.env" ]; then
    sudo cp "${PROJECT_DIR}/systemd/courier-backend.env.example" /etc/courier-backend.env
    sudo chmod 600 /etc/courier-backend.env
    echo "[NOTE] Created /etc/courier-backend.env from template. Update with production secrets if needed."
else
    sudo chmod 600 /etc/courier-backend.env
    echo "[OK] /etc/courier-backend.env already exists."
fi

# 7. Systemd Service Registration
echo "[7/8] Registering courier-backend.service..."
sudo cp "${PROJECT_DIR}/systemd/courier-backend.service" /etc/systemd/system/courier-backend.service
sudo systemctl daemon-reload
sudo systemctl enable courier-backend.service
echo "[OK] courier-backend.service registered and enabled on boot."

# 8. Web Server & Directories
echo "[8/8] Preparing Web Root and Caddy..."
sudo mkdir -p "${WEB_ROOT}"
sudo mkdir -p /etc/caddy
if [ -f "${PROJECT_DIR}/caddy/Caddyfile" ]; then
    sudo cp "${PROJECT_DIR}/caddy/Caddyfile" /etc/caddy/Caddyfile
fi

echo ""
echo "=================================================="
echo "    ONE-TIME SETUP COMPLETE!                      "
echo "=================================================="
echo "You can now run:"
echo "  ./scripts/deploy-backend.sh    # Build & start backend"
echo "  ./scripts/deploy-frontend.sh   # Build & publish frontend"
echo "  ./scripts/verify-deployment.sh # Verify complete stack"