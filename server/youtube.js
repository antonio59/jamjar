import axios from 'axios';
import YtDlp from 'yt-dlp-wrap';

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
    const ytDlp = new YtDlp('yt-dlp');
    
    // Get playlist info without downloading
    const result = await ytDlp.exec(playlistUrl, {
      dumpJson: true,
      extractFlat: true,
      noPlaylist: false,
    });
    
    const data = JSON.parse(result.stdout);
    
    return data.entries.map((entry, index) => ({
      id: entry.id,
      title: entry.title,
      url: `https://youtube.com/watch?v=${entry.id}`,
      thumbnail: entry.thumbnails?.[0]?.url || `https://img.youtube.com/vi/${entry.id}/mqdefault.jpg`,
      duration: entry.duration ? formatDuration(entry.duration) : 'Unknown',
      playlistIndex: index + 1,
      playlistTitle: data.title,
    }));
  } catch (error) {
    console.error('Failed to fetch playlist:', error.message);
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

export async function searchYouTube(query, type = 'music') {
  // If query is a YouTube URL, check if it's a playlist
  if (query.includes('youtube.com') || query.includes('youtu.be')) {
    if (isPlaylistUrl(query)) {
      const tracks = await getPlaylistTracks(query);
      return tracks.map(t => ({
        ...t,
        isPlaylist: true,
        playlistTrackCount: tracks.length,
      }));
    }
    
    // Single video URL - return as-is
    const videoId = query.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1];
    if (videoId) {
      return [{
        id: videoId,
        title: 'Video from URL',
        url: query,
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        duration: 'Unknown',
      }];
    }
  }

  // If YouTube API key is configured, use real API
  if (YOUTUBE_API_KEY) {
    try {
      const safeSearch = type === 'music' ? 'moderate' : 'strict';
      const searchResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          maxResults: 10,
          safeSearch,
          videoDuration: type === 'music' ? 'short' : 'long',
          key: YOUTUBE_API_KEY,
        },
      });

      const items = searchResponse.data.items;
      const videoIds = items.map(item => item.id.videoId).join(',');

      // Fetch durations in one batch call
      let durationMap = {};
      try {
        const detailsResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
          params: { part: 'contentDetails', id: videoIds, key: YOUTUBE_API_KEY },
        });
        for (const v of detailsResponse.data.items) {
          durationMap[v.id] = parseIsoDuration(v.contentDetails.duration) || '';
        }
      } catch {
        // Duration fetch failed — continue without it
      }

      return items.map(item => ({
        id: item.id.videoId,
        title: decodeHtmlEntities(item.snippet.title),
        url: `https://youtube.com/watch?v=${item.id.videoId}`,
        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        duration: durationMap[item.id.videoId] || '',
      }));
    } catch (error) {
      console.error('YouTube API error:', error.message);
    }
  }
  
  // Fall back to mock data
  const mockResults = type === 'music' ? mockMusicResults : mockAudiobookResults;
  return mockResults.filter(r => 
    r.title.toLowerCase().includes(query.toLowerCase())
  );
}
