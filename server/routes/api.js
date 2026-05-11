import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import axios from "axios";
import {
  getUserByUsername,
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

function authenticateSession(req, res, next) {
  const sessionId = req.headers["x-session-id"];
  if (!sessionId) return res.status(401).json({ error: "Not authenticated" });
  const session = getSession(sessionId);
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

// Auth routes - PIN-based
router.post("/auth/login", (req, res) => {
  try {
    const { username, pin } = req.body;
    const user = verifyPin(username, pin);

    if (!user) {
      return res.status(401).json({ error: "Invalid username or PIN" });
    }

    const sessionId = Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    createSession(sessionId, user.id);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        profile: user.profile,
        display_name: user.display_name,
        avatar_emoji: user.avatar_emoji,
      },
      sessionId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/auth/logout", (req, res) => {
  const sessionId = req.headers["x-session-id"];
  if (sessionId) deleteSession(sessionId);
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Book search via Open Library (no API key required)
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
  } catch (error) {
    console.error("Book search error:", error.message);
    res.status(500).json({ error: "Book search failed" });
  }
});

// YouTube video info via oEmbed (no API key required)
router.get("/video-info", authenticateSession, async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "url required" });

    const videoId = url.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1];
    if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL" });

    const oEmbed = await axios.get("https://www.youtube.com/oembed", {
      params: { url, format: "json" },
      timeout: 5000,
    });

    res.json({
      id: videoId,
      title: oEmbed.data.title
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
      url,
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      duration: "Unknown",
    });
  } catch (error) {
    // Fallback if oEmbed fails (e.g. private video)
    const videoId = req.query.url?.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1];
    if (videoId) {
      return res.json({
        id: videoId,
        title: "",
        url: req.query.url,
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/requests", authenticateSession, (req, res) => {
  try {
    if (req.user.role === "parent") {
      res.json(getAllRequests());
    } else {
      res.json(getRequestsByProfile(req.user.profile));
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get(
  "/requests/pending",
  authenticateSession,
  requireParent,
  (req, res) => {
    try {
      res.json(getPendingRequests());
    } catch (error) {
      res.status(500).json({ error: error.message });
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
      // Audiobooks are sourced manually — skip auto-download
      if (request.type !== "audiobook") {
        downloadAndUpload(request).catch(console.error);
      }
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: error.message });
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
    } catch (error) {
      res.status(500).json({ error: error.message });
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
    } catch (error) {
      res.status(500).json({ error: error.message });
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
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Analytics route (parent only)
router.get("/analytics", authenticateSession, requireParent, (req, res) => {
  try {
    res.json(getAnalytics());
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    } catch (error) {
      res.status(500).json({ error: error.message });
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
      addBlockedKeyword(keyword, req.user.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
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
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Audio stream for mini player — accepts session token via query param so
// the HTML5 <audio> element can stream without custom headers
router.get("/stream/:profile/:filename", (req, res) => {
  const sessionId = req.headers["x-session-id"] || req.query.token;
  if (!sessionId) return res.status(401).json({ error: "Not authenticated" });
  const session = getSession(sessionId);
  if (!session) return res.status(401).json({ error: "Not authenticated" });

  const { profile, filename } = req.params;
  if (!["yoto", "ipod"].includes(profile)) {
    return res.status(400).json({ error: "Invalid profile" });
  }
  const safeName = path.basename(filename);
  const filePath = path.join(DOWNLOAD_DIR, profile, safeName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  const stat = fs.statSync(filePath);
  const range = req.headers.range;

  if (range) {
    const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : stat.size - 1;
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
    const safeName = path.basename(filename);
    const filePath = path.join(DOWNLOAD_DIR, profile, safeName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }
    res.download(filePath, safeName);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get request status (for real-time updates)
router.get("/requests/:id/status", authenticateSession, (req, res) => {
  try {
    const request = getRequestById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    res.json({
      status: request.status,
      download_url: request.internxt_url,
      error_message: request.error_message,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
