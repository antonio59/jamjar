import { describe, it, expect, vi, beforeEach } from 'vitest';

const started = [];
let release;

vi.mock('../server/downloader.js', () => ({
  downloadAndUpload: vi.fn(
    (request) =>
      new Promise((resolve) => {
        started.push(request.id);
        release = resolve;
      }),
  ),
}));

describe('download queue', () => {
  beforeEach(() => {
    started.length = 0;
    vi.resetModules();
  });

  it('runs at most MAX_CONCURRENT_DOWNLOADS at a time', async () => {
    process.env.MAX_CONCURRENT_DOWNLOADS = '1';
    const { enqueueDownload, queueStatus } = await import('../server/downloadQueue.js');

    enqueueDownload({ id: 'a' });
    enqueueDownload({ id: 'b' });

    expect(started).toEqual(['a']);
    expect(queueStatus()).toMatchObject({ active: 1, pending: 1, max: 1 });

    release();
    await vi.waitFor(() => expect(started).toEqual(['a', 'b']));
  });

  it('ignores a request that is already queued', async () => {
    process.env.MAX_CONCURRENT_DOWNLOADS = '1';
    const { enqueueDownload } = await import('../server/downloadQueue.js');

    enqueueDownload({ id: 'a' });
    expect(enqueueDownload({ id: 'a' })).toMatchObject({ queued: false });
    expect(started).toEqual(['a']);
  });
});
