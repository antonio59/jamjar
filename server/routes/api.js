import express from 'express';
import jwt from 'jsonwebtoken';
import {
  createUser,
  getUserByUsername,
  verifyPassword,
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
} from '../server/database.js';
import { searchYouTube } from '../server/youtube.js';
import { downloadAndUpload } from '../server/downloader.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'music-request-secret-key-change-in-production';

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

function requireParent(req, res, next) {
  if (req.user.role !== 'parent') {
    return res.status(403).json({ error: 'Parent access required' });
  }
  next();
}

// Auth routes
router.post('/auth/register', (req, res) => {
  try {
    const { username, password, role, profile, displayName } = req.body;
    
    if (getUserByUsername(username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    const user = createUser(username, password, role, profile, displayName);
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, profile: user.profile },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const user = getUserByUsername(username);
    
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, profile: user.profile },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      user: { id: user.id, username: user.username, role: user.role, profile: user.profile, display_name: user.display_name },
      token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search route
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q, type } = req.query;
    if (!q || q.length < 2) {
      return res.json([]);
    }
    
    const results = await searchYouTube(q, type || 'music');
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Request routes
router.post('/requests', authenticateToken, (req, res) => {
  try {
    const { profile, title, url, type, searchQuery, thumbnail, duration } = req.body;
    const request = createRequest(req.user.id, profile, title, url, type, searchQuery, thumbnail, duration);
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/requests', authenticateToken, (req, res) => {
  try {
    if (req.user.role === 'parent') {
      res.json(getAllRequests());
    } else {
      res.json(getRequestsByProfile(req.user.profile));
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/requests/pending', authenticateToken, requireParent, (req, res) => {
  try {
    res.json(getPendingRequests());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/requests/:id/approve', authenticateToken, requireParent, (req, res) => {
  try {
    const request = approveRequest(req.params.id, req.user.id);
    // Trigger download in background
    downloadAndUpload(request).catch(console.error);
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/requests/:id/reject', authenticateToken, requireParent, (req, res) => {
  try {
    const request = rejectRequest(req.params.id);
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/requests/:id', authenticateToken, requireParent, (req, res) => {
  try {
    deleteRequest(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics route (parent only)
router.get('/analytics', authenticateToken, requireParent, (req, res) => {
  try {
    res.json(getAnalytics());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Blocked keywords
router.get('/blocked-keywords', authenticateToken, requireParent, (req, res) => {
  try {
    res.json(getBlockedKeywords());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/blocked-keywords', authenticateToken, requireParent, (req, res) => {
  try {
    const { keyword } = req.body;
    addBlockedKeyword(keyword, req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/blocked-keywords/:id', authenticateToken, requireParent, (req, res) => {
  try {
    removeBlockedKeyword(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
