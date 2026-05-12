# JamJar 🫙

Full-stack family music request app with Express, SQLite, and React.

## Features
- Kid profiles (Yoto/iPod) with themed UIs
- Parent approval dashboard with Tinder-style swipe UI
- YouTube search with safe filtering + playlist support
- yt-dlp download pipeline
- Internxt cloud storage integration
- Real-time request tracking
- Blocked keywords for content safety
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
DB_PATH=./data/jamjar.db
INTERNXT_EMAIL=your-email
INTERNXT_PASSWORD=your-password
INTERNXT_APP_KEY=your-app-key
```

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
- **Storage:** Internxt SDK

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT — Built with love for the family ❤️
