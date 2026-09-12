import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios', () => ({
  default: { get: vi.fn() },
}));
vi.mock('../server/ytdlp.js', () => ({
  createYtDlp: () => ({ execPromise: vi.fn() }),
  baseArgs: () => [],
}));

// YOUTUBE_API_KEY is read at module load — reset and re-import per scenario,
// then grab the (re-instantiated) axios mock fresh.
async function loadModule(apiKey) {
  vi.resetModules();
  process.env.YOUTUBE_API_KEY = apiKey;
  const youtube = await import('../server/youtube.js');
  const axios = (await import('axios')).default;
  return { youtube, axios };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('playlist helpers', () => {
  it('detects playlist URLs and extracts their IDs', async () => {
    const { youtube } = await loadModule('');
    expect(youtube.isPlaylistUrl('https://youtube.com/playlist?list=PLabc')).toBe(true);
    expect(youtube.isPlaylistUrl('https://youtube.com/watch?v=abc&list=PLxyz')).toBe(true);
    expect(youtube.isPlaylistUrl('https://youtube.com/watch?v=abc')).toBe(false);
    expect(youtube.extractPlaylistId('https://youtube.com/watch?v=abc&list=PLxyz&t=5')).toBe('PLxyz');
    expect(youtube.extractPlaylistId('https://youtube.com/watch?v=abc')).toBeNull();
  });
});

describe('searchYouTube', () => {
  it('serves filtered mock results when no API key is set', async () => {
    const { youtube, axios } = await loadModule('');

    const results = await youtube.searchYouTube('happy', 'music');
    expect(results).toHaveLength(1);
    expect(results[0].title).toMatch(/Happy - Pharrell/);

    expect(await youtube.searchYouTube('zzzz-no-match', 'music')).toEqual([]);
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('returns audiobook mock results for the audiobook type', async () => {
    const { youtube } = await loadModule('');
    const results = await youtube.searchYouTube('matilda', 'audiobook');
    expect(results).toHaveLength(1);
    expect(results[0].title).toMatch(/Matilda/);
  });

  it('resolves a single-video URL via oEmbed and decodes entities', async () => {
    const { youtube, axios } = await loadModule('');
    axios.get.mockResolvedValueOnce({
      data: { title: 'Wheels on the Bus &amp; More' },
    });

    const results = await youtube.searchYouTube('https://youtu.be/abc123', 'music');
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: 'abc123',
      title: 'Wheels on the Bus & More',
      url: 'https://www.youtube.com/watch?v=abc123',
    });
  });

  it('maps API results with duration and decodes titles', async () => {
    const { youtube, axios } = await loadModule('test-key');
    axios.get
      .mockResolvedValueOnce({
        data: {
          items: [
            {
              id: { videoId: 'v1' },
              snippet: {
                title: 'Song &quot;Live&quot; Version',
                thumbnails: { medium: { url: 'https://img/1.jpg' } },
              },
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          items: [
            { id: 'v1', contentDetails: { duration: 'PT3M45S', contentRating: {} } },
          ],
        },
      });

    const results = await youtube.searchYouTube('song live', 'music');
    expect(results[0]).toMatchObject({
      id: 'v1',
      title: 'Song "Live" Version',
      duration: '3:45',
      url: 'https://youtube.com/watch?v=v1',
    });
    // strict safeSearch is enforced for a kids' app
    expect(axios.get.mock.calls[0][1].params.safeSearch).toBe('strict');
  });

  it('falls back to mock results when the API call fails', async () => {
    const { youtube, axios } = await loadModule('test-key');
    axios.get.mockRejectedValue(new Error('quota exceeded'));

    const results = await youtube.searchYouTube('happy', 'music');
    expect(results[0].title).toMatch(/Happy - Pharrell/);
  });
});
