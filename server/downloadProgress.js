import { publishRequestChange } from './requestEvents.js';

// Live download progress — kept in memory (never the DB) and fanned out over
// SSE as lightweight 'progress' events, so the dashboard can animate a bar
// without refetching the request list on every tick.
const live = new Map(); // requestId -> { stage, percent, eta }
const lastSent = new Map(); // requestId -> { stage, at }

export function reportProgress(requestId, profile, stage, percent, eta = null) {
  const entry = {
    stage,
    percent: percent == null ? null : Math.min(100, Math.round(percent)),
    eta,
  };
  live.set(requestId, entry);
  const last = lastSent.get(requestId);
  const now = Date.now();
  const stageChanged = !last || last.stage !== stage;
  const due = !last || now - last.at >= 1000;
  if (!stageChanged && !due && entry.percent !== 100) return;
  lastSent.set(requestId, { stage, at: now });
  publishRequestChange({
    type: 'progress',
    requestId,
    profile,
    stage,
    percent: entry.percent,
    eta,
  });
}

export function clearProgress(requestId) {
  live.delete(requestId);
  lastSent.delete(requestId);
}

export function getProgress(requestId) {
  return live.get(requestId) || null;
}
