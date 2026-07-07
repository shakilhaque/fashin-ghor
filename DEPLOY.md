# LuxeMode — Deployment Guide

## Option A: Docker Compose (Recommended)

### Prerequisites
- VPS with Ubuntu 22.04+, min 2 vCPU / 4 GB RAM
- Docker + Docker Compose installed
- Domain pointing to VPS IP
- SSL certificate (Let's Encrypt via Certbot)

### 1. Server setup
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Clone repo
git clone https://github.com/your-org/luxemode.git /opt/luxemode
cd /opt/luxemode
```

### 2. Environment
```bash
cp .env.example .env
nano .env   # fill all values
```

### 3. SSL certificates
```bash
sudo apt install certbot
sudo certbot certonly --standalone -d luxemode.com -d www.luxemode.com
sudo cp /etc/letsencrypt/live/luxemode.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/luxemode.com/privkey.pem nginx/ssl/
```

### 4. Run database migrations
```bash
docker compose -f docker-compose.prod.yml run --rm api \
  sh -c "npx prisma migrate deploy && npx prisma db seed"
```

### 5. Start all services
```bash
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps   # verify all healthy
```

### 6. Useful commands
```bash
# Logs
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web

# Restart a service
docker compose -f docker-compose.prod.yml restart api

# Update to latest
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --no-deps api web
```

---

## Option B: PM2 (Bare VPS, no Docker)

### Prerequisites
- Node.js 20 LTS
- PostgreSQL 16, Redis 7 running locally
- `pnpm` installed globally
- Nginx installed via apt

### 1. Build
```bash
pnpm install --frozen-lockfile
pnpm --filter @ecommerce/api build
pnpm --filter @ecommerce/web build
```

### 2. Run migrations
```bash
cd apps/api
./node_modules/.bin/prisma migrate deploy
```

### 3. Start with PM2
```bash
npm install -g pm2
mkdir -p apps/api/logs apps/web/logs
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup   # auto-start on server reboot
```

### 4. Nginx config
```bash
sudo cp nginx/nginx.conf /etc/nginx/nginx.conf
sudo nginx -t
sudo systemctl reload nginx
```

---

## GitHub Actions CI/CD (Automatic)

Set these secrets in GitHub → Settings → Secrets:

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | Server IP or hostname |
| `VPS_USER` | SSH user (e.g. ubuntu) |
| `VPS_SSH_KEY` | Private SSH key |
| `DB_USER` | Postgres user |
| `DB_PASSWORD` | Postgres password |
| `DB_NAME` | Database name |
| `REDIS_PASSWORD` | Redis password |
| `JWT_ACCESS_SECRET` | 64-char random string |
| `JWT_REFRESH_SECRET` | 64-char random string |
| `APP_URL` | `https://api.luxemode.com` |
| `WEB_URL` | `https://luxemode.com` |
| `NEXT_PUBLIC_API_URL` | `https://api.luxemode.com/api/v1` |
| `NEXT_PUBLIC_WEB_URL` | `https://luxemode.com` |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM` | Sender email |
| `STRIPE_SECRET_KEY` | Stripe secret |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |
| `S3_*` | S3 / Cloudflare R2 credentials |

Push to `main` → CI runs tests → builds Docker images → pushes to GHCR → deploys to VPS automatically.
