import { EventEmitter } from 'node:events';

// Broadcast channel for request changes: database mutations publish here and
// the /api/events SSE route fans them out to connected dashboards.
export const requestEvents = new EventEmitter();
requestEvents.setMaxListeners(50);

export function publishRequestChange(change) {
  requestEvents.emit('change', { ...change, at: new Date().toISOString() });
}

export default requestEvents;
