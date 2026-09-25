import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { updateRequestStatus, findCompletedTrackFile } from "./database.js";
import { createYtDlp, baseArgs, YTDLP_BIN } from "./ytdlp.js";
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

export async function downloadAndUpload(request) {
  try {
    updateRequestStatus(request.id, "downloading");
    logger.info("download started", { requestId: request.id, title: request.title });

    // Same track already in this device's library → point at the existing file
    // instead of downloading a second copy. Cross-device dupes still download —
    // yoto (128k CBR) and ipod (best quality) are different encodings.
    const sibling = findCompletedTrackFile(request.track_key, request.profile);
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

    const outputDir = request.profile === "yoto" ? yotoDir : ipodDir;
    // Library naming: "Artist - Title.mp3", numbered on collision.
    const fileName = uniqueFileName(outputDir, cleanBaseName(request.title));
    const outputFile = path.join(
      outputDir,
      fileName.replace(/\.mp3$/, ".%(ext)s"),
    );

    const isYoto = request.profile === "yoto";

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
