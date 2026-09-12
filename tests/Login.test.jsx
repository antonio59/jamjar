// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('../src/api/client.js', () => ({
  default: { get: vi.fn(), post: vi.fn() },
  thumbUrl: (u) => u,
  API_URL: '/api',
  readCookie: () => null,
}));

import api from '../src/api/client.js';
import useStore from '../src/store/useStore.js';
import Login from '../src/pages/Login.jsx';

const PROFILES = [
  {
    username: 'parent',
    role: 'parent',
    profile: null,
    display_name: 'Grown-up',
    avatar_emoji: '👑',
  },
  {
    username: 'cristina',
    role: 'child',
    profile: 'yoto',
    display_name: 'Cristina',
    avatar_emoji: '🦊',
  },
  {
    username: 'isabella',
    role: 'child',
    profile: 'ipod',
    display_name: 'Isabella',
    avatar_emoji: '🐰',
  },
];

let loginMock;
let toastMock;

beforeEach(() => {
  loginMock = vi.fn().mockResolvedValue({ success: true });
  toastMock = vi.fn();
  useStore.setState({ login: loginMock, showToast: toastMock });
  api.get.mockResolvedValue({ data: PROFILES });
});

afterEach(cleanup);

describe('Login', () => {
  it('loads family profiles from the API, kids before the grown-up', async () => {
    render(<Login />);

    const cristina = await screen.findByText('Cristina');
    expect(screen.getByText('Isabella')).toBeInTheDocument();
    // The parent card shows "Grown-up" as both name and tag
    const grownUp = screen.getAllByText('Grown-up');
    expect(grownUp.length).toBeGreaterThan(0);
    expect(api.get).toHaveBeenCalledWith('/auth/profiles');

    // Kids sort first — Cristina's card precedes the parent card in the DOM
    expect(
      cristina.compareDocumentPosition(grownUp[0]) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('shows a retry state when profiles cannot be loaded', async () => {
    api.get.mockRejectedValueOnce(new Error('network down'));
    render(<Login />);

    expect(
      await screen.findByText(/Can't reach the JamJar server/i),
    ).toBeInTheDocument();

    api.get.mockResolvedValueOnce({ data: PROFILES });
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByText('Cristina')).toBeInTheDocument();
  });

  it('opens the PIN pad for the selected profile', async () => {
    render(<Login />);
    fireEvent.click(await screen.findByText('Cristina'));

    expect(screen.getByText(/What's the magic PIN/i)).toBeInTheDocument();
    expect(screen.getByText('Cristina')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'PIN digit 7' }),
    ).toBeInTheDocument();
  });

  it('submits a short PIN via the ✓ button', async () => {
    render(<Login />);
    fireEvent.click(await screen.findByText('Isabella'));

    for (const d of ['1', '2', '3', '4']) {
      fireEvent.click(screen.getByRole('button', { name: `PIN digit ${d}` }));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Submit PIN' }));

    await waitFor(() =>
      expect(loginMock).toHaveBeenCalledWith('isabella', '1234'),
    );
  });

  it('auto-submits once the PIN reaches 8 digits', async () => {
    render(<Login />);
    fireEvent.click(await screen.findByText('Cristina'));

    for (const d of '12345678') {
      fireEvent.click(screen.getByRole('button', { name: `PIN digit ${d}` }));
    }

    await waitFor(() =>
      expect(loginMock).toHaveBeenCalledWith('cristina', '12345678'),
    );
  });

  it('shows the error and clears the PIN when login fails', async () => {
    loginMock.mockResolvedValueOnce({
      success: false,
      error: 'That username or PIN is wrong. Please try again!',
    });
    render(<Login />);
    fireEvent.click(await screen.findByText('Cristina'));

    for (const d of '9999') {
      fireEvent.click(screen.getByRole('button', { name: `PIN digit ${d}` }));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Submit PIN' }));

    expect(
      await screen.findByText(/PIN is wrong/i),
    ).toBeInTheDocument();
    expect(toastMock).toHaveBeenCalledWith('Login failed', 'error');
  });
});
