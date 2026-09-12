// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api/client.js', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn(), patch: vi.fn() },
  thumbUrl: (u) => u,
  API_URL: '/api',
  readCookie: () => null,
}));

import api from '../src/api/client.js';
import useStore, { friendlyError } from '../src/store/useStore.js';

beforeEach(() => {
  vi.clearAllMocks();
  useStore.setState({
    user: null,
    isAuthenticated: false,
    accessToken: null,
    accessTokenExpiresAt: 0,
  });
});

describe('friendlyError', () => {
  it('maps technical errors to kid-friendly messages', () => {
    expect(friendlyError({ code: 'ERR_NETWORK' })).toMatch(/not responding/);
    expect(friendlyError({ response: { status: 401 } })).toMatch(/grown-up/);
    expect(friendlyError({ response: { status: 403 } })).toMatch(/grown-up/);
    expect(friendlyError({ response: { status: 429 } })).toMatch(/too fast/);
    expect(friendlyError({ response: { status: 500 } })).toMatch(/our end/);
    expect(
      friendlyError({ response: { status: 400, data: { error: 'Nope' } } }),
    ).toBe('Nope');
    expect(friendlyError(new Error('boom'))).toBe('boom');
  });
});

describe('auth actions', () => {
  it('logs in and stores the user', async () => {
    api.post.mockResolvedValueOnce({ data: { user: { username: 'kid' } } });
    const result = await useStore.getState().login('kid', '1234');

    expect(result).toEqual({ success: true });
    expect(useStore.getState().user).toEqual({ username: 'kid' });
    expect(useStore.getState().isAuthenticated).toBe(true);
  });

  it('returns friendly errors on failed login', async () => {
    api.post.mockRejectedValueOnce({ response: { status: 401 } });
    const result = await useStore.getState().login('kid', '0000');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/wrong/i);
    expect(useStore.getState().isAuthenticated).toBe(false);
  });

  it('restores a session or clears it', async () => {
    api.get.mockResolvedValueOnce({ data: { username: 'kid', role: 'child' } });
    expect(await useStore.getState().restoreSession()).toBe(true);
    expect(useStore.getState().isAuthenticated).toBe(true);

    api.get.mockRejectedValueOnce(new Error('nope'));
    expect(await useStore.getState().restoreSession()).toBe(false);
    expect(useStore.getState().isAuthenticated).toBe(false);
  });

  it('logs out and clears all auth state', async () => {
    useStore.setState({
      user: { username: 'kid' },
      isAuthenticated: true,
      accessToken: 'tok',
      accessTokenExpiresAt: 999,
    });
    api.post.mockResolvedValueOnce({});

    await useStore.getState().logout();

    expect(api.post).toHaveBeenCalledWith('/auth/logout', {});
    expect(useStore.getState().user).toBeNull();
    expect(useStore.getState().accessToken).toBeNull();
  });
});

describe('getAccessToken', () => {
  it('returns null when logged out', async () => {
    expect(await useStore.getState().getAccessToken()).toBeNull();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('mints, caches, and refreshes tokens', async () => {
    useStore.setState({ isAuthenticated: true });
    api.post.mockResolvedValue({
      data: { token: 't1', expiresIn: 300 },
    });

    expect(await useStore.getState().getAccessToken()).toBe('t1');
    // Second call within the 15s safety margin reuses the cached token
    expect(await useStore.getState().getAccessToken()).toBe('t1');
    expect(api.post).toHaveBeenCalledTimes(1);

    // Expired → re-mints
    useStore.setState({ accessTokenExpiresAt: 0 });
    api.post.mockResolvedValueOnce({
      data: { token: 't2', expiresIn: 300 },
    });
    expect(await useStore.getState().getAccessToken()).toBe('t2');
  });
});
