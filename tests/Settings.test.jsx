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

import useStore from '../src/store/useStore.js';
import Settings from '../src/pages/Settings.jsx';

const PARENT = {
  id: 'u-parent',
  username: 'parent',
  role: 'parent',
  display_name: 'Grown-up',
  avatar_emoji: '👑',
  request_count: 0,
};
const KID = {
  id: 'u-kid',
  username: 'cristina',
  role: 'child',
  profile: 'yoto',
  display_name: 'Cristina',
  avatar_emoji: '🦊',
  request_count: 3,
};

let mocks;

beforeEach(() => {
  mocks = {
    getUsers: vi.fn().mockResolvedValue([PARENT, KID]),
    createChild: vi.fn().mockResolvedValue({}),
    setUserPin: vi.fn().mockResolvedValue({}),
    deleteChild: vi.fn().mockResolvedValue({}),
    logout: vi.fn().mockResolvedValue({}),
    showToast: vi.fn(),
  };
  useStore.setState({ user: PARENT, ...mocks });
});

afterEach(cleanup);

describe('Settings', () => {
  it('lists family accounts with roles and request counts', async () => {
    render(<Settings />);

    expect(await screen.findByText('Cristina')).toBeInTheDocument();
    expect(screen.getByText('Grown-up')).toBeInTheDocument();
    expect(screen.getByText(/3 requests/)).toBeInTheDocument();
    expect(mocks.getUsers).toHaveBeenCalledTimes(1);
  });

  it('shows an error state with retry when accounts fail to load', async () => {
    mocks.getUsers.mockRejectedValueOnce(new Error('down'));
    render(<Settings />);

    expect(
      await screen.findByText("Accounts didn't load"),
    ).toBeInTheDocument();

    mocks.getUsers.mockResolvedValueOnce([PARENT, KID]);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByText('Cristina')).toBeInTheDocument();
    expect(mocks.getUsers).toHaveBeenCalledTimes(2);
  });

  it('creates a child account and refreshes the list', async () => {
    render(<Settings />);
    await screen.findByText('Cristina');

    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'rosie' },
    });
    fireEvent.change(screen.getByLabelText('PIN'), {
      target: { value: '4321' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() =>
      expect(mocks.createChild).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'rosie',
          pin: '4321',
          profile: 'yoto',
        }),
      ),
    );
    // List reloads after creation
    await waitFor(() => expect(mocks.getUsers).toHaveBeenCalledTimes(2));
  });

  it('rotates a child PIN through the inline field', async () => {
    render(<Settings />);
    await screen.findByText('Cristina');

    // Parent's row renders first — Cristina's Change PIN is the second one
    fireEvent.click(
      screen.getAllByRole('button', { name: /change pin/i })[1],
    );
    fireEvent.change(
      screen.getByLabelText('New PIN for cristina'),
      { target: { value: '8765' } },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(mocks.setUserPin).toHaveBeenCalledWith('u-kid', '8765'),
    );
  });

  it('removes a child after confirmation', async () => {
    render(<Settings />);
    await screen.findByText('Cristina');

    fireEvent.click(
      screen.getByRole('button', { name: 'Remove cristina' }),
    );
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove' }),
    );

    await waitFor(() =>
      expect(mocks.deleteChild).toHaveBeenCalledWith('u-kid'),
    );
    expect(dialog).toBeInTheDocument();
  });

  it('signs out when the parent rotates their own PIN', async () => {
    render(<Settings />);
    await screen.findByText('Grown-up');

    fireEvent.click(
      screen.getAllByRole('button', { name: /change pin/i })[0],
    );
    fireEvent.change(screen.getByLabelText('New PIN for parent'), {
      target: { value: '9999' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(mocks.setUserPin).toHaveBeenCalledWith('u-parent', '9999'),
    );
    await waitFor(() => expect(mocks.logout).toHaveBeenCalled());
  });
});
