# Changelog

All notable changes to JamJar will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.0] - 2026-09-12

### Added

- **Installable PWA**
  - Web app manifest, home-screen icons, and a Workbox service worker
  - API and audio streams are never cached — safe on shared family devices

- **Live dashboard updates**
  - Server-sent events replace dashboard polling (`/api/events`)
  - Audio streaming with range support via short-lived signed tokens (`/api/stream`)

- **Ops & observability**
  - `/api/health` endpoint (DB + download-dir checks, queue status, last backup)
  - Structured JSON logging across the server
  - Daily SQLite backups via `VACUUM INTO`, keeping the last 7

- **Parent settings screen**
  - Create, rename and delete child accounts; assign Yoto/iPod device
  - PIN rotation that signs the account out everywhere

- **Clean-version-only music**
  - Explicit titles filtered from search results and blocked at request time
  - Parents can opt in per-request

- **Download queue**
  - yt-dlp runs capped at 2 concurrent downloads (`MAX_CONCURRENT_DOWNLOADS`)
  - Playlist imports create one request per track via flat-playlist metadata

- **Dynamic login screen**
  - Profile picker is driven by `GET /api/auth/profiles` — children added in
    Settings appear automatically (was a hardcoded list)
  - JamJar branding, floating music notes, springy profile cards, animated PIN dots

- **Thumbnail proxy** (`GET /api/thumb`)
  - YouTube/OpenLibrary covers are fetched and disk-cached server-side
  - Kids' devices only ever talk to the JamJar domain — fixes broken artwork on
    networks or browsers that block YouTube image domains

- **Tests & linting**
  - Vitest API/unit suite (38 tests) and ESLint, both wired into CI

### Changed

- **Auth is now cookie-based**
  - httpOnly session cookie + double-submit CSRF token (was `X-Session-Id` in
    localStorage — no longer readable by scripts)
  - Session IDs stored SHA-256-hashed in SQLite, 30-day expiry
- PIN length unified to **4–8 digits** across login pad, Settings and API
  (fixes a deadlock where a 4-digit PIN set in Settings couldn't be entered on
  the old 6-digit-only pad)
- Dropped dead Internxt references; `internxt_url` column renamed to `file_path`
- Library view gained a sort dropdown (recent / oldest / title / downloaded)
- Every request row has cancel/delete actions and rename-before-download
- Full v3 UI redesign: design tokens, split dashboard views, stepped request flow

### Fixed

- `file_size_bytes` is persisted on download completion, so the dashboard's
  broken-file filter finally has data to match (migration v4)
- Unknown `/api/*` paths return a JSON 404 instead of the SPA shell
- `POST /requests` no longer 500s when `searchQuery` is omitted
- Deploy: `data/` directory fully gitignored; local DB artifacts can't be
  committed again

### Security

- **47 dependency vulnerabilities cleared** (1 critical, 21 high) via a full
  `pnpm update`; OSV scanner re-enabled and now reports 0 open alerts
- `set-pins.js` wrote **plaintext PINs** — bcrypt verification could never
  match, locking the account and storing the PIN unhashed. Both PIN scripts
  now hash with bcrypt-12, bump `credentials_changed_at`, and revoke sessions
- Helmet CSP, per-route auth, path-traversal guards, URL allowlists for video
  info/downloads, login + global rate limiting, timing-safe PIN compare

## [2.2.0] - 2026-04-05

### Added

- **VPS Deployment Script**
  - `deploy-vps.sh` for one-click deployment to Hostinger/DigitalOcean/Hetzner
  - Automated systemd service setup (auto-start, auto-restart)
  - Nginx reverse proxy configuration
  - Let's Encrypt SSL certificate automation via Certbot
  - Log rotation configuration
  - Secure JWT secret generation
  - Database seeding on first deploy

- **Production Documentation**
  - Updated README with VPS deployment instructions
  - DNS configuration guide for custom domains
  - Manual deployment fallback instructions
  - Home server / Raspberry Pi deployment options

### Changed

- **Hosting Strategy**
  - Migrated from Railway to self-hosted VPS (DMCA concerns)
  - Full control over server, no content restrictions
  - Compatible with Hostinger, DigitalOcean, Hetzner, Oracle Cloud

### Security

- JWT secret auto-generated with `openssl rand -hex 32`
- System user created with restricted permissions (`/bin/false` shell)
- systemd service runs as non-root user
- SSL enforced via Let's Encrypt

## [2.1.0] - 2026-04-05

### Added

- **YouTube Playlist Support**
  - Kids can paste YouTube playlist URLs to request entire playlists
  - Backend detects playlist vs single video URLs
  - yt-dlp configured to download all tracks from playlists
  - Each playlist track creates a separate request entry for parent approval
  - Playlist metadata stored (title, track count)

- **PIN-Based Authentication**
  - Replaced JWT/bcrypt with simple 4-digit PIN system
  - Pre-configured accounts: Cristina (Yoto), Isabella (iPod), Parent
  - Session-based auth with in-memory store
  - No registration flow — accounts seeded at startup
  - Much simpler for family use

- **Tinder-Style Swipe Approval UI**
  - Swipe right to approve, swipe left to reject
  - Smooth Framer Motion animations with card rotation
  - Keyboard shortcuts (arrow keys) for desktop
  - Rejection modal with 5 reason categories:
    - Not age-appropriate
    - Already have this
    - Inappropriate content
    - Poor audio quality
    - Other (custom text input)
  - Progress indicator showing current/total pending requests
  - Empty state when all caught up

- **Railway Deployment Support**
  - `railway.json` configuration file
  - Persistent storage setup for SQLite database
  - Environment variable management in Railway dashboard
  - `DEPLOY_RAILWAY.md` with complete deployment guide
  - Auto-deploy on GitHub push
  - Shell access for seeding database

- **Toast Notification System**
  - Global toast component with success/error/warning/info types
  - Auto-dismiss after 3 seconds
  - Animated entrance/exit with Framer Motion
  - Integrated into all user actions:
    - Login success/failure
    - Request submitted
    - Request approved/rejected
    - Keyword added/removed

- **Dark Mode Toggle**
  - Sun/Moon icon toggle in navbar
  - Persists preference in localStorage
  - TailwindCSS dark mode classes throughout
  - Smooth transition between themes

- **Blocked Keywords Management UI**
  - Parent-only section in dashboard
  - Add/remove blocked keywords in real-time
  - Displayed as pill-style tags with remove button
  - Enforced on request creation (blocked requests rejected)

- **Enhanced Analytics**
  - Rejection reasons breakdown chart
  - Most requested songs leaderboard
  - Per-child usage statistics
  - Request type distribution (music vs audiobook)
  - Recent activity feed with status badges

### Changed

- **Auth Flow Simplified**
  - Removed registration page
  - Single login screen with username + PIN
  - Session IDs replace JWT tokens
  - Demo accounts shown on login page for reference

- **Database Schema Updates**
  - Added `pin` column to users table (replaces `password_hash`)
  - Added `avatar_emoji` column for profile icons
  - Added `rejected_reason` column to requests table
  - Removed unused columns from v1 schema

- **API Authentication**
  - Replaced `Authorization: Bearer <token>` with `X-Session-Id` header
  - In-memory session store (resets on server restart)
  - Simpler middleware, no JWT verification overhead

### Fixed

- Express 5 compatibility issues with catch-all routes
- Import path errors in API routes
- Port conflict handling in development
- Database migration from v1 to v2 schema

### Security

- **Note:** PINs are stored in plaintext (acceptable for family use, not for public apps)
- Sessions are in-memory only (lost on restart — acceptable for family use)
- For production with sensitive data, upgrade to proper auth (Clerk, Auth0, etc.)

## [2.0.0] - 2026-04-05

### Added

- **Complete Rewrite with Express + SQLite**
  - Migrated from Convex to self-hosted Express backend
  - SQLite database with better-sqlite3
  - Full control over server-side operations

- **User Authentication**
  - JWT-based auth with bcrypt password hashing
  - Separate parent/child roles
  - Profile assignment (Yoto/iPod)

- **YouTube Search Integration**
  - YouTube Data API v3 support (with API key)
  - SafeSearch filtering for kid-appropriate content
  - Fallback to mock data when API key not configured

- **Download Pipeline**
  - yt-dlp integration for audio extraction
  - Separate folders for Yoto and iPod profiles
  - Background download processing
  - Status tracking (pending → approved → downloading → completed)

- **Internxt Cloud Storage**
  - SDK integration for file uploads
  - Mock URLs when credentials not configured
  - Shareable download links per request

- **Parent Dashboard**
  - Approve/reject pending requests
  - View request history with status indicators
  - Delete completed/rejected requests
  - Real-time updates

- **Analytics Dashboard**
  - Total/pending/completed/rejected counts
  - By-profile breakdown (Yoto vs iPod)
  - By-type breakdown (music vs audiobook)
  - Most requested songs leaderboard
  - Recent activity feed

- **Kid Request Form**
  - Search autocomplete with thumbnails
  - Music/audiobook type selector
  - Profile-themed UI (Yoto = orange/yellow, iPod = blue/purple)
  - Success feedback on submission

- **Tutorial Pages**
  - Step-by-step Yoto Player guide
  - Step-by-step iPod guide
  - Kid-friendly language with emojis
  - Pro tips for each device

- **Content Safety**
  - Blocked keywords database
  - Parent-configured word filtering
  - Request validation before submission

- **Framer Motion Animations**
  - Page transitions
  - Card hover effects
  - List item entrances
  - Modal animations

- **Responsive Design**
  - Mobile-friendly layouts
  - TailwindCSS utility classes
  - Gradient backgrounds
  - Lucide React icons

### Tech Stack

- Express 5 + SQLite (better-sqlite3)
- React 19 + Vite + TailwindCSS v4
- JWT + bcrypt for auth
- Framer Motion for animations
- Zustand for state management
- yt-dlp for downloads
- Internxt SDK for cloud storage

## [1.0.0] - 2026-04-04

### Added

- **Initial Concept** with Convex backend
- Basic request/review workflow
- Mock search functionality
- Parent approval dashboard
- Tutorial documentation

### Notes

- v1 was a prototype that evolved into v2
- Convex auth limitations led to Express migration
- v2 is the production-ready version

---

## Version History Summary

| Version | Date | Key Changes |
|---------|------|-------------|
| 2.3.0 | 2026-09-12 | PWA, SSE live updates, parent settings, cookie auth + CSRF, thumbnail proxy, dynamic login, 47 vulns cleared |
| 2.2.0 | 2026-04-05 | VPS deployment script, Nginx + SSL automation |
| 2.1.0 | 2026-04-05 | Playlists, PIN auth, swipe UI, Railway deploy, toasts, dark mode |
| 2.0.0 | 2026-04-05 | Express rewrite, full feature set, Internxt integration |
| 1.0.0 | 2026-04-04 | Initial Convex prototype |

## Release Process

1. Update `CHANGELOG.md` with new version
2. Bump version in `package.json`
3. Commit: `git commit -m "Release vX.Y.Z"`
4. Tag: `git tag vX.Y.Z`
5. Push: `git push origin main --tags`
6. The Deploy workflow ships to the VPS automatically on push to main

## Semantic Versioning

- **MAJOR** (2.x.0): Breaking changes, major rewrites
- **MINOR** (x.1.0): New features, backward-compatible
- **PATCH** (x.x.1): Bug fixes, minor improvements
