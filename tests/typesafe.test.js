import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

async function load() {
  const axios = (await import('axios')).default;
  const ts = await import('../server/typesafe.js');
  return { ts, axios };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.TYPESAFE_API_KEY = 'test-key';
});

afterEach(() => {
  delete process.env.TYPESAFE_API_KEY;
  delete process.env.TYPESAFE_CLEAN_THRESHOLD;
});

describe('judgeCleanVersions', () => {
  it('no-ops without an API key', async () => {
    delete process.env.TYPESAFE_API_KEY;
    const { ts, axios } = await load();
    const out = await ts.judgeCleanVersions('q', [{ id: 'a', title: 'Song' }]);
    expect(out).toBeNull();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('sends one batched noul per track and maps answers to ids', async () => {
    const { ts, axios } = await load();
    axios.post.mockResolvedValueOnce({
      data: {
        answers: {
          t0: { type: 'noul', noul: 0.9 },
          t1: { type: 'noul', noul: 0.15 },
        },
      },
    });

    const tracks = [
      { id: 'a', title: 'Song (Clean)', duration: '3:10' },
      { id: 'b', title: 'Song (Official Video)', duration: '3:12' },
    ];
    const scores = await ts.judgeCleanVersions('song', tracks);

    expect(axios.post).toHaveBeenCalledTimes(1);
    const [url, body, opts] = axios.post.mock.calls[0];
    expect(url).toBe('https://api.typesafe.ai/v1/systemone');
    expect(body.model).toBe('jev-latest');
    expect(Object.keys(body.questions)).toEqual(['t0', 't1']);
    expect(body.questions.t0.type).toBe('noul');
    expect(opts.headers.Authorization).toBe('Bearer test-key');

    expect(scores.get('a')).toBe(0.9);
    expect(scores.get('b')).toBe(0.15);
  });

  it('returns null on API failure so labels stand alone', async () => {
    const { ts, axios } = await load();
    axios.post.mockRejectedValueOnce(new Error('boom'));
    const out = await ts.judgeCleanVersions('q', [{ id: 'a', title: 'Song' }]);
    expect(out).toBeNull();
  });
});

describe('judgeTitleClean', () => {
  it('returns the single-track probability', async () => {
    const { ts, axios } = await load();
    axios.post.mockResolvedValueOnce({
      data: { answers: { t0: { type: 'noul', noul: 0.42 } } },
    });
    expect(await ts.judgeTitleClean('Some Title')).toBe(0.42);
  });
});

describe('cleanThreshold', () => {
  it('defaults to 0.5 and honours a sane override', async () => {
    const { ts } = await load();
    expect(ts.cleanThreshold()).toBe(0.5);
    process.env.TYPESAFE_CLEAN_THRESHOLD = '0.8';
    expect(ts.cleanThreshold()).toBe(0.8);
    process.env.TYPESAFE_CLEAN_THRESHOLD = 'nonsense';
    expect(ts.cleanThreshold()).toBe(0.5);
  });
});
