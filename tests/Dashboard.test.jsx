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

// jsdom has no EventSource — stub it so the SSE effect can run
class FakeEventSource {
  static instances = [];
  constructor(url) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }
  addEventListener() {}
  close() {}
}
vi.stubGlobal('EventSource', FakeEventSource);

import useStore from '../src/store/useStore.js';
import Dashboard from '../src/pages/Dashboard.jsx';

const PENDING = {
  id: 'r1',
  title: 'Pending Song — Some Artist',
  profile: 'yoto',
  type: 'music',
  status: 'pending',
  url: 'https://youtu.be/abc',
};
const DONE = {
  id: 'r2',
  title: 'Done Song — Other Artist',
  profile: 'yoto',
  type: 'music',
  status: 'completed',
  url: 'https://youtu.be/def',
  downloaded_at: new Date().toISOString(),
  file_size_bytes: 5_000_000,
};

const PARENT = { role: 'parent', profile: null, username: 'parent' };
const CHILD = { role: 'child', profile: 'yoto', username: 'kid' };

let mocks;

function setStore(overrides = {}) {
  useStore.setState({
    user: PARENT,
    getPendingRequests: vi.fn().mockResolvedValue([PENDING]),
    getRequests: vi.fn().mockResolvedValue([PENDING, DONE]),
    getAccessToken: vi.fn().mockResolvedValue('tok'),
    approveRequest: vi.fn().mockResolvedValue({}),
    rejectRequest: vi.fn().mockResolvedValue({}),
    deleteRequest: vi.fn().mockResolvedValue({}),
    markUploaded: vi.fn().mockResolvedValue({}),
    retryDownload: vi.fn().mockResolvedValue({}),
    retryAllDummy: vi.fn().mockResolvedValue({ queued: 0 }),
    getBlockedKeywords: vi.fn().mockResolvedValue([]),
    addBlockedKeyword: vi.fn(),
    removeBlockedKeyword: vi.fn(),
    showToast: vi.fn(),
    ...overrides,
  });
}

beforeEach(() => {
  mocks = {
    approveRequest: vi.fn().mockResolvedValue({}),
    showToast: vi.fn(),
  };
  setStore(mocks);
});

afterEach(cleanup);

describe('Dashboard — parent', () => {
  it('renders counters and the pending triage queue', async () => {
    render(<Dashboard />);

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Awaiting approval')).toBeInTheDocument();
    expect(screen.getByText('Completed this week')).toBeInTheDocument();
    // Label appears on both the counter and the tab
    expect(screen.getAllByText('Needs upload').length).toBeGreaterThan(0);
    expect(screen.getByText('Needs attention')).toBeInTheDocument();

    // The pending request shows in the default Triage tab
    expect(
      await screen.findByText(/Pending Song/),
    ).toBeInTheDocument();
  });

  it('approving a request calls the API and refreshes the queue', async () => {
    render(<Dashboard />);

    const approve = await screen.findAllByRole('button', { name: 'Approve' });
    fireEvent.click(approve[0]);

    await waitFor(() =>
      expect(mocks.approveRequest).toHaveBeenCalledWith('r1'),
    );
    await waitFor(() =>
      expect(useStore.getState().getPendingRequests.mock.calls.length).toBe(2),
    );
  });

  it('maintenance tab lists blocked keywords and adds new ones', async () => {
    const getBlockedKeywords = vi
      .fn()
      .mockResolvedValue([{ id: 'k1', keyword: 'scary', created_at: '2026-01-01' }]);
    const addBlockedKeyword = vi.fn().mockResolvedValue({});
    setStore({ getBlockedKeywords, addBlockedKeyword });
    render(<Dashboard />);

    await screen.findByText('Dashboard');
    fireEvent.click(screen.getByRole('tab', { name: /maintenance/i }));

    expect(await screen.findByText('Blocked keywords')).toBeInTheDocument();
    expect(await screen.findByText('scary')).toBeInTheDocument();

    fireEvent.change(
      screen.getByPlaceholderText(/explicit, parody, scary/),
      { target: { value: 'violence' } },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Block' }));

    await waitFor(() =>
      expect(addBlockedKeyword).toHaveBeenCalledWith('violence'),
    );
    await waitFor(() =>
      expect(getBlockedKeywords.mock.calls.length).toBe(2),
    );
  });
});

describe('Dashboard — child', () => {
  it('shows a simplified My requests view', async () => {
    setStore({
      user: CHILD,
      getRequests: vi.fn().mockResolvedValue([DONE]),
    });
    render(<Dashboard />);

    expect(await screen.findByText('My requests')).toBeInTheDocument();
    expect(await screen.findByText(/Done Song/)).toBeInTheDocument();
    // No parent-only chrome
    expect(screen.queryByText('Triage')).not.toBeInTheDocument();
    expect(screen.queryByText('Awaiting approval')).not.toBeInTheDocument();
  });
});
