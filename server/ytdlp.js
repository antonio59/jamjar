import YtDlpModule from "yt-dlp-wrap";
import fs from "fs";
import { spawnSync } from "child_process";
import logger from "./logger.js";

// Node.js ESM/CJS interop: yt-dlp-wrap ships CJS with exports.default = YTDlpWrap
// so the default import is the module namespace object, not the class directly
const YtDlp = YtDlpModule.default ?? YtDlpModule;

const PROBE_TIMEOUT_MS = 5000;
// YouTube changes constantly and breaks old extractors — a stale binary is the
// most common cause of every download failing at once. Warn past this age.
const STALE_AFTER_DAYS = 120;

function probeVersion(bin) {
  try {
    const res = spawnSync(bin, ["--version"], { timeout: PROBE_TIMEOUT_MS });
    const text = res.stdout?.toString().trim() ?? "";
    const match = text.match(/(\d{4})\.(\d{2})\.(\d{2})/);
    if (!match) return null;
    return {
      version: match[0],
      date: Date.parse(`${match[1]}-${match[2]}-${match[3]}T00:00:00Z`),
    };
  } catch {
    return null;
  }
}

function pathLookup() {
  try {
    const res = spawnSync("which", ["yt-dlp"], { timeout: 3000 });
    return res.stdout?.toString().trim().split("\n")[0] || null;
  } catch {
    return null;
  }
}

// YTDLP_PATH wins when set; otherwise probe every candidate and keep the newest
// working binary. Old installs (pip stubs, stray /usr/local copies) silently
// shadow a good one, so "exists" isn't enough — it has to report a version.
function resolve() {
  if (process.env.YTDLP_PATH) {
    const info = probeVersion(process.env.YTDLP_PATH);
    return { path: process.env.YTDLP_PATH, version: info?.version ?? null, date: info?.date ?? null };
  }
  const candidates = [
    ...new Set(
      [
        pathLookup(),
        "/opt/homebrew/bin/yt-dlp",
        "/usr/local/bin/yt-dlp",
        "/usr/bin/yt-dlp",
      ].filter(Boolean),
    ),
  ];
  let best = null;
  for (const bin of candidates) {
    if (!fs.existsSync(bin)) continue;
    const info = probeVersion(bin);
    if (!info) continue;
    if (!best || info.date > best.date) best = { path: bin, ...info };
  }
  if (best) return best;
  return {
    path: candidates.find((c) => fs.existsSync(c)) ?? "/usr/local/bin/yt-dlp",
    version: null,
    date: null,
  };
}

const resolved = resolve();
export const YTDLP_BIN = resolved.path;
export const YTDLP_VERSION = resolved.version;

const ageDays = resolved.date
  ? Math.round((Date.now() - resolved.date) / 86400000)
  : null;
if (!resolved.version || ageDays > STALE_AFTER_DAYS) {
  logger.warn("yt-dlp may be stale — downloads can fail as YouTube changes", {
    bin: YTDLP_BIN,
    version: resolved.version,
    ageDays,
  });
} else {
  logger.debug("yt-dlp resolved", { bin: YTDLP_BIN, version: resolved.version });
}

export function createYtDlp() {
  return new YtDlp(YTDLP_BIN);
}

// Args every yt-dlp invocation needs: PO-token generation through the same Node
// binary running the server, plus cookies when configured.
export function baseArgs() {
  const args = ["--js-runtimes", `node:${process.execPath}`];
  const cookiesFile = process.env.YTDLP_COOKIES_FILE;
  if (cookiesFile && fs.existsSync(cookiesFile)) {
    args.push("--cookies", cookiesFile);
  }
  return args;
}
