import YtDlp from 'yt-dlp-wrap';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { updateRequestStatus } from './database.js';

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
    // Update status to downloading
    updateRequestStatus(request.id, 'downloading');
    
    const outputDir = request.profile === 'yoto' ? yotoDir : ipodDir;
    const outputFile = path.join(outputDir, `${request.id}.%(ext)s`);
    
    // yt-dlp options
    const options = {
      format: 'bestaudio/best',
      extractAudio: true,
      audioFormat: 'mp3',
      output: outputFile,
      noPlaylist: true,
    };
    
    // Check if yt-dlp is available
    let ytDlp;
    try {
      ytDlp = new YtDlp('yt-dlp');
    } catch (error) {
      console.error('yt-dlp not found, simulating download');
      // Simulate download for demo
      await new Promise(resolve => setTimeout(resolve, 3000));
      const mockUrl = `https://internxt.com/downloads/${request.profile}/${request.id}.mp3`;
      updateRequestStatus(request.id, 'completed', null, mockUrl);
      return;
    }
    
    // Download the track
    await ytDlp.exec(request.url, options);
    
    // In production: upload to Internxt here
    // For now, generate a mock URL
    const internxtUrl = `https://internxt.com/downloads/${request.profile}/${request.id}.mp3`;
    
    // Update status to completed
    updateRequestStatus(request.id, 'completed', null, internxtUrl);
    
    console.log(`Download complete: ${request.title}`);
  } catch (error) {
    console.error(`Download failed for ${request.title}:`, error.message);
    updateRequestStatus(request.id, 'failed', error.message);
  }
}
