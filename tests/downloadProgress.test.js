import { describe, it, expect } from 'vitest';
import { requestEvents } from '../server/requestEvents.js';
import {
  reportProgress,
  getProgress,
  clearProgress,
} from '../server/downloadProgress.js';

describe('downloadProgress', () => {
  it('stores live progress and emits throttled SSE events', () => {
    const events = [];
    const listener = (c) => events.push(c);
    requestEvents.on('change', listener);
    try {
      reportProgress('r1', 'ipod', 'downloading', 10, 60);
      reportProgress('r1', 'ipod', 'downloading', 11, 59);
      reportProgress('r1', 'ipod', 'downloading', 12, 58);
      expect(getProgress('r1')).toEqual({
        stage: 'downloading',
        percent: 12,
        eta: 58,
      });
      // First tick publishes; rapid sub-second ticks are throttled away
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('progress');
      expect(events[0].requestId).toBe('r1');
      expect(events[0].profile).toBe('ipod');

      // Stage changes always publish immediately
      reportProgress('r1', 'ipod', 'converting', 55, null);
      expect(events).toHaveLength(2);
      expect(events[1].stage).toBe('converting');
    } finally {
      requestEvents.off('change', listener);
      clearProgress('r1');
    }
  });

  it('clears progress when the download finishes', () => {
    reportProgress('r2', 'yoto', 'downloading', 40, 10);
    clearProgress('r2');
    expect(getProgress('r2')).toBeNull();
  });

  it('clamps percent into 0-100', () => {
    reportProgress('r3', 'ipod', 'converting', 137, null);
    expect(getProgress('r3').percent).toBe(100);
    clearProgress('r3');
  });
});
