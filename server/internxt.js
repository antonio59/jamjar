import axios from 'axios';
import crypto from 'crypto';

const INTERNXT_EMAIL = process.env.INTERNXT_EMAIL || '';
const INTERNXT_PASSWORD = process.env.INTERNXT_PASSWORD || '';
const INTERNXT_APP_KEY = process.env.INTERNXT_APP_KEY || '';

// Internxt API endpoints
const BASE_URL = 'https://gateway.internxt.com';

let authToken = null;
let tokenExpiry = 0;

async function getAuthToken() {
  if (authToken && Date.now() < tokenExpiry) {
    return authToken;
  }

  if (!INTERNXT_EMAIL || !INTERNXT_PASSWORD) {
    console.warn('Internxt credentials not configured — using mock URLs');
    return null;
  }

  try {
    // Internxt uses a custom auth flow — this is simplified
    // In production, use the official @internxt/sdk
    const response = await axios.post(`${BASE_URL}/api/auth`, {
      email: INTERNXT_EMAIL,
      password: INTERNXT_PASSWORD,
      tfa: null,
    });

    authToken = response.data.token;
    tokenExpiry = Date.now() + (response.data.exp * 1000);
    return authToken;
  } catch (error) {
    console.error('Internxt auth failed:', error.message);
    return null;
  }
}

export async function uploadToInternxt(filePath, fileName, profile) {
  // If credentials not configured, return mock URL
  if (!INTERNXT_EMAIL) {
    return `https://drive.internxt.com/downloads/${profile}/${fileName}`;
  }

  try {
    const token = await getAuthToken();
    if (!token) {
      return `https://drive.internxt.com/downloads/${profile}/${fileName}`;
    }

    // In production: upload file using Internxt SDK
    // This requires the full SDK with encryption handling
    // For now, return a placeholder
    console.log(`Would upload ${filePath} to Internxt folder: ${profile}`);
    return `https://drive.internxt.com/downloads/${profile}/${fileName}`;
  } catch (error) {
    console.error('Internxt upload failed:', error.message);
    throw error;
  }
}

export async function createFolder(folderName) {
  // Create folder in Internxt for organizing downloads
  if (!INTERNXT_EMAIL) return null;

  try {
    const token = await getAuthToken();
    if (!token) return null;

    // Would use Internxt SDK to create folder
    console.log(`Would create Internxt folder: ${folderName}`);
    return folderName;
  } catch (error) {
    console.error('Failed to create Internxt folder:', error.message);
    return null;
  }
}
