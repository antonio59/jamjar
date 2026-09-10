# JamJar 🫙

Full-stack family music request app with Express, SQLite, and React.

## Features
- Kid profiles (Yoto/iPod) with themed UIs
- Parent approval dashboard with Tinder-style swipe UI
- YouTube search with safe filtering + playlist support
- yt-dlp download pipeline
- Real-time request tracking
- Blocked keywords for content safety
- Clean-version-only music: explicit/age-restricted results are filtered out and labelled clean edits ranked first
- PIN-based authentication (simple, family-friendly)
- Dark mode + toast notifications
- Analytics dashboard with metrics

## Quick Start

```bash
# Install dependencies (using pnpm)
pnpm install

# Start both frontend and backend
pnpm dev

# Or separately:
pnpm dev:server   # Backend on :3001
pnpm dev:vite     # Frontend on :3000
```

## First-Time Setup

1. Create a parent account through the UI
2. Create child accounts (Yoto/iPod profiles)
3. Kids can start requesting music!

## Environment Variables (optional)

```env
PORT=3001
JWT_SECRET=your-secret-key
YOUTUBE_API_KEY=your_youtube_api_key
DOWNLOAD_DIR=./downloads
MAX_CONCURRENT_DOWNLOADS=2
DB_PATH=./data/jamjar.db
BACKUP_DIR=./data/backups
BACKUP_KEEP=7
LOG_LEVEL=info
ACCESS_TOKEN_SECRET=change-me
ACCESS_TOKEN_TTL=300
```

## Operations

- `GET /api/health` — unauthenticated liveness check (database, download dir, queue, last backup). Returns 503 when degraded, so it can drive systemd/nginx/uptime monitoring.
- Logs are structured JSON lines in production (`LOG_LEVEL` controls verbosity), pretty single lines in development.
- The database is backed up with `VACUUM INTO` at startup and daily into `BACKUP_DIR`, keeping the newest `BACKUP_KEEP` copies.
- Audio previews and the dashboard event stream authenticate with a short-lived token from `POST /api/access-token`, signed with `ACCESS_TOKEN_SECRET` (set it in production, otherwise tokens are invalidated by every restart) and valid for `ACCESS_TOKEN_TTL` seconds.
- `GET /api/events` is a server-sent event stream of request changes; the dashboard falls back to polling if it can't connect, so any reverse proxy in front of the app must not buffer it (`proxy_buffering off;` in nginx).

## Production Deployment

### Option 1: Hostinger VPS (Recommended)

If you have a VPS (Hostinger, DigitalOcean, Hetzner, etc.):

```bash
# On your VPS, run the deployment script:
sudo bash deploy-vps.sh
```

This script:
- Installs Node.js, Nginx, yt-dlp, Certbot
- Sets up systemd service (auto-start on boot)
- Configures Nginx reverse proxy
- Gets SSL certificate from Let's Encrypt
- Seeds the database with default accounts

### Option 2: Manual VPS Setup

See `DEPLOY_VPS.md` for step-by-step manual instructions.

### Option 3: Local/Home Server

Run on a Raspberry Pi or old laptop:
```bash
pnpm install
pnpm build
pnpm start
```

Use Cloudflare Tunnel for public access (no port forwarding needed).

## Tech Stack
- **Backend:** Express 5 + SQLite (better-sqlite3)
- **Frontend:** React 19 + Vite + TailwindCSS v4
- **Auth:** Session-based with 4-digit PINs
- **Animations:** Framer Motion
- **State:** Zustand
- **Downloader:** yt-dlp
- **Storage:** Local filesystem (`DOWNLOAD_DIR`), served over authenticated routes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT — Built with love for the family ❤️
