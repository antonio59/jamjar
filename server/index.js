import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [Sentry.httpIntegration(), Sentry.expressIntegration()],
  tracesSampleRate: 0.2,
  beforeSend(event) {
    // Scrub sensitive fields before sending to Sentry
    if (event.request?.data) {
      delete event.request.data.pin;
    }
    if (event.request?.headers) {
      delete event.request.headers['x-session-id'];
    }
    return event;
  },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://jamjar.antoniosmith.xyz';

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://img.youtube.com', 'https://i.ytimg.com', 'https://covers.openlibrary.org'],
      mediaSrc: ["'self'", 'blob:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS — only allow the production origin
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? ALLOWED_ORIGIN : true,
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-Session-Id'],
  credentials: false,
}));

// Global rate limit — 300 requests per 15 min per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
}));

app.use(express.json({ limit: '100kb' }));

// Serve static files from dist
app.use(express.static(path.join(__dirname, '../dist')));

// API routes
app.use('/api', apiRoutes);

// Serve frontend for all other routes (Express 5 compatible)
app.get('/{*path}', (req, res) => {
  const indexPath = path.join(__dirname, '../dist/index.html');
  res.sendFile(indexPath, (err) => {
    if (err) res.status(500).send('Server error');
  });
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
