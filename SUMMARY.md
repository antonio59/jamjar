# 🎵 Music Request v2 - Complete Summary

## What's Built

A **kid-friendly music/audiobook request app** with:
- ✅ PIN-based authentication (simple, no passwords)
- ✅ Tinder-style swipe UI for parent approvals
- ✅ YouTube search with safe filtering
- ✅ yt-dlp download pipeline
- ✅ Internxt cloud storage integration
- ✅ Content safety with blocked keywords
- ✅ Real-time analytics dashboard
- ✅ Dark mode toggle
- ✅ Toast notifications
- ✅ Mobile-responsive design

## Architecture

```
Nieces' Devices → Railway (Express + SQLite) → Internxt (file storage)
                       ↑
                  Environment variables live here
                  NOT on your local machine
```

**Your Mac goes offline → App still works** because it's deployed on Railway's cloud servers.

## Quick Start (Local Testing)

```bash
cd ~/music-request-v2
npm install
npm run dev
```

Open http://localhost:3000

### Default Accounts

| Who | Username | PIN | Profile |
|-----|----------|-----|---------|
| 👨‍👩‍👧‍👦 Parent | `parent` | `9999` | Dashboard |
| 👧 Cristina | `cristina` | `1234` | Yoto |
| 👩 Isabella | `isabella` | `5678` | iPod |

## Deploy to Railway (Production)

**Full guide:** `DEPLOY_RAILWAY.md`

**Quick version:**
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select `antonio59/music-request-v2`
3. Add environment variables in Railway dashboard
4. Add persistent storage at `/app/data`
5. Run `npm run seed` in Railway Shell
6. Done! Live at `https://your-app.up.railway.app`

**Cost:** Free tier (500 hrs/month) or $5/mo for always-on.

## How It Works

### For Kids (Cristina/Isabella)

1. **Login** with username + 4-digit PIN
2. **Search** for music or audiobooks
3. **Select** a track → Click "Send Request"
4. **Wait** for parent approval
5. **Check** "My Requests" for status
6. **Download** from Internxt when approved

### For Parents

1. **Login** with parent account
2. **Dashboard** shows pending requests
3. **Swipe right** to approve → auto-downloads
4. **Swipe left** to reject → pick a reason:
   - Not age-appropriate
   - Already have this
   - Inappropriate content
   - Poor audio quality
   - Other (custom text)
5. **Analytics** page shows:
   - Total/pending/completed stats
   - Most requested songs
   - Per-child breakdown
   - Rejection reasons
6. **Blocked Keywords** — add words to filter

## Content Safety

**Three layers:**
1. **YouTube SafeSearch** — API enforces age-appropriate results
2. **Blocked Keywords** — parent-configured word filter
3. **Manual Approval** — nothing downloads without parent OK

## File Flow

```
Kid requests song → Parent approves → yt-dlp downloads 
  → Internxt uploads → Kid gets link → Download to device
```

**Storage:**
- SQLite database: Request metadata, user accounts
- Internxt: Actual audio files (MP3)
- Railway server: Temporary download cache (cleaned after upload)

## Environment Variables (Railway)

```env
JWT_SECRET=random-string-here
YOUTUBE_API_KEY=AIzaSy... (optional)
INTERNXT_EMAIL=your@email.com (optional)
INTERNXT_PASSWORD=your_password (optional)
INTERNXT_APP_KEY=your_app_key (optional)
NODE_ENV=production
```

## Customization

**Change PINs:** Edit `seed.js` → re-run `npm run seed`

**Add blocked keywords:** Parent dashboard → "Blocked Keywords" section

**Change YouTube API:** Get key from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

## Tech Stack

- **Backend:** Express 5 + SQLite (better-sqlite3)
- **Frontend:** React 19 + Vite + TailwindCSS v4
- **Auth:** Session-based with PINs
- **Animations:** Framer Motion
- **State:** Zustand
- **Downloader:** yt-dlp
- **Storage:** Internxt SDK
- **Deploy:** Railway.app

## Costs

- **Railway:** Free (500 hrs) or $5/mo always-on
- **Internxt:** Free tier available (10GB)
- **YouTube API:** Free (up to 10,000 queries/day)
- **Domain:** Free `*.railway.app` or your own

## Repo

**GitHub:** https://github.com/antonio59/music-request-v2

**Docs:**
- `README.md` — Overview
- `QUICKSTART.md` — Local setup
- `DEPLOY_RAILWAY.md` — Production deployment
- `CHANGELOG.md` — Version history

## Next Steps

1. **Deploy to Railway** (10 min)
2. **Test with Cristina & Isabella** (let them try it!)
3. **Add YouTube API key** (for real search)
4. **Install yt-dlp** on Railway (for real downloads)
5. **Add Internxt credentials** (for cloud uploads)
6. **Enjoy!** 🎶

---

**Built with ❤️ for the family**
