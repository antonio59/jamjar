import axios from 'axios';

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

export async function searchYouTube(query, type = 'music') {
  // If YouTube API key is configured, use real API
  if (YOUTUBE_API_KEY) {
    try {
      const safeSearch = type === 'music' ? 'moderate' : 'strict';
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          maxResults: 10,
          safeSearch: safeSearch,
          videoDuration: type === 'music' ? 'short' : 'long',
          key: YOUTUBE_API_KEY,
        },
      });
      
      return response.data.items.map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        url: `https://youtube.com/watch?v=${item.id.videoId}`,
        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        duration: 'Unknown', // Would need additional API call to get duration
      }));
    } catch (error) {
      console.error('YouTube API error:', error.message);
      // Fall back to mock data
    }
  }
  
  // Fall back to mock data
  const mockResults = type === 'music' ? mockMusicResults : mockAudiobookResults;
  return mockResults.filter(r => 
    r.title.toLowerCase().includes(query.toLowerCase())
  );
}
