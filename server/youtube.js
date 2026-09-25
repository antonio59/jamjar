import axios from 'axios';
import { createYtDlp, baseArgs } from './ytdlp.js';
import { applyCleanFilter, isCleanTitle } from './cleanFilter.js';
import { judgeCleanVersions, typesafeEnabled, cleanThreshold } from './typesafe.js';
import logger from './logger.js';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';

// Mock results for when API key is not configured
const mockMusicResults = [
  { id: '1', title: 'Happy - Pharrell Williams', url: 'https://youtube.com/watch?v=ZbZSe6N_BXs', thumbnail: 'https://img.youtube.com/vi/ZbZSe6N_BXs/mqdefault.jpg', duration: '3:53' },
  { id: '2', title: 'Count on Me - Bruno Mars', url: 'https://youtube.com/watch?v=Fe6kYjdFmZQ', thumbnail: 'https://img.youtube.com/vi/Fe6kYjdFmZQ/mqdefault.jpg', duration: '3:17' },
  { id: '3', title: 'Roar - Katy Perry', url: 'https://youtube.com/watch?v=CevxZvSJLk8', thumbnail: 'https://img.youtube.com/vi/CevxZvSJLk8/mqdefault.jpg', duration: '3:43' },
  { id: '4', title: 'Shake It Off - Taylor Swift', url: 'https://youtube.com/watch?v=nfWlot6h_JM', thumbnail: 'https://img.youtube.com/vi/nfWlot6h_JM/mqdefault.jpg', duration: '3:39' },
  { id: '5', title: 'Let It Go - Frozen', url: 'https://youtube.com/watch?v=moSFlvxnbgk', thumbnail: 'https://img.youtube.com/vi/moSFlvxnbgk/mqdefault.jpg', duration: '3:44' },
  { id: '6', title: 'Try Everything - Zootopia', url: 'https://youtube.com/watch?v=cwmNwN_-3CE', thumbnail: 'https://img.youtube.com/vi/cwmNwN_-3CE/mqdefault.jpg', duration: '3:16' },
  { id: '7', title: 'A Whole New World - Aladdin', url: 'https://youtube.com/watch?v=i45pavjCVrY', thumbnail: 'https://img.youtube.com/vi/i45pavjCVrY/mqdefault.jpg', duration: '2:42' },
  { id: '8', title: 'How Far I\'ll Go - Moana', url: 'https://youtube.com/watch?v=cPAbx5kgCJo', thumbnail: 'https://img.youtube.com/vi/cPAbx5kgCJo/mqdefault.jpg', duration: '2:55' },
];

const mockAudiobookResults = [
  { id: '9', title: 'Charlotte\'s Web (Audiobook)', url: 'https://youtube.com/watch?v=audiobook1', thumbnail: 'https://img.youtube.com/vi/default/mqdefault.jpg', duration: '2:30:00' },
  { id: '10', title: 'The Lion, the Witch and the Wardrobe', url: 'https://youtube.com/watch?v=audiobook2', thumbnail: 'https://img.youtube.com/vi/default/mqdefault.jpg', duration: '3:15:00' },
  { id: '11', title: 'Harry Potter and the Philosopher\'s Stone', url: 'https://youtube.com/watch?v=audiobook3', thumbnail: 'https://img.youtube.com/vi/default/mqdefault.jpg', duration: '8:46:00' },
  { id: '12', title: 'Matilda (Audiobook)', url: 'https://youtube.com/watch?v=audiobook4', thumbnail: 'https://img.youtube.com/vi/default/mqdefault.jpg', duration: '4:29:00' },
  { id: '13', title: 'The BFG (Audiobook)', url: 'https://youtube.com/watch?v=audiobook5', thumbnail: 'https://img.youtube.com/vi/default/mqdefault.jpg', duration: '5:53:00' },
];

// Detect if URL is a playlist
export function isPlaylistUrl(url) {
  return url.includes('playlist?') || url.includes('list=');
}

// Extract playlist ID from URL
export function extractPlaylistId(url) {
  const match = url.match(/[?&]list=([^&]+)/);
  return match ? match[1] : null;
}

// Get playlist tracks using yt-dlp
export async function getPlaylistTracks(playlistUrl) {
  try {
    const ytDlp = createYtDlp();

    // Metadata only — one JSON document for the whole playlist, no download
    const stdout = await ytDlp.execPromise([
      playlistUrl,
      '--dump-single-json',
      '--flat-playlist',
      '--yes-playlist',
      '--no-warnings',
      ...baseArgs(),
    ]);

    const data = JSON.parse(stdout);

    return (data.entries || []).map((entry, index) => ({
      id: entry.id,
      title: entry.title,
      url: `https://youtube.com/watch?v=${entry.id}`,
      thumbnail: entry.thumbnails?.[0]?.url || `https://img.youtube.com/vi/${entry.id}/mqdefault.jpg`,
      duration: entry.duration ? formatDuration(Math.round(entry.duration)) : 'Unknown',
      playlistIndex: index + 1,
      playlistTitle: data.title,
    }));
  } catch (error) {
    logger.error('playlist fetch failed', { error: error.message });
    return [];
  }
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

function parseIsoDuration(iso) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  const h = parseInt(match[1] || 0);
  const m = parseInt(match[2] || 0);
  const s = parseInt(match[3] || 0);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// One YouTube Data API search plus the batched contentDetails lookup that
// gives us duration and the age-restriction rating.
async function youtubeApiSearch(query, type) {
  const searchResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
    params: {
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: 10,
      safeSearch: 'strict',
      videoDuration: type === 'music' ? 'short' : 'long',
      key: YOUTUBE_API_KEY,
    },
  });

  const items = searchResponse.data.items || [];
  if (items.length === 0) return [];
  const videoIds = items.map(item => item.id.videoId).join(',');

  const durationMap = {};
  const ratingMap = {};
  try {
    const detailsResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: { part: 'contentDetails', id: videoIds, key: YOUTUBE_API_KEY },
    });
    for (const v of detailsResponse.data.items) {
      durationMap[v.id] = parseIsoDuration(v.contentDetails.duration) || '';
      ratingMap[v.id] = v.contentDetails.contentRating?.ytRating || null;
    }
  } catch {
    // Details fetch failed — continue without duration/rating
  }

  return items.map(item => ({
    id: item.id.videoId,
    title: decodeHtmlEntities(item.snippet.title),
    url: `https://youtube.com/watch?v=${item.id.videoId}`,
    thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
    duration: durationMap[item.id.videoId] || '',
    ytRating: ratingMap[item.id.videoId] || null,
  }));
}

// Regex labels handle labelled explicit/clean cuts; Jev then judges the
// unlabelled middle ground. Results with real evidence of explicit content are
// dropped; unscored results pass through — silence isn't evidence. Skipped
// entirely for parents browsing explicit results and for audiobooks.
async function refineWithTypesafe(results, query, { allowExplicit, type }) {
  if (allowExplicit || type === 'audiobook' || !typesafeEnabled() || results.length === 0) {
    return results;
  }
  const scores = await judgeCleanVersions(query, results);
  if (!scores) return results;
  const threshold = cleanThreshold();
  return results
    .map((r) => ({ ...r, cleanScore: scores.get(r.id) ?? null }))
    .filter((r) => r.cleanScore == null || r.isCleanLabelled || r.cleanScore >= threshold)
    .sort(
      (a, b) =>
        Number(b.isCleanLabelled) - Number(a.isCleanLabelled) ||
        (b.cleanScore ?? 0) - (a.cleanScore ?? 0),
    );
}

export async function searchYouTube(query, type = 'music', { allowExplicit = false } = {}) {
  // If query is a YouTube URL, check if it's a playlist
  if (query.includes('youtube.com') || query.includes('youtu.be')) {
    if (isPlaylistUrl(query)) {
      const tracks = await getPlaylistTracks(query);
      const filtered = await refineWithTypesafe(
        applyCleanFilter(tracks, { allowExplicit }),
        query,
        { allowExplicit, type },
      );
      return filtered.map(t => ({
        ...t,
        isPlaylist: true,
        playlistTrackCount: tracks.length,
      }));
    }
    
    // Single video URL — fetch real title via oEmbed
    const videoId = query.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1];
    if (videoId) {
      const safeUrl = `https://www.youtube.com/watch?v=${videoId}`;
      let title = '';
      try {
        const oEmbed = await axios.get('https://www.youtube.com/oembed', {
          params: { url: safeUrl, format: 'json' },
          timeout: 5000,
        });
        title = decodeHtmlEntities(oEmbed.data.title || '');
      } catch {
        // oEmbed failed — title stays empty, frontend will show URL or fallback
      }
      return refineWithTypesafe(
        applyCleanFilter([{
          id: videoId,
          title,
          url: safeUrl,
          thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          duration: 'Unknown',
        }], { allowExplicit }),
        title || query,
        { allowExplicit, type },
      );
    }
  }

  // If YouTube API key is configured, use real API
  if (YOUTUBE_API_KEY) {
    try {
      let results = applyCleanFilter(await youtubeApiSearch(query, type), { allowExplicit });

      // Everything came back explicit — retry once asking YouTube directly for
      // the clean cut before giving the kid an empty result list.
      if (results.length === 0 && !allowExplicit && type === 'music' && !isCleanTitle(query)) {
        results = applyCleanFilter(
          await youtubeApiSearch(`${query} clean version`, type),
          { allowExplicit },
        );
      }

      return refineWithTypesafe(results, query, { allowExplicit, type });
    } catch (error) {
      logger.error('youtube api error', { error: error.message });
    }
  }
  
  // Fall back to mock data
  const mockResults = type === 'music' ? mockMusicResults : mockAudiobookResults;
  return refineWithTypesafe(
    applyCleanFilter(
      mockResults.filter(r => r.title.toLowerCase().includes(query.toLowerCase())),
      { allowExplicit },
    ),
    query,
    { allowExplicit, type },
  );
}
