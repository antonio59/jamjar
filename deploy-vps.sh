#!/bin/bash
set -e

# JamJar v2.2.0 - Hostinger VPS Deployment Script
# Usage: sudo bash deploy-vps.sh

echo "🫙 JamJar v2.2.0 - VPS Deployment"
echo "========================================="

# Configuration
APP_DIR="/opt/jamjar"
APP_USER="jamjar"
DOMAIN="jamjar.antoniosmith.xyz"
PORT=3001

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Creating system user...${NC}"
if ! id "$APP_USER" &>/dev/null; then
    useradd -r -s /bin/false "$APP_USER"
    echo "✅ User created"
else
    echo "✅ User already exists"
fi

echo -e "${YELLOW}Step 2: Installing Node.js 24...${NC}"
apt-get update -qq
apt-get install -y -qq ca-certificates curl gnupg > /dev/null 2>&1
mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_24.x nodistro main" > /etc/apt/sources.list.d/nodesource.list
apt-get update -qq
apt-get install -y -qq nodejs nginx certbot python3-certbot-nginx yt-dlp > /dev/null 2>&1

# Enable pnpm via corepack
corepack enable pnpm
echo "✅ Node.js $(node -v) installed, pnpm enabled"

echo -e "${YELLOW}Step 3: Setting up application directory...${NC}"
mkdir -p "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
cd "$APP_DIR"

# Clone or update repo
if [ -d ".git" ]; then
    echo "Updating existing installation..."
    git pull origin main
else
    echo "Cloning repository..."
    git clone https://github.com/antonio59/jamjar.git .
fi

echo -e "${YELLOW}Step 4: Installing Node.js dependencies...${NC}"
pnpm install
echo "✅ Dependencies installed"

echo -e "${YELLOW}Step 5: Creating environment file...${NC}"
if [ ! -f ".env" ]; then
    cat > .env << EOF
PORT=$PORT
JWT_SECRET=$(openssl rand -hex 32)
NODE_ENV=production
DB_PATH=$APP_DIR/data/jamjar.db
DOWNLOAD_DIR=$APP_DIR/downloads
YOUTUBE_API_KEY=
SENTRY_DSN=
VITE_SENTRY_DSN=
EOF
    echo "✅ .env created with secure JWT_SECRET"
    echo "⚠️  Edit .env to add YouTube API key, SENTRY_DSN and VITE_SENTRY_DSN"
else
    echo "✅ .env already exists"
    # Ensure new Sentry vars exist in old .env files
    grep -q "^SENTRY_DSN=" .env || echo "SENTRY_DSN=" >> .env
    grep -q "^VITE_SENTRY_DSN=" .env || echo "VITE_SENTRY_DSN=" >> .env
fi

echo -e "${YELLOW}Step 6: Building frontend...${NC}"
pnpm run build
echo "✅ Frontend built"

echo -e "${YELLOW}Step 7: Seeding database...${NC}"
node seed.js
echo "✅ Database seeded"

echo -e "${YELLOW}Step 8: Creating systemd service...${NC}"
cat > /etc/systemd/system/jamjar.service << EOF
[Unit]
Description=JamJar Family Music App
After=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
ExecStart=$(which node) server/index.js
Restart=always
RestartSec=10
EnvironmentFile=$APP_DIR/.env

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable jamjar
systemctl restart jamjar
echo "✅ Service started"

echo -e "${YELLOW}Step 9: Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/jamjar << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/jamjar /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
echo "✅ Nginx configured"

echo -e "${YELLOW}Step 10: Setting up SSL with Let's Encrypt...${NC}"
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@antoniosmith.xyz
echo "✅ SSL configured"

echo -e "${YELLOW}Step 11: Setting up log rotation...${NC}"
cat > /etc/logrotate.d/jamjar << EOF
$APP_DIR/*.log {
    weekly
    rotate 4
    compress
    delaycompress
    missingok
    notifempty
    create 0644 $APP_USER $APP_USER
}
EOF
echo "✅ Log rotation configured"

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "App URL: https://$DOMAIN"
echo "Service status: systemctl status jamjar"
echo "Logs: journalctl -u jamjar -f"
echo ""
echo "Default accounts are seeded automatically."
echo "Change PINs in seed.js and re-run 'node seed.js' for production."
echo ""
echo "⚠️  IMPORTANT: Change default PINs in seed.js and re-run 'node seed.js' if needed"
echo ""
