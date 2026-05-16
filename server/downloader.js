import YtDlpModule from "yt-dlp-wrap";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { updateRequestStatus } from "./database.js";

// Node.js ESM/CJS interop: yt-dlp-wrap ships CJS with exports.default = YTDlpWrap
// so the default import is the module namespace object, not the class directly
const YtDlp = YtDlpModule.default ?? YtDlpModule;
const YTDLP_BIN = process.env.YTDLP_PATH || "/usr/local/bin/yt-dlp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOWNLOAD_DIR =
  process.env.DOWNLOAD_DIR || path.join(__dirname, "../downloads");

const yotoDir = path.join(DOWNLOAD_DIR, "yoto");
const ipodDir = path.join(DOWNLOAD_DIR, "ipod");

if (!fs.existsSync(yotoDir)) fs.mkdirSync(yotoDir, { recursive: true });
if (!fs.existsSync(ipodDir)) fs.mkdirSync(ipodDir, { recursive: true });

export async function downloadAndUpload(request) {
  try {
    updateRequestStatus(request.id, "downloading");
    console.log(`Starting download: ${request.title}`);

    const outputDir = request.profile === "yoto" ? yotoDir : ipodDir;
    const sanitizedName = request.title
      .replace(/[^a-z0-9]/gi, "_")
      .substring(0, 50);
    const outputFile = path.join(outputDir, `${sanitizedName}.%(ext)s`);

    const isYoto = request.profile === "yoto";

    const ytDlp = new YtDlp(YTDLP_BIN);

        const nodebin = process.execPath; // use the same node binary running this server
    const cookiesFile = process.env.YTDLP_COOKIES_FILE;

    // Build CLI args array — yt-dlp-wrap.exec() takes string[], not an options object
    const args = [
      request.url,
      "-f", "bestaudio/best",
      "-x",
      "--audio-format", "mp3",
      "--audio-quality", isYoto ? "5" : "0",
      "-o", outputFile,
      "--no-playlist",
      "--restrict-filenames",
      // Use Node.js for PO-token generation so YouTube doesn't block as bot
      "--js-runtimes", `node:${nodebin}`,
    ];

    if (cookiesFile && fs.existsSync(cookiesFile)) {
      args.push("--cookies", cookiesFile);
    }

    if (isYoto) {
      // CBR 128kbps, 44.1kHz stereo, clean ID3v2.3 tags — Yoto player compatibility
      args.push("--postprocessor-args", "ffmpeg:-b:a 128k -ar 44100 -ac 2 -id3v2_version 3 -write_id3v1 1");
    } else {
      args.push("--embed-thumbnail");
    }

    console.log(`Downloading with yt-dlp [${YTDLP_BIN}]: ${request.url}`);
    await ytDlp.execPromise(args);

    // Find the output file — yt-dlp uses the sanitized name as the base
    const downloadedFile = fs
      .readdirSync(outputDir)
      .find((f) => f.startsWith(sanitizedName) && f.endsWith(".mp3"));

    if (!downloadedFile) {
      throw new Error("Downloaded file not found after yt-dlp completed");
    }

    // Reject suspiciously small files (dummy/corrupt downloads)
    const filePath = path.join(outputDir, downloadedFile);
    const stat = fs.statSync(filePath);
    if (stat.size < 1024) {
      fs.unlinkSync(filePath);
      throw new Error("Downloaded file is too small — likely a corrupt or blocked video");
    }

    const downloadUrl = `/api/downloads/${request.profile}/${downloadedFile}`;
    updateRequestStatus(request.id, "completed", null, downloadUrl);
    console.log(`Download complete: ${request.title} (${Math.round(stat.size / 1024)}KB)`);
  } catch (error) {
    console.error(`Download failed for ${request.title}:`, error.message);
    updateRequestStatus(request.id, "failed", error.message);
  }
}
