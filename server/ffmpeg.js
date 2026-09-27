import fs from "fs";
import path from "path";
import { spawn, spawnSync } from "child_process";
import logger from "./logger.js";

const PROBE_TIMEOUT_MS = 5000;
const STDERR_TAIL_BYTES = 8 * 1024;

function probe(bin) {
  try {
    const res = spawnSync(bin, ["-version"], { timeout: PROBE_TIMEOUT_MS });
    const first = res.stdout?.toString().split("\n")[0] ?? "";
    const match = first.match(/ffmpeg version (\S+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function pathLookup() {
  try {
    const res = spawnSync("which", ["ffmpeg"], { timeout: 3000 });
    return res.stdout?.toString().trim().split("\n")[0] || null;
  } catch {
    return null;
  }
}

// FFMPEG_PATH wins when set; otherwise take the first working binary on the
// usual install paths.
function resolve() {
  if (process.env.FFMPEG_PATH) {
    return { path: process.env.FFMPEG_PATH, version: probe(process.env.FFMPEG_PATH) };
  }
  const candidates = [
    ...new Set(
      [
        pathLookup(),
        "/opt/homebrew/bin/ffmpeg",
        "/usr/local/bin/ffmpeg",
        "/usr/bin/ffmpeg",
      ].filter(Boolean),
    ),
  ];
  for (const bin of candidates) {
    if (!fs.existsSync(bin)) continue;
    const version = probe(bin);
    if (version) return { path: bin, version };
  }
  return { path: candidates.find((c) => fs.existsSync(c)) ?? "ffmpeg", version: null };
}

const resolved = resolve();
export const FFMPEG_BIN = resolved.path;
export const FFMPEG_VERSION = resolved.version;

// ffprobe ships alongside ffmpeg — needed to get the source duration so
// conversion can report a percentage instead of spinning blind.
const FFPROBE_BIN = (() => {
  const candidates = [
    process.env.FFPROBE_PATH,
    (() => {
      try {
        return spawnSync("which", ["ffprobe"], { timeout: 3000 })
          .stdout?.toString().trim().split("\n")[0] || null;
      } catch {
        return null;
      }
    })(),
    path.join(path.dirname(FFMPEG_BIN), "ffprobe"),
    "/opt/homebrew/bin/ffprobe",
    "/usr/local/bin/ffprobe",
    "/usr/bin/ffprobe",
  ].filter(Boolean);
  return candidates.find((c) => fs.existsSync(c)) ?? null;
})();

function probeDurationSeconds(file) {
  if (!FFPROBE_BIN) return null;
  try {
    const res = spawnSync(
      FFPROBE_BIN,
      ["-v", "error", "-show_entries", "format=duration",
       "-of", "default=noprint_wrappers=1:nokey=1", file],
      { timeout: 10000 },
    );
    const s = parseFloat(res.stdout?.toString().trim());
    return Number.isFinite(s) && s > 0 ? s : null;
  } catch {
    return null;
  }
}

if (!resolved.version) {
  logger.warn("ffmpeg not found — video downloads will fail until it is installed", {
    bin: FFMPEG_BIN,
  });
} else {
  logger.debug("ffmpeg resolved", { bin: FFMPEG_BIN, version: resolved.version });
}

// Izzy's iPod runs Rockbox, whose mpegplayer only understands MPEG-1/2 program
// streams — H.264/MP4 files silently won't play there. Encode MPEG-2 video +
// MPEG layer-2 audio (always built into ffmpeg, unlike libmp3lame) scaled to
// fit the 320×240 screen, fps capped at 30 so decode stays smooth on the old
// hardware.
export async function convertForIpod(input, output, meta = {}, onProgress = null) {
  const vf =
    "scale=320:240:force_original_aspect_ratio=decrease:force_divisible_by=2,fps=30";
  const durationUs = onProgress
    ? (() => {
        const s = probeDurationSeconds(input);
        return s ? s * 1_000_000 : null;
      })()
    : null;
  const args = [
    "-hide_banner",
    "-nostdin",
    "-loglevel", "error",
    "-nostats",
    "-progress", "pipe:1",
    "-y",
    "-i", input,
    "-vf", vf,
    "-c:v", "mpeg2video",
    "-b:v", "1000k",
    "-maxrate", "1500k",
    "-bufsize", "4M",
    "-c:a", "mp2",
    "-b:a", "160k",
    "-ar", "44100",
    "-ac", "2",
  ];
  if (meta.title) args.push("-metadata", `title=${meta.title}`);
  if (meta.artist) args.push("-metadata", `artist=${meta.artist}`);
  args.push("-f", "mpeg", output);

  try {
    await runFfmpeg(args, 30 * 60 * 1000, durationUs ? onProgress : null, durationUs);
  } catch (err) {
    throw new Error(`ffmpeg conversion failed: ${err.message}`, { cause: err });
  }
}

// execFile's buffered stderr can't survive a long encode — even at
// -loglevel error a damaged stream emits thousands of decoder lines. Stream it
// instead and keep only the tail for diagnostics. Progress lines land on
// stdout (-progress pipe:1); out_time_* values are microseconds.
function runFfmpeg(args, timeoutMs, onProgress, durationUs) {
  return new Promise((resolve, reject) => {
    const child = spawn(FFMPEG_BIN, args, {
      stdio: ["ignore", "pipe", "pipe"],
      timeout: timeoutMs,
    });
    let stderrTail = "";
    child.stderr.on("data", (chunk) => {
      stderrTail = (stderrTail + chunk.toString()).slice(-STDERR_TAIL_BYTES);
    });
    // stdout always carries -progress lines — drain it even without a callback
    // so the pipe buffer can't fill and stall the encode.
    child.stdout.on("data", (chunk) => {
      if (!onProgress || !durationUs) return;
      for (const line of chunk.toString().split("\n")) {
        const m = line.match(/^out_time_(?:us|ms)=(\d+)/);
        if (m) onProgress(Math.min(100, (parseInt(m[1], 10) / durationUs) * 100));
      }
    });
    child.on("error", reject);
    child.on("close", (code, signal) => {
      if (code === 0) return resolve();
      const why = signal ? `terminated by ${signal}` : `exit code ${code}`;
      const tail = stderrTail.trim().split("\n").slice(-4).join("\n").trim();
      reject(new Error(`ffmpeg ${why}${tail ? ` — ${tail}` : ""}`));
    });
  });
}
