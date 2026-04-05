# 🎵 Music Request - Quick Start Guide

## For Parents

### First Time Setup

1. **Clone the repo:**
   ```bash
   git clone https://github.com/antonio59/music-request-v2.git
   cd music-request-v2
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the app:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

### Default Accounts

The app comes with pre-seeded test accounts:

| Role | Username | Password | Profile |
|------|----------|----------|---------|
| Parent | `parent` | `parent123` | N/A |
| Kid | `yoto-kid` | `yoto123` | Yoto |
| Kid | `ipod-kid` | `ipod123` | iPod |

**Change these passwords in production!**

### Using the App

**For Kids:**
1. Login with your kid account
2. Search for music or audiobooks **OR paste a YouTube playlist URL**
3. Select a track or playlist and click "Send Request"
4. Wait for parent approval
5. Check "My Requests" to see status

**Playlist Support:**
- Paste any YouTube playlist URL (e.g., `https://youtube.com/playlist?list=PLxyz...`)
- The app extracts all tracks and creates individual requests
- Parents approve each track separately
- Great for requesting entire albums or themed collections!

**For Parents:**
1. Login with parent account
2. Go to Dashboard to see pending requests
3. Click "Approve" to download or "Reject" to decline
4. Check Analytics for insights:
   - Total requests, approval rates
   - Most requested songs
   - Per-child breakdown
5. Manage blocked keywords to filter content

## Configuration (Optional)

Copy `.env.example` to `.env` and configure:

```env
# YouTube API Key (for real search results)
# Get one from: https://console.cloud.google.com/apis/credentials
YOUTUBE_API_KEY=your_key_here

# Internxt Credentials (for cloud storage)
INTERNXT_EMAIL=your@email.com
INTERNXT_PASSWORD=your_password
INTERNXT_APP_KEY=your_app_key

# Change the JWT secret in production
JWT_SECRET=generate-a-random-string-here
```

## Installing yt-dlp (for real downloads)

**macOS:**
```bash
brew install yt-dlp
```

**Linux:**
```bash
sudo apt install yt-dlp
# or
pip install yt-dlp
```

**Windows:**
```bash
choco install yt-dlp
```

Without yt-dlp, downloads are simulated for demo purposes.

## Production Deployment

This app needs a Node.js backend (not static hosting). Recommended platforms:

- **Railway.app** — Easiest setup, free tier available
- **Render.com** — Free tier, auto-deploy from GitHub
- **Fly.io** — Great for global deployment
- **Your own VPS** — Full control

### Deploy to Railway

1. Connect your GitHub repo to Railway
2. Add environment variables in Railway dashboard
3. Deploy!

### Deploy to Render

1. Create a "Web Service" on Render
2. Connect GitHub repo
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add environment variables

## Troubleshooting

**Port 3000/3001 already in use:**
```bash
lsof -ti:3000 | xargs kill
lsof -ti:3001 | xargs kill
```

**Database errors:**
```bash
rm -rf data/
node seed.js
```

**Can't search:**
- Without a YouTube API key, the app uses mock data
- Mock results include: Happy, Count on Me, Roar, Frozen, etc.
- Type part of these titles to see results

## Support

- GitHub Issues: https://github.com/antonio59/music-request-v2/issues
- Linear Board: Check project status there

## Family Handover Checklist

- [ ] Kids know their login credentials
- [ ] Parent knows how to approve/reject requests
- [ ] Tutorial page reviewed with kids
- [ ] Blocked keywords configured (if needed)
- [ ] Internxt account set up for downloads
- [ ] Kids know how to download from Internxt to their devices

Enjoy the music! 🎶
