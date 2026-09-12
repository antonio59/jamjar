// Structured JSON logging so journald/nginx log shipping stays greppable.
// Pretty single-line output in development, one JSON object per line otherwise.

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN_LEVEL = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;
const PRETTY = process.env.NODE_ENV !== 'production';

function write(level, msg, fields = {}) {
  if (LEVELS[level] < MIN_LEVEL) return;
  const entry = { time: new Date().toISOString(), level, msg, ...fields };
  const line = PRETTY
    ? `${entry.time} ${level.toUpperCase().padEnd(5)} ${msg}${
        Object.keys(fields).length ? ` ${JSON.stringify(fields)}` : ''
      }`
    : JSON.stringify(entry);
  if (level === 'error' || level === 'warn') console.error(line);
  else console.log(line);
}

export const logger = {
  debug: (msg, fields) => write('debug', msg, fields),
  info: (msg, fields) => write('info', msg, fields),
  warn: (msg, fields) => write('warn', msg, fields),
  error: (msg, fields) => write('error', msg, fields),
};

// Logs one line per request with status and duration; skips static asset noise.
export function requestLogger(req, res, next) {
  if (!req.path.startsWith('/api')) return next();
  const startedAt = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    logger.info('request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Math.round(durationMs),
      userId: req.user?.userId ?? req.user?.id ?? null,
    });
  });
  next();
}

export default logger;
