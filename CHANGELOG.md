# Changelog

All notable changes to Music Request will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
| 2.1.0 | 2026-04-05 | Playlists, PIN auth, swipe UI, Railway deploy, toasts, dark mode |
| 2.0.0 | 2026-04-05 | Express rewrite, full feature set, Internxt integration |
| 1.0.0 | 2026-04-04 | Initial Convex prototype |

## Release Process

1. Update `CHANGELOG.md` with new version
2. Bump version in `package.json`
3. Commit: `git commit -m "Release v2.1.0"`
4. Tag: `git tag v2.1.0`
5. Push: `git push origin main --tags`
6. Deploy to Railway

## Semantic Versioning

- **MAJOR** (2.x.0): Breaking changes, major rewrites
- **MINOR** (x.1.0): New features, backward-compatible
- **PATCH** (x.x.1): Bug fixes, minor improvements
