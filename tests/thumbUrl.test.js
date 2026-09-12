import { describe, it, expect } from 'vitest';
import { thumbUrl } from '../src/api/client.js';

describe('thumbUrl', () => {
  it('routes allowlisted hosts through the server proxy', () => {
    const url = 'https://img.youtube.com/vi/abc123/mqdefault.jpg';
    expect(thumbUrl(url)).toBe(
      `/api/thumb?u=${encodeURIComponent(url)}`,
    );
    expect(thumbUrl('https://i.ytimg.com/vi/x/0.jpg')).toContain('/api/thumb?u=');
    expect(
      thumbUrl('https://covers.openlibrary.org/b/id/1-M.jpg'),
    ).toContain('/api/thumb?u=');
  });

  it('passes through non-allowlisted hosts untouched', () => {
    const url = 'https://cdn.example.com/cover.jpg';
    expect(thumbUrl(url)).toBe(url);
  });

  it('returns null for empty or unparseable input', () => {
    expect(thumbUrl('')).toBeNull();
    expect(thumbUrl(null)).toBeNull();
    expect(thumbUrl(undefined)).toBeNull();
    expect(thumbUrl('not a url')).toBeNull();
  });
});
