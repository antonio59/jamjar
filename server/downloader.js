import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { updateRequestStatus, findCompletedTrackFile } from "./database.js";
import { createYtDlp, baseArgs, YTDLP_BIN } from "./ytdlp.js";
import { convertForIpod } from "./ffmpeg.js";
import {
  cleanBaseName,
  normalizeTitle,
  splitArtistTitle,
  uniqueFileName,
} from "./trackIdentity.js";
import logger from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOWNLOAD_DIR =
  process.env.DOWNLOAD_DIR || path.join(__dirname, "../downloads");

const yotoDir = path.join(DOWNLOAD_DIR, "yoto");
const ipodDir = path.join(DOWNLOAD_DIR, "ipod");

if (!fs.existsSync(yotoDir)) fs.mkdirSync(yotoDir, { recursive: true });
if (!fs.existsSync(ipodDir)) fs.mkdirSync(ipodDir, { recursive: true });

// ID3 tag values are cosmetic — strip quotes/backslashes so they survive
// yt-dlp's shlex parsing of postprocessor-args, then quote for safety.
const tagSafe = (s) => (s || "").replace(/["'`\\$]/g, "").trim();

function metadataArgs(request) {
  const cleaned = normalizeTitle(request.title, request.title || "");
  const { artist, trackTitle } = splitArtistTitle(cleaned);
  const artistTag = tagSafe(request.artist || artist);
  const args = [`-metadata "title=${tagSafe(trackTitle || cleaned)}"`];
  if (artistTag) args.push(`-metadata "artist=${artistTag}"`);
  return args.join(" ");
}

function requestTags(request) {
  const cleaned = normalizeTitle(request.title, request.title || "");
  const { artist, trackTitle } = splitArtistTitle(cleaned);
  return {
    title: tagSafe(trackTitle || cleaned),
    artist: tagSafe(request.artist || artist),
  };
}

async function downloadAudio(request, outputDir, fileName, isYoto) {
  const outputFile = path.join(
    outputDir,
    fileName.replace(/\.mp3$/, ".%(ext)s"),
  );

  const ytDlp = createYtDlp();

  // Build CLI args array — yt-dlp-wrap.exec() takes string[], not an options object
  const args = [
    request.url,
    "-f", "bestaudio/best",
    "-x",
    "--audio-format", "mp3",
    "--audio-quality", isYoto ? "5" : "0",
    "-o", outputFile,
    "--no-playlist",
    ...baseArgs(),
  ];

  const meta = metadataArgs(request);
  if (isYoto) {
    // CBR 128kbps, 44.1kHz stereo, clean ID3v2.3 tags — Yoto player compatibility
    args.push(
      "--postprocessor-args",
      `ffmpeg:-b:a 128k -ar 44100 -ac 2 -id3v2_version 3 -write_id3v1 1 ${meta}`,
    );
  } else {
    args.push("--embed-thumbnail", "--postprocessor-args", `ffmpeg:${meta}`);
  }

  logger.info("yt-dlp invoked", { bin: YTDLP_BIN, url: request.url });
  await ytDlp.execPromise(args);
}

// Video requests land on the iPod as MPEG-2 .mpg — the only thing Rockbox's
// mpegplayer reads. yt-dlp grabs a source file (prefer ≤720p/≤30fps — plenty
// for a 320×240 screen and keeps the transcode quick), then ffmpeg converts it.
async function downloadVideo(request, outputDir, fileName) {
  const srcBase = fileName.replace(/\.mpg$/, "");
  const srcPattern = path.join(outputDir, `${srcBase}.src.%(ext)s`);

  // Clear any source leftover from a crashed earlier attempt so the lookup
  // below can't pick a stale container over the fresh download.
  for (const f of fs.readdirSync(outputDir)) {
    if (f.startsWith(`${srcBase}.src.`)) {
      try {
        fs.unlinkSync(path.join(outputDir, f));
      } catch {}
    }
  }

  const ytDlp = createYtDlp();
  const args = [
    request.url,
    "-f", "bv*[height<=720][fps<=30]+ba/b[height<=720][fps<=30]/bv*[height<=720]+ba/b[height<=720]/b",
    "-o", srcPattern,
    "--no-playlist",
    ...baseArgs(),
  ];

  logger.info("yt-dlp invoked (video)", { bin: YTDLP_BIN, url: request.url });
  await ytDlp.execPromise(args);

  // yt-dlp resolves %(ext)s itself — find whatever container it landed in
  const srcName = fs
    .readdirSync(outputDir)
    .find((f) => f.startsWith(`${srcBase}.src.`));
  if (!srcName) {
    throw new Error("Downloaded video source not found after yt-dlp completed");
  }
  const srcPath = path.join(outputDir, srcName);

  try {
    logger.info("converting video for iPod", { requestId: request.id });
    await convertForIpod(
      srcPath,
      path.join(outputDir, fileName),
      requestTags(request),
    );
  } finally {
    try {
      fs.unlinkSync(srcPath);
    } catch {}
  }
}

export async function downloadAndUpload(request) {
  try {
    updateRequestStatus(request.id, "downloading");
    logger.info("download started", { requestId: request.id, title: request.title });

    const isVideo = request.type === "video";
    const isYoto = request.profile === "yoto";

    // Same track already in this device's library → point at the existing file
    // instead of downloading a second copy. Cross-device dupes still download —
    // yoto (128k CBR) and ipod (best quality) are different encodings, and a
    // music MP3 can't stand in for a video request (type is part of the match).
    const sibling = findCompletedTrackFile(
      request.track_key,
      request.profile,
      request.type,
    );
    if (sibling?.file_path) {
      const siblingPath = path.join(
        DOWNLOAD_DIR,
        sibling.file_path.replace("/api/downloads/", ""),
      );
      if (fs.existsSync(siblingPath)) {
        const size = sibling.file_size_bytes ?? fs.statSync(siblingPath).size;
        updateRequestStatus(request.id, "completed", null, sibling.file_path, size);
        logger.info("reused existing file for duplicate track", {
          requestId: request.id,
          title: request.title,
          file: sibling.file_path,
        });
        return;
      }
    }

    const outputDir = isYoto ? yotoDir : ipodDir;
    // Library naming: "Artist - Title.<ext>", numbered on collision.
    const fileName = uniqueFileName(
      outputDir,
      cleanBaseName(request.title),
      isVideo ? "mpg" : "mp3",
    );

    if (isVideo) {
      await downloadVideo(request, outputDir, fileName);
    } else {
      await downloadAudio(request, outputDir, fileName, isYoto);
    }

    // We chose the name up front — verify it rather than guessing from a listing
    const filePath = path.join(outputDir, fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error("Downloaded file not found after yt-dlp completed");
    }

    // Reject suspiciously small files (dummy/corrupt downloads)
    const stat = fs.statSync(filePath);
    if (stat.size < 1024) {
      fs.unlinkSync(filePath);
      throw new Error("Downloaded file is too small — likely a corrupt or blocked video");
    }

    const downloadUrl = `/api/downloads/${request.profile}/${fileName}`;
    updateRequestStatus(request.id, "completed", null, downloadUrl, stat.size);
    logger.info("download complete", {
      requestId: request.id,
      title: request.title,
      kilobytes: Math.round(stat.size / 1024),
    });
  } catch (error) {
    logger.error("download failed", {
      requestId: request.id,
      title: request.title,
      error: error.message,
    });
    updateRequestStatus(request.id, "failed", error.message);
  }
}
