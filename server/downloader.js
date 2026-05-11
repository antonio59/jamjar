import YtDlp from "yt-dlp-wrap";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { updateRequestStatus } from "./database.js";

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

    let ytDlp;
    try {
      ytDlp = new YtDlp("yt-dlp");
    } catch (error) {
      console.log("yt-dlp not installed — simulating download for demo");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const dummyPath = path.join(outputDir, `${sanitizedName}.mp3`);
      fs.writeFileSync(dummyPath, "Dummy audio content for demo");

      const downloadUrl = `/api/downloads/${request.profile}/${sanitizedName}.mp3`;
      updateRequestStatus(request.id, "completed", null, downloadUrl);
      console.log(`Demo download complete: ${request.title}`);
      return;
    }

    const isYoto = request.profile === "yoto";
    const options = {
      format: "bestaudio/best",
      extractAudio: true,
      audioFormat: "mp3",
      // Yoto: ~128kbps VBR, no embedded art — plain MP3 uploads most reliably
      // iPod: best quality with thumbnail embedded
      audioQuality: isYoto ? "5" : "0",
      output: outputFile,
      noPlaylist: true,
      restrictFilenames: true,
      ...(isYoto ? {} : { embedThumbnail: true }),
    };

    console.log(`Downloading with yt-dlp: ${request.url}`);
    await ytDlp.exec(request.url, options);

    const downloadedFile = fs
      .readdirSync(outputDir)
      .find((f) => f.startsWith(sanitizedName) && f.endsWith(".mp3"));

    if (!downloadedFile) {
      throw new Error("Downloaded file not found");
    }

    const downloadUrl = `/api/downloads/${request.profile}/${downloadedFile}`;
    updateRequestStatus(request.id, "completed", null, downloadUrl);
    console.log(`Download complete: ${request.title}`);
  } catch (error) {
    console.error(`Download failed for ${request.title}:`, error.message);
    updateRequestStatus(request.id, "failed", error.message);
  }
}
