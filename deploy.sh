#!/bin/bash
# ==============================================================================
# ICMS - Build Locally & Deploy to Hostinger VPS
# ==============================================================================
# Usage:
#   bash deploy.sh build          Build production bundle locally
#   bash deploy.sh push           Upload build to server via SCP
#   bash deploy.sh deploy         Build + Push (one command)
#
# Run ON SERVER:
#   bash deploy.sh server-setup   First-time server setup (once)
#   bash deploy.sh server-start   Start/restart the app
#   bash deploy.sh seed           Seed database with demo data
#   bash deploy.sh status         Check app status
#   bash deploy.sh logs           View app logs
# ==============================================================================

set -e

# ---- Configuration (EDIT THESE) ----
APP_NAME="icms"
APP_PORT=3001                           # Port for Next.js (avoid conflicts)
DOMAIN="careneuromodulationaiims.in"            # Your domain/subdomain

# SSH connection
VPS_USER="root"                         # or your SSH user
VPS_HOST="72.60.221.162"                  # e.g., 154.41.xx.xx
VPS_DIR="/var/www/icms"                 # Deployment path on server

# Database (on the VPS)
DB_NAME="icms"
DB_USER="postgres"
DB_PASS="postgres"

# ---- Colors ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[ICMS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ==============================================================================
# BUILD - Run locally to create production bundle
# ==============================================================================
build() {
    log "Building production bundle locally..."

    # Install deps
    log "Installing dependencies..."
    npm ci

    # Generate Prisma client (use v6 to avoid Prisma 7 breaking changes)
    log "Generating Prisma client..."
    npx prisma generate

    # Build Next.js (standalone mode)
    log "Building Next.js (standalone output)..."
    npm run build

    # Create deployment package
    log "Packaging deployment bundle..."
    rm -rf deploy-bundle
    mkdir -p deploy-bundle

    # 1. Standalone server (includes bundled node_modules)
    # On Windows, Next.js standalone nests output under the project directory name
    # e.g., .next/standalone/icms/ instead of flat .next/standalone/
    # Detect and handle both layouts
    STANDALONE_DIR=".next/standalone"
    if [ -f "$STANDALONE_DIR/server.js" ]; then
        # Standard layout: server.js at root of standalone
        log "Standalone layout: flat (server.js at root)"
        cp -r "$STANDALONE_DIR"/* deploy-bundle/
        cp -r "$STANDALONE_DIR"/.next deploy-bundle/ 2>/dev/null || true
    else
        # Windows layout: server.js nested under project directory name
        # Search only 2 levels deep to avoid matching server.js inside node_modules
        SERVER_JS=$(find "$STANDALONE_DIR" -maxdepth 2 -name "server.js" -type f | head -1)
        if [ -z "$SERVER_JS" ]; then
            err "Could not find server.js in standalone output!"
        fi
        NESTED_DIR=$(dirname "$SERVER_JS")
        log "Standalone layout: nested at $NESTED_DIR"
        # Copy only the required files (not the entire project directory)
        cp "$NESTED_DIR/server.js" deploy-bundle/
        cp -r "$NESTED_DIR/node_modules" deploy-bundle/
        cp -r "$NESTED_DIR/.next" deploy-bundle/ 2>/dev/null || true
        # Verify node_modules was copied (critical for standalone to work)
        if [ ! -d "deploy-bundle/node_modules" ]; then
            err "node_modules missing from standalone output at $NESTED_DIR!"
        fi
        log "node_modules: $(du -sh deploy-bundle/node_modules | cut -f1)"
    fi

    # 2. Static assets (not included in standalone)
    mkdir -p deploy-bundle/.next/static
    cp -r .next/static/* deploy-bundle/.next/static/

    # 3. Public files (images, uploads, SVGs)
    cp -r public deploy-bundle/public

    # 4. Prisma schema + seed (for migrations & seeding on server)
    mkdir -p deploy-bundle/prisma
    cp prisma/schema.prisma deploy-bundle/prisma/
    cp prisma/seed.ts deploy-bundle/prisma/
    cp prisma/seed-tenant.ts deploy-bundle/prisma/ 2>/dev/null || true
    cp prisma/seed-tenant-2.ts deploy-bundle/prisma/ 2>/dev/null || true

    # 5. Package files + Prisma config (required by Prisma 7)
    cp package.json deploy-bundle/
    cp package-lock.json deploy-bundle/ 2>/dev/null || true
    cp tsconfig.json deploy-bundle/ 2>/dev/null || true
    cp prisma.config.ts deploy-bundle/

    # 6. Deploy script itself (for server-side commands)
    cp deploy.sh deploy-bundle/

    # Create tar archive
    log "Creating deploy-bundle.tar.gz..."
    tar -czf deploy-bundle.tar.gz -C deploy-bundle .

    # Show bundle size
    BUNDLE_SIZE=$(du -sh deploy-bundle.tar.gz | cut -f1)
    log "Build complete! Bundle size: ${BUNDLE_SIZE}"
    log "Files in bundle:"
    echo "  deploy-bundle/"
    echo "  ├── server.js            (Next.js standalone server)"
    echo "  ├── .next/static/        (CSS, JS chunks)"
    echo "  ├── public/              (images, uploads, SVGs)"
    echo "  │   └── uploads/         (avatars, gallery)"
    echo "  ├── prisma/              (schema + seed files)"
    echo "  ├── package.json"
    echo "  └── deploy.sh"
    echo ""
    log "Next: run 'bash deploy.sh push' to upload to server"
}

# ==============================================================================
# PUSH - Upload bundle to server via SCP
# ==============================================================================
push() {
    if [ ! -f deploy-bundle.tar.gz ]; then
        err "No build found. Run 'bash deploy.sh build' first."
    fi

    log "Uploading bundle to ${VPS_USER}@${VPS_HOST}:${VPS_DIR}..."

    # Create app directory on server
    ssh "${VPS_USER}@${VPS_HOST}" "mkdir -p ${VPS_DIR}"

    # Upload the tar
    scp deploy-bundle.tar.gz "${VPS_USER}@${VPS_HOST}:${VPS_DIR}/deploy-bundle.tar.gz"

    # Extract on server
    log "Extracting on server..."
    ssh "${VPS_USER}@${VPS_HOST}" bash <<REMOTE
        cd ${VPS_DIR}

        # Backup .env and prisma.config.ts if exists
        [ -f .env ] && cp .env /tmp/icms-env-backup
        [ -f prisma.config.ts ] && cp prisma.config.ts /tmp/icms-config-backup

        # Backup uploads if exist
        [ -d public/uploads ] && cp -r public/uploads /tmp/icms-uploads-backup

        # Clean old files (prevents stale files from previous deploys)
        find . -maxdepth 1 ! -name '.' ! -name 'deploy-bundle.tar.gz' ! -name 'node_modules' -exec rm -rf {} +

        # Extract new build
        tar -xzf deploy-bundle.tar.gz

        # Restore .env and prisma.config.ts
        [ -f /tmp/icms-env-backup ] && mv /tmp/icms-env-backup .env
        [ -f /tmp/icms-config-backup ] && mv /tmp/icms-config-backup prisma.config.ts

        # Restore uploads
        if [ -d /tmp/icms-uploads-backup ]; then
            cp -rn /tmp/icms-uploads-backup/* public/uploads/ 2>/dev/null || true
            rm -rf /tmp/icms-uploads-backup
        fi

        # Cleanup
        rm -f deploy-bundle.tar.gz

        echo "Bundle extracted to ${VPS_DIR}"
REMOTE

    log "Upload complete!"
    log "Next steps on server:"
    echo "  ssh ${VPS_USER}@${VPS_HOST}"
    echo "  cd ${VPS_DIR}"
    echo "  bash deploy.sh server-setup   # (first time only)"
    echo "  bash deploy.sh server-start   # start/restart app"
}

# ==============================================================================
# DEPLOY - Build + Push in one command
# ==============================================================================
deploy() {
    build
    echo ""
    push
}

# ==============================================================================
# SERVER SETUP - Run ON the server (first time only)
# ==============================================================================
server_setup() {
    log "Setting up server (first-time)..."

    # ==================================================================
    # SAFETY: Designed to NOT disrupt existing live sites.
    # - No package upgrades (only installs missing packages)
    # - Nginx is reloaded (graceful), never restarted
    # - New Nginx server block only, existing configs untouched
    # - New PostgreSQL database only, existing databases untouched
    # - PM2 only manages 'icms' process, other processes untouched
    # ==================================================================

    # ---- 1. System packages (SAFE: skip if installed, no upgrades) ----
    MISSING_PKGS=""
    # Server uses Apache (already installed). Only install missing utilities.
    for pkg in curl; do
        if ! dpkg -l "$pkg" 2>/dev/null | grep -q "^ii"; then
            MISSING_PKGS="$MISSING_PKGS $pkg"
        fi
    done

    if [ -n "$MISSING_PKGS" ]; then
        log "Installing missing packages:$MISSING_PKGS"
        sudo apt update
        sudo apt install -y --no-upgrade $MISSING_PKGS
    else
        log "All system packages already installed. Skipping (no upgrades)."
    fi

    # ---- 2. Node.js (only if not present) ----
    if ! command -v node &>/dev/null; then
        log "Installing Node.js 20..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt install -y --no-upgrade nodejs
    fi
    log "Node.js: $(node -v)"

    # ---- 3. PM2 (only if not present, won't touch existing PM2 startup) ----
    if ! command -v pm2 &>/dev/null; then
        log "Installing PM2..."
        sudo npm install -g pm2
        pm2 startup systemd -u "$USER" --hp "$HOME" 2>/dev/null || true
    else
        log "PM2 already installed. Skipping (existing PM2 processes safe)."
    fi

    # ---- 4. Check port conflict before proceeding ----
    if ss -tlnp 2>/dev/null | grep -q ":${APP_PORT} "; then
        warn "Port ${APP_PORT} is already in use!"
        warn "Check what's running: sudo ss -tlnp | grep :${APP_PORT}"
        warn "Change APP_PORT in deploy.sh if needed."
        err "Aborting to avoid conflict with existing services."
    fi

    # ---- 5. PostgreSQL database (SAFE: only creates new db, never touches existing) ----
    log "Setting up database (existing databases will NOT be affected)..."
    sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 || \
        sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"
    sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
        sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
    log "Database '${DB_NAME}' ready (other databases untouched)."

    # ---- 5. Create .env ----
    if [ ! -f .env ]; then
        log "Creating .env..."
        AUTH_SECRET=$(openssl rand -base64 32)
        JWT_SECRET=$(openssl rand -base64 32)
        cat > .env <<EOF
# Database
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}?schema=public"

# NextAuth v5
AUTH_URL="http://${DOMAIN}"
AUTH_SECRET="${AUTH_SECRET}"
JWT_SECRET="${JWT_SECRET}"

# Email (configure your SMTP)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASSWORD="your-email-password"
SMTP_FROM="noreply@${DOMAIN}"

# App Config
NODE_ENV="production"
APP_NAME="ICMS"
APP_URL="http://${DOMAIN}"
PORT=${APP_PORT}
HOSTNAME="0.0.0.0"
EOF
        warn "EDIT .env with actual credentials: nano .env"
    fi

    # ---- 6. Install Prisma CLI + seed deps GLOBALLY ----
    # IMPORTANT: Do NOT npm install in the standalone directory!
    # It corrupts the bundled node_modules that Next.js standalone carefully assembled.
    log "Installing CLI tools globally (won't touch standalone node_modules)..."
    sudo npm install -g prisma @prisma/client tsx bcryptjs dotenv @prisma/adapter-pg pg

    # ---- 7. Push schema to database ----
    log "Pushing Prisma schema to database..."
    prisma generate
    prisma db push

    # ---- 8. Ensure upload dirs ----
    mkdir -p public/uploads/avatars public/uploads/gallery

    # ---- 9. Setup Apache reverse proxy (server uses Apache, not Nginx) ----
    setup_apache

    # ---- 10. Start app ----
    server_start

    log ""
    log "Server setup complete!"
    log "App running at: http://${DOMAIN}"
    warn "Run: bash deploy.sh seed        (to load demo data)"
    # warn "Run: sudo certbot --nginx -d ${DOMAIN}  (for SSL - skipped for now)"
    warn "Edit: nano .env                  (SMTP credentials)"
}

# ==============================================================================
# SERVER START - Start or restart the app (run ON server)
# ==============================================================================
server_start() {
    log "Starting ICMS..."
    cd "$(dirname "$0")"

    # Stop existing if running
    pm2 delete "$APP_NAME" 2>/dev/null || true

    # Start standalone server with PM2
    PORT=${APP_PORT} HOSTNAME="0.0.0.0" pm2 start server.js \
        --name "$APP_NAME" \
        --max-memory-restart 512M \
        --env production

    pm2 save
    log "App started on port ${APP_PORT}"
    pm2 show "$APP_NAME"
}

# ==============================================================================
# SEED - Populate database with demo data (run ON server)
# ==============================================================================
seed() {
    log "Seeding database..."
    cd "$(dirname "$0")"

    # Need tsx for TypeScript seed file
    npx tsx prisma/seed.ts

    log "Database seeded!"
    echo ""
    echo "============================================"
    echo "  Default Login Credentials"
    echo "============================================"
    echo ""
    echo "  Super Admin:  admin@icms.com / Admin@123"
    echo ""
    echo "  CareNS:"
    echo "    Admin:      admin@carens.com / Admin@123"
    echo "    Events:     events@carens.com / User@123"
    echo "    Registr:    registrations@carens.com / User@123"
    echo "    Certs:      certificates@carens.com / User@123"
    echo "    Attendee:   attendee@carens.com / User@123"
    echo "============================================"
}

# ==============================================================================
# APACHE (server uses Apache2, not Nginx)
# ==============================================================================
setup_apache() {
    log "Configuring Apache (SAFE: only adds new vhost, existing configs untouched)..."

    # Show existing Apache sites so user can verify nothing will conflict
    log "Existing Apache sites:"
    ls -1 /etc/apache2/sites-enabled/ 2>/dev/null || echo "  (none)"

    # Enable required modules (idempotent, safe)
    sudo a2enmod proxy proxy_http proxy_wss headers rewrite 2>/dev/null || true

    # Write ICMS vhost as a NEW separate config
    sudo tee /etc/apache2/sites-available/"$APP_NAME".conf > /dev/null <<EOF
<VirtualHost *:80>
    ServerName ${DOMAIN}

    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:${APP_PORT}/
    ProxyPassReverse / http://127.0.0.1:${APP_PORT}/

    # Cache static assets
    <LocationMatch "^/_next/static/">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </LocationMatch>

    # Upload size limit
    LimitRequestBody 10485760
</VirtualHost>
EOF

    sudo a2ensite "$APP_NAME".conf 2>/dev/null || true

    # SAFE: Test config BEFORE reloading. If test fails, remove our config and abort.
    if sudo apachectl configtest 2>&1; then
        sudo systemctl reload apache2
        log "Apache configured for ${DOMAIN} (graceful reload, zero downtime)"
    else
        err_msg=$(sudo apachectl configtest 2>&1)
        # Rollback: remove our config so existing site stays safe
        sudo a2dissite "$APP_NAME".conf 2>/dev/null || true
        sudo rm -f /etc/apache2/sites-available/"$APP_NAME".conf
        err "Apache config test FAILED. Rolled back ICMS config. Existing site is safe.\n$err_msg"
    fi
}

# ==============================================================================
# STATUS / LOGS / RESTART
# ==============================================================================
status() {
    echo ""
    log "PM2 Process Status:"
    pm2 show "$APP_NAME" 2>/dev/null || warn "App not running"
    echo ""
    log "Apache Status:"
    sudo systemctl status apache2 --no-pager -l | head -5
    echo ""
    log "PostgreSQL Status:"
    sudo systemctl status postgresql --no-pager -l | head -5
    echo ""
    log "Disk Usage:"
    df -h / | tail -1
    echo ""
}

logs() {
    pm2 logs "$APP_NAME" --lines 50
}

restart() {
    log "Restarting app..."
    pm2 restart "$APP_NAME"
    log "App restarted."
}

# ==============================================================================
# MAIN
# ==============================================================================
case "${1:-}" in
    build)          build ;;
    push)           push ;;
    deploy)         deploy ;;
    server-setup)   server_setup ;;
    server-start)   server_start ;;
    seed)           seed ;;
    restart)        restart ;;
    status)         status ;;
    logs)           logs ;;
    apache)         setup_apache ;;
    *)
        echo ""
        echo "ICMS Deployment Script"
        echo "======================"
        echo ""
        echo "LOCAL (run on your machine):"
        echo "  build         Build production bundle locally"
        echo "  push          Upload bundle to server via SCP"
        echo "  deploy        Build + Push in one command"
        echo ""
        echo "SERVER (run on VPS via SSH):"
        echo "  server-setup  First-time server setup (db, nginx, pm2)"
        echo "  server-start  Start or restart the app"
        echo "  seed          Populate database with demo data"
        echo "  restart       Restart the application"
        echo "  status        Show app, nginx, db status"
        echo "  logs          Show application logs"
        echo "  apache        Reconfigure apache vhost only"
        echo ""
        ;;
esac
