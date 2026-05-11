import express from "express";
import path from "path";
import fs from "fs";
import { randomBytes, createHash } from "crypto";
import { fileURLToPath } from "url";
import axios from "axios";
import rateLimit from "express-rate-limit";
import {
  verifyPin,
  createRequest,
  getAllRequests,
  getPendingRequests,
  getRequestsByProfile,
  approveRequest,
  rejectRequest,
  updateRequestStatus,
  deleteRequest,
  getAnalytics,
  getBlockedKeywords,
  addBlockedKeyword,
  removeBlockedKeyword,
  getRequestById,
  createSession,
  getSession,
  deleteSession,
  purgeExpiredSessions,
} from "../database.js";
import { searchYouTube } from "../youtube.js";
import { downloadAndUpload } from "../downloader.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOWNLOAD_DIR =
  process.env.DOWNLOAD_DIR || path.join(__dirname, "../../downloads");

const router = express.Router();

// Purge expired sessions on startup and every 6 hours
purgeExpiredSessions();
setInterval(purgeExpiredSessions, 6 * 60 * 60 * 1000);

// Allowed external hostnames for video info and downloading
const ALLOWED_VIDEO_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "m.youtube.com",
  "youtu.be",
  "music.youtube.com",
]);

function validateVideoUrl(url) {
  try {
    const parsed = new URL(url);
    if (!["https:", "http:"].includes(parsed.protocol)) return false;
    return ALLOWED_VIDEO_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

function hashSessionId(id) {
  return createHash("sha256").update(id).digest("hex");
}

function authenticateSession(req, res, next) {
  const rawId = req.headers["x-session-id"];
  if (!rawId) return res.status(401).json({ error: "Not authenticated" });
  const session = getSession(hashSessionId(rawId));
  if (!session) return res.status(401).json({ error: "Not authenticated" });
  req.user = session;
  next();
}

function requireParent(req, res, next) {
  if (req.user.role !== "parent") {
    return res.status(403).json({ error: "Parent access required" });
  }
  next();
}

// Strict rate limit on login — 10 attempts per 15 min per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later" },
});

// Auth routes - PIN-based
router.post("/auth/login", loginLimiter, async (req, res) => {
  try {
    const { username, pin } = req.body;
    if (!username || !pin) {
      return res.status(400).json({ error: "Username and PIN required" });
    }

    const user = await verifyPin(username, pin);

    if (!user) {
      return res.status(401).json({ error: "Invalid username or PIN" });
    }

    const rawSessionId = randomBytes(32).toString("hex");
    createSession(hashSessionId(rawSessionId), user.id);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        profile: user.profile,
        display_name: user.display_name,
        avatar_emoji: user.avatar_emoji,
      },
      sessionId: rawSessionId,
    });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/auth/logout", (req, res) => {
  const rawId = req.headers["x-session-id"];
  if (rawId) deleteSession(hashSessionId(rawId));
  res.json({ success: true });
});

router.get("/auth/me", authenticateSession, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    role: req.user.role,
    profile: req.user.profile,
    display_name: req.user.display_name,
    avatar_emoji: req.user.avatar_emoji,
  });
});

// Search route (YouTube for music)
router.get("/search", authenticateSession, async (req, res) => {
  try {
    const { q, type } = req.query;
    if (!q || q.length < 2) {
      return res.json([]);
    }
    const results = await searchYouTube(q, type || "music");
    res.json(results);
  } catch {
    res.status(500).json({ error: "Search failed" });
  }
});

// Book search via Open Library
router.get("/search/books", authenticateSession, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const response = await axios.get("https://openlibrary.org/search.json", {
      params: {
        q,
        fields: "key,title,author_name,cover_i,first_publish_year,subject",
        limit: 10,
      },
      timeout: 8000,
    });

    const books = (response.data.docs || []).map((doc) => ({
      id: doc.key,
      title: doc.title,
      author: doc.author_name ? doc.author_name[0] : "Unknown Author",
      year: doc.first_publish_year || null,
      thumbnail: doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
        : null,
      url: `https://openlibrary.org${doc.key}`,
    }));

    res.json(books);
  } catch {
    res.status(500).json({ error: "Book search failed" });
  }
});

// YouTube video info via oEmbed
router.get("/video-info", authenticateSession, async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "url required" });

    if (!validateVideoUrl(url)) {
      return res.status(400).json({ error: "Invalid video URL" });
    }

    const videoId = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1];
    if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL" });

    // Reconstruct a safe URL rather than forwarding the raw user URL
    const safeUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const oEmbed = await axios.get("https://www.youtube.com/oembed", {
      params: { url: safeUrl, format: "json" },
      timeout: 5000,
    });

    res.json({
      id: videoId,
      title: oEmbed.data.title
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
      url: safeUrl,
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      duration: "Unknown",
    });
  } catch {
    const videoId = req.query.url?.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1];
    if (videoId) {
      return res.json({
        id: videoId,
        title: "",
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        duration: "Unknown",
      });
    }
    res.status(500).json({ error: "Could not fetch video info" });
  }
});

// Request routes
router.post("/requests", authenticateSession, (req, res) => {
  try {
    const { profile, title, url, type, searchQuery, thumbnail, duration, direct } =
      req.body;

    if (!title || !type || !profile) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate URL if provided
    if (url && type !== "audiobook" && !validateVideoUrl(url)) {
      return res.status(400).json({ error: "Invalid video URL" });
    }

    // Check for blocked keywords
    const blockedKeywords = getBlockedKeywords();
    const titleLower = title.toLowerCase();
    const violations = blockedKeywords.filter((kw) =>
      titleLower.includes(kw.keyword),
    );

    if (violations.length > 0) {
      return res.status(400).json({
        error: "Content blocked",
        violations: violations.map((kw) => kw.keyword),
      });
    }

    let request = createRequest(
      req.user.id,
      profile,
      title,
      url,
      type,
      searchQuery,
      thumbnail,
      duration,
    );

    // Parents can submit directly — auto-approve and trigger download
    if (direct && req.user.role === "parent") {
      request = approveRequest(request.id, req.user.id);
      if (type !== "audiobook") {
        downloadAndUpload(request).catch(console.error);
      }
    }

    res.json(request);
  } catch {
    res.status(500).json({ error: "Failed to create request" });
  }
});

router.get("/requests", authenticateSession, (req, res) => {
  try {
    if (req.user.role === "parent") {
      res.json(getAllRequests());
    } else {
      res.json(getRequestsByProfile(req.user.profile));
    }
  } catch {
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

router.get(
  "/requests/pending",
  authenticateSession,
  requireParent,
  (req, res) => {
    try {
      res.json(getPendingRequests());
    } catch {
      res.status(500).json({ error: "Failed to fetch pending requests" });
    }
  },
);

router.post(
  "/requests/:id/approve",
  authenticateSession,
  requireParent,
  (req, res) => {
    try {
      const request = approveRequest(req.params.id, req.user.id);
      if (request.type !== "audiobook") {
        downloadAndUpload(request).catch(console.error);
      }
      res.json(request);
    } catch {
      res.status(500).json({ error: "Failed to approve request" });
    }
  },
);

router.post(
  "/requests/:id/reject",
  authenticateSession,
  requireParent,
  (req, res) => {
    try {
      const { reason } = req.body;
      const request = rejectRequest(req.params.id, reason || "Not specified");
      res.json(request);
    } catch {
      res.status(500).json({ error: "Failed to reject request" });
    }
  },
);

router.post(
  "/requests/:id/mark-uploaded",
  authenticateSession,
  requireParent,
  (req, res) => {
    try {
      const request = getRequestById(req.params.id);
      if (!request) return res.status(404).json({ error: "Not found" });
      if (request.type !== "audiobook")
        return res.status(400).json({ error: "Only audiobook requests can be marked uploaded" });
      const updated = updateRequestStatus(req.params.id, "completed");
      res.json(updated);
    } catch {
      res.status(500).json({ error: "Failed to update request" });
    }
  },
);

router.delete(
  "/requests/:id",
  authenticateSession,
  requireParent,
  (req, res) => {
    try {
      deleteRequest(req.params.id);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to delete request" });
    }
  },
);

// Analytics route (parent only)
router.get("/analytics", authenticateSession, requireParent, (req, res) => {
  try {
    res.json(getAnalytics());
  } catch {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// Blocked keywords
router.get(
  "/blocked-keywords",
  authenticateSession,
  requireParent,
  (req, res) => {
    try {
      res.json(getBlockedKeywords());
    } catch {
      res.status(500).json({ error: "Failed to fetch blocked keywords" });
    }
  },
);

router.post(
  "/blocked-keywords",
  authenticateSession,
  requireParent,
  (req, res) => {
    try {
      const { keyword } = req.body;
      if (!keyword || typeof keyword !== "string") {
        return res.status(400).json({ error: "Invalid keyword" });
      }
      addBlockedKeyword(keyword, req.user.id);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to add keyword" });
    }
  },
);

router.delete(
  "/blocked-keywords/:id",
  authenticateSession,
  requireParent,
  (req, res) => {
    try {
      removeBlockedKeyword(req.params.id);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to remove keyword" });
    }
  },
);

// Audio stream — header auth, range request support
router.get("/stream/:profile/:filename", (req, res) => {
  const rawId = req.headers["x-session-id"];
  if (!rawId) return res.status(401).json({ error: "Not authenticated" });
  const session = getSession(hashSessionId(rawId));
  if (!session) return res.status(401).json({ error: "Not authenticated" });

  const { profile, filename } = req.params;
  if (!["yoto", "ipod"].includes(profile)) {
    return res.status(400).json({ error: "Invalid profile" });
  }

  // Children can only stream their own profile
  if (session.role !== "parent" && session.profile !== profile) {
    return res.status(403).json({ error: "Access denied" });
  }

  const safeName = path.basename(filename);
  // Reject any path traversal attempts
  if (safeName !== filename || safeName.includes("..")) {
    return res.status(400).json({ error: "Invalid filename" });
  }

  const filePath = path.join(DOWNLOAD_DIR, profile, safeName);
  // Ensure resolved path is inside the expected directory
  const resolved = path.resolve(filePath);
  const allowed = path.resolve(path.join(DOWNLOAD_DIR, profile));
  if (!resolved.startsWith(allowed + path.sep) && resolved !== allowed) {
    return res.status(400).json({ error: "Invalid filename" });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  const stat = fs.statSync(filePath);
  const range = req.headers.range;

  if (range) {
    const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
    const startRaw = parseInt(startStr, 10);
    const endRaw = endStr ? parseInt(endStr, 10) : stat.size - 1;

    if (isNaN(startRaw) || isNaN(endRaw) || startRaw < 0 || endRaw >= stat.size || startRaw > endRaw) {
      res.status(416).set("Content-Range", `bytes */${stat.size}`).end();
      return;
    }

    const start = startRaw;
    const end = Math.min(endRaw, stat.size - 1);
    const chunksize = end - start + 1;

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${stat.size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "audio/mpeg",
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": stat.size,
      "Content-Type": "audio/mpeg",
      "Accept-Ranges": "bytes",
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

// Download files (authenticated)
router.get("/downloads/:profile/:filename", authenticateSession, (req, res) => {
  try {
    const { profile, filename } = req.params;
    if (!["yoto", "ipod"].includes(profile)) {
      return res.status(400).json({ error: "Invalid profile" });
    }

    // Children can only download their own profile
    if (req.user.role !== "parent" && req.user.profile !== profile) {
      return res.status(403).json({ error: "Access denied" });
    }

    const safeName = path.basename(filename);
    if (safeName !== filename || safeName.includes("..")) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    const filePath = path.join(DOWNLOAD_DIR, profile, safeName);
    const resolved = path.resolve(filePath);
    const allowed = path.resolve(path.join(DOWNLOAD_DIR, profile));
    if (!resolved.startsWith(allowed + path.sep) && resolved !== allowed) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }
    res.download(filePath, safeName);
  } catch {
    res.status(500).json({ error: "Download failed" });
  }
});

// Get request status — enforce ownership
router.get("/requests/:id/status", authenticateSession, (req, res) => {
  try {
    const request = getRequestById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Children can only see their own profile's requests
    if (req.user.role !== "parent" && request.profile !== req.user.profile) {
      return res.status(404).json({ error: "Request not found" });
    }

    res.json({
      status: request.status,
      download_url: request.internxt_url,
      error_message: request.error_message,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch status" });
  }
});

export default router;
