# Music Request v2 🎵

Full-stack kid-friendly music request app with Express, SQLite, and React.

## Features
- Kid profiles (Yoto/iPod) with themed UIs
- Parent approval dashboard with analytics
- YouTube search with safe filtering
- yt-dlp download pipeline
- Internxt cloud storage integration
- Real-time request tracking
- Blocked keywords for content safety

## Quick Start

```bash
# Install dependencies
npm install

# Start both frontend and backend
npm run dev

# Or separately:
npm run dev:server   # Backend on :3001
npm run dev:vite     # Frontend on :3000
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
DB_PATH=./data/music-request.db
```

## Deploy to Netlify

Not directly supported (needs Node.js backend). Use:
- Railway.app
- Render.com
- Fly.io
- Your own VPS

## Tech Stack
- **Backend:** Express + SQLite (better-sqlite3)
- **Frontend:** React 19 + Vite + TailwindCSS v4
- **Auth:** JWT + bcrypt
- **Animations:** Framer Motion
- **State:** Zustand
- **Downloader:** yt-dlp
- **Storage:** Internxt SDK
