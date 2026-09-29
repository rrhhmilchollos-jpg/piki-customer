export type RealtimeEvent = { id: string; type: string; payload: Record<string, unknown>; occurredAt: string };
type Listener = (event: RealtimeEvent) => void;

let sequence = 0;
const listeners = new Map<string, Set<Listener>>();

export function publishRealtime(topic: string, type: string, payload: Record<string, unknown>) {
  const event: RealtimeEvent = { id: String(++sequence), type, payload, occurredAt: new Date().toISOString() };
  listeners.get(topic)?.forEach((listener) => listener(event));
  return event;
}

export function subscribeRealtime(topic: string, listener: Listener) {
  const bucket = listeners.get(topic) ?? new Set<Listener>();
  bucket.add(listener);
  listeners.set(topic, bucket);
  return () => { bucket.delete(listener); if (!bucket.size) listeners.delete(topic); };
}

export function resetRealtimeForTests() { listeners.clear(); sequence = 0; }
