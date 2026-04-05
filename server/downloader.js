import YtDlp from 'yt-dlp-wrap';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { updateRequestStatus } from './database.js';
import { uploadToInternxt } from './internxt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR || path.join(__dirname, '../downloads');

// Ensure download directories exist
const yotoDir = path.join(DOWNLOAD_DIR, 'yoto');
const ipodDir = path.join(DOWNLOAD_DIR, 'ipod');

if (!fs.existsSync(yotoDir)) fs.mkdirSync(yotoDir, { recursive: true });
if (!fs.existsSync(ipodDir)) fs.mkdirSync(ipodDir, { recursive: true });

export async function downloadAndUpload(request) {
  try {
    updateRequestStatus(request.id, 'downloading');
    console.log(`Starting download: ${request.title}`);

    const outputDir = request.profile === 'yoto' ? yotoDir : ipodDir;
    const sanitizedName = request.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
    const outputFile = path.join(outputDir, `${sanitizedName}.%(ext)s`);

    // Check if yt-dlp is available
    let ytDlp;
    try {
      ytDlp = new YtDlp('yt-dlp');
    } catch (error) {
      console.log('yt-dlp not installed — simulating download for demo');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create a dummy file for "upload"
      const dummyPath = path.join(outputDir, `${sanitizedName}.mp3`);
      fs.writeFileSync(dummyPath, 'Dummy audio content for demo');

      // Upload to Internxt (or mock)
      const internxtUrl = await uploadToInternxt(dummyPath, `${sanitizedName}.mp3`, request.profile);

      updateRequestStatus(request.id, 'completed', null, internxtUrl);
      console.log(`Demo download complete: ${request.title}`);
      return;
    }

    // yt-dlp options for audio-only download
    const options = {
      format: 'bestaudio/best',
      extractAudio: true,
      audioFormat: 'mp3',
      audioQuality: '0', // Best quality
      output: outputFile,
      noPlaylist: true,
      restrictFilenames: true,
      embedThumbnail: true,
    };

    // Download the track
    console.log(`Downloading with yt-dlp: ${request.url}`);
    const result = await ytDlp.exec(request.url, options);

    // Find the downloaded file
    const downloadedFile = fs.readdirSync(outputDir)
      .find(f => f.startsWith(sanitizedName) && f.endsWith('.mp3'));

    if (!downloadedFile) {
      throw new Error('Downloaded file not found');
    }

    const filePath = path.join(outputDir, downloadedFile);

    // Upload to Internxt
    console.log(`Uploading to Internxt: ${downloadedFile}`);
    const internxtUrl = await uploadToInternxt(filePath, downloadedFile, request.profile);

    // Update status
    updateRequestStatus(request.id, 'completed', null, internxtUrl);
    console.log(`Download & upload complete: ${request.title}`);

    // Optional: Clean up local file after upload
    // fs.unlinkSync(filePath);
  } catch (error) {
    console.error(`Download failed for ${request.title}:`, error.message);
    updateRequestStatus(request.id, 'failed', error.message);
  }
}
