# ICMS - Deployment Guide (Hostinger VPS)

Build locally, deploy only the production bundle to your Hostinger VPS. No source code on the server.

---

## How It Works

```
LOCAL MACHINE                          VPS (Hostinger)
┌──────────────────┐    SCP            ┌───────────────────────────┐
│ Source code       │                  │ /var/www/icms/            │
│ npm run build     │──────────────>   │ ├── server.js    (50KB)   │
│ (standalone mode) │  deploy-bundle   │ ├── .next/static/ (CSS/JS)│
│                   │  (~50MB tar.gz)  │ ├── public/      (images) │
│ Full node_modules │                  │ ├── prisma/      (schema) │
│ NOT uploaded      │                  │ └── .env                  │
└──────────────────┘                  └───────────────────────────┘
                                              │
                                        PM2 → node server.js
                                              │
                                        Nginx reverse proxy
                                              │
                                        https://icms.domain.com
```

**What goes to the server:**
- `server.js` — Self-contained Next.js server with bundled dependencies (~50MB total)
- `.next/static/` — CSS, JS chunks
- `public/` — Images, uploads, SVGs
- `prisma/` — Schema + seed files (for DB migrations)

**What stays local:**
- Full source code (`src/`, `components/`, etc.)
- `node_modules/` (500MB+)
- Dev dependencies, TypeScript configs, etc.

---

## Architecture on the VPS

```
VPS (Hostinger)
├── Nginx (reverse proxy, port 80/443)
│   ├── reactapp.domain.com  → localhost:3000  (existing React app)
│   ├── api.domain.com       → localhost:8000  (existing Python app)
│   └── icms.domain.com      → localhost:3001  (ICMS - Next.js)
├── PostgreSQL (port 5432)
│   ├── existing_db_1
│   ├── existing_db_2
│   └── icms_db              ← new database for ICMS
└── PM2 (process manager)
    ├── react-app
    └── icms                  ← runs server.js (standalone)
```

---

## Prerequisites

- Hostinger VPS with SSH access (Ubuntu 22.04/24.04)
- PostgreSQL already running on the server
- Domain/subdomain pointed to VPS IP
- Node.js and npm installed on your **local machine**

---

## Step 1: Configure deploy.sh (Local)

Edit the top of `deploy.sh` on your local machine:

```bash
nano deploy.sh
```

```bash
APP_NAME="icms"
APP_PORT=3001
DOMAIN="icms.yourdomain.com"

# SSH connection
VPS_USER="root"                    # your SSH user
VPS_HOST="154.41.xx.xx"           # your VPS IP
VPS_DIR="/var/www/icms"

# Database
DB_NAME="icms_db"
DB_USER="icms_user"
DB_PASS="a_very_strong_password"   # CHANGE THIS!
```

> Check for port conflicts on VPS: `sudo ss -tlnp | grep LISTEN`

---

## Step 2: Build Locally

```bash
bash deploy.sh build
```

This runs on your local machine:
1. `npm ci` — installs dependencies
2. `npx prisma generate` — generates Prisma client
3. `npm run build` — builds Next.js in **standalone mode**
4. Packages only production files into `deploy-bundle.tar.gz`

Output:
```
[ICMS] Build complete! Bundle size: 48M
  deploy-bundle/
  ├── server.js            (Next.js standalone server)
  ├── .next/static/        (CSS, JS chunks)
  ├── public/              (images, uploads, SVGs)
  │   └── uploads/         (avatars, gallery)
  ├── prisma/              (schema + seed files)
  ├── package.json
  └── deploy.sh
```

---

## Step 3: Push to Server

```bash
bash deploy.sh push
```

This:
1. Uploads `deploy-bundle.tar.gz` via SCP
2. Extracts it on the server
3. Preserves existing `.env` and `uploads/` directory

Or do both in one command:
```bash
bash deploy.sh deploy    # build + push
```

---

## Step 4: Server Setup (First Time Only)

SSH into your VPS:
```bash
ssh root@YOUR_VPS_IP
cd /var/www/icms
```

Run the one-time setup:
```bash
bash deploy.sh server-setup
```

This will:
1. Install Node.js 20 (if not present)
2. Install PM2 process manager
3. Create PostgreSQL database `icms_db` and user
4. Generate `.env` with random secrets
5. Install minimal Prisma CLI on server
6. Push schema to database (create tables)
7. Configure Nginx reverse proxy
8. Start the app via PM2

---

## Step 5: Configure .env (On Server)

```bash
nano /var/www/icms/.env
```

Update these values:
```env
# Database (verify)
DATABASE_URL="postgresql://icms_user:your_password@localhost:5432/icms_db?schema=public"

# Auth
AUTH_URL="https://icms.yourdomain.com"
AUTH_SECRET="auto-generated-keep-this"

# SMTP (required for OTP/password reset)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@yourdomain.com"

# App
NODE_ENV="production"
APP_URL="https://icms.yourdomain.com"
```

Restart after editing:
```bash
bash deploy.sh restart
```

---

## Step 6: Seed Database

```bash
bash deploy.sh seed
```

Creates demo data:
- **2 Tenants**: Apollo Medical College, Fortis Institute of Research
- **11 Users** across roles (Super Admin, Admin, Event Manager, etc.)
- **6 Speakers** (3 per tenant)
- **4 Sponsors** (2 per tenant)
- **6 Events** (conferences, workshops, CME sessions)
- **8 Registrations** with various statuses
- **2 Certificates** for completed events

**Default Login Credentials:**

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@icms.com | Admin@123 |
| Apollo Admin | admin@apollo.com | Admin@123 |
| Apollo Event Manager | events@apollo.com | User@123 |
| Apollo Reg. Manager | registrations@apollo.com | User@123 |
| Apollo Cert. Manager | certificates@apollo.com | User@123 |
| Apollo Attendee | attendee@apollo.com | User@123 |
| Fortis Admin | admin@fortis.com | Admin@123 |
| Fortis Event Manager | events@fortis.com | User@123 |
| Fortis Reg. Manager | registrations@fortis.com | User@123 |
| Fortis Cert. Manager | certificates@fortis.com | User@123 |
| Fortis Attendee | attendee@fortis.com | User@123 |

> **Change these passwords immediately in production!**

---

## Step 7: Enable SSL

```bash
sudo certbot --nginx -d icms.yourdomain.com
```

Verify auto-renewal:
```bash
sudo certbot renew --dry-run
```

---

## Subsequent Deployments (Updates)

After making code changes locally:

```bash
# On your local machine - one command does everything:
bash deploy.sh deploy
```

Then on the server:
```bash
ssh root@YOUR_VPS_IP
cd /var/www/icms
bash deploy.sh server-start
```

If you changed the Prisma schema, also run:
```bash
npx prisma db push
```

---

## Uploaded Images

Images are bundled in the build and also preserved across deployments. The `push` command automatically backs up and restores the `uploads/` directory.

```
/var/www/icms/public/
├── uploads/
│   ├── avatars/      ← user profile photos (10 files)
│   └── gallery/      ← event gallery images (5 files)
├── images/
│   └── default-event.svg
├── file.svg
├── globe.svg
└── next.svg
```

Nginx serves these directly (bypassing Node.js) for better performance.

---

## Command Reference

### Local Commands (on your machine)
```bash
bash deploy.sh build         # Build production bundle
bash deploy.sh push          # Upload to server
bash deploy.sh deploy        # Build + Push
```

### Server Commands (on VPS via SSH)
```bash
bash deploy.sh server-setup  # First-time setup
bash deploy.sh server-start  # Start/restart app
bash deploy.sh seed          # Seed database
bash deploy.sh restart       # Restart app
bash deploy.sh status        # Show status
bash deploy.sh logs          # View logs
bash deploy.sh nginx         # Reconfigure nginx
```

### PM2 Commands
```bash
pm2 list                     # All running apps
pm2 monit                    # Real-time monitoring
pm2 restart icms             # Restart
pm2 stop icms                # Stop
pm2 logs icms --lines 100    # View logs
```

---

## Troubleshooting

### Build fails locally
```bash
# Clean and retry
rm -rf .next node_modules deploy-bundle
npm ci
npm run build
```

### App won't start on server
```bash
pm2 logs icms --lines 100

# Test directly:
cd /var/www/icms
PORT=3001 HOSTNAME=0.0.0.0 node server.js
```

### Nginx 502 Bad Gateway
```bash
pm2 list                      # Is icms running?
curl http://localhost:3001    # Test directly
pm2 restart icms
```

### Database connection issues
```bash
psql "postgresql://icms_user:password@localhost:5432/icms_db"
sudo systemctl status postgresql
```

### Memory issues on small VPS
```bash
# Add swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Coexistence with Existing Apps

1. **Ports**: ICMS uses 3001, your existing apps keep their ports
2. **Nginx**: Adds its own server block, doesn't touch others
3. **PostgreSQL**: Own database (`icms_db`), isolated from others
4. **PM2**: All Node apps managed together via `pm2 list`
5. **Disk**: Standalone bundle is ~50MB vs ~500MB+ for full source + node_modules

---

## Security Checklist

- [ ] Change default seed passwords immediately
- [ ] Set strong `DB_PASS` before running server-setup
- [ ] Enable SSL with Certbot
- [ ] Configure firewall: `sudo ufw allow 22,80,443/tcp && sudo ufw enable`
- [ ] Disable root SSH login
- [ ] Set up PostgreSQL backups
- [ ] Use app-specific password for SMTP
- [ ] Keep `.env` out of git (already in .gitignore)
