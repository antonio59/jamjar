import { downloadAndUpload } from "./downloader.js";
import logger from "./logger.js";

const MAX_CONCURRENT = Math.max(
  1,
  parseInt(process.env.MAX_CONCURRENT_DOWNLOADS || "2", 10) || 2,
);

const pending = [];
const active = new Set();

function pump() {
  while (active.size < MAX_CONCURRENT && pending.length > 0) {
    const request = pending.shift();
    active.add(request.id);
    downloadAndUpload(request)
      .catch((err) =>
            logger.error("download worker error", {
              requestId: request.id,
              error: err.message,
            }),
          )
      .finally(() => {
        active.delete(request.id);
        pump();
      });
  }
}

// Queues a download, capping how many yt-dlp processes run at once. Waiting
// requests keep their "approved" status until a worker slot frees up.
export function enqueueDownload(request) {
  if (active.has(request.id) || pending.some((r) => r.id === request.id)) {
    return { queued: false, reason: "already queued" };
  }
  pending.push(request);
  pump();
  return { queued: true, position: pending.length };
}

export function queueStatus() {
  return { active: active.size, pending: pending.length, max: MAX_CONCURRENT };
}
