# 🫙 JamJar - Complete Summary

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
Kids' Devices → VPS (Express + SQLite) → Internxt (file storage)
                       ↑
              Environment variables live here
              Nginx reverse proxy + SSL
```

**Your Mac goes offline → App still works** because it's deployed on your VPS.

## Quick Start (Local Testing)

```bash
cd ~/jamjar
pnpm install
pnpm dev
```

Open http://localhost:3000

## Deploy to VPS (Production)

**Full guide:** `DEPLOY_VPS.md`

**Quick version:**
1. SSH into your VPS
2. Run `sudo bash deploy-vps.sh`
3. Add DNS A record: `jamjar.antoniosmith.xyz` → your VPS IP
4. Done! Live at `https://jamjar.antoniosmith.xyz`

**Cost:** ~$5-10/mo for VPS + domain.

## How It Works

### For Kids

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
- VPS server: Temporary download cache (cleaned after upload)

## Environment Variables

```env
JWT_SECRET=random-string-here
YOUTUBE_API_KEY=AIzaSy... (optional)
INTERNXT_EMAIL=your@email.com (optional)
INTERNXT_PASSWORD=your_password (optional)
INTERNXT_APP_KEY=your_app_key (optional)
NODE_ENV=production
```

## Customization

**Change PINs:** Edit `seed.js` → re-run `pnpm seed`

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
- **Deploy:** Self-hosted VPS

## Costs

- **VPS:** ~$5-10/mo (Hostinger, DigitalOcean, Hetzner, etc.)
- **Domain:** ~$10/year
- **SSL:** Free (Let's Encrypt)
- **Internxt:** Free tier available (10GB)
- **YouTube API:** Free (up to 10,000 queries/day)
- **Total:** ~$6-11/mo

## Repo

**GitHub:** https://github.com/antonio59/jamjar

**Docs:**
- `README.md` — Overview
- `QUICKSTART.md` — Local setup
- `DEPLOY_VPS.md` — Production deployment
- `CHANGELOG.md` — Version history

## Next Steps

1. **Deploy to VPS** (10 min)
2. **Test with the kids** (let them try it!)
3. **Add YouTube API key** (for real search)
4. **Install yt-dlp** on the VPS (for real downloads)
5. **Add Internxt credentials** (for cloud uploads)
6. **Enjoy!** 🎶

---

**Built with ❤️ for the family**
