/**
 * In-memory SSE Event Bus for the Real-Time Request Inspector.
 * 
 * Uses a singleton Map to hold subscriber callbacks keyed by projectId.
 * The mock route calls `publish()`, and the SSE route registers with `subscribe()`.
 * 
 * NOTE: This is process-local, so it works perfectly in a single-process dev / 
 * Cloud Run deployment. For multi-replica deployments, swap the Map for Redis Pub/Sub.
 */

export interface InspectorLogEntry {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  latencyMs: number;
  requestHeaders: Record<string, string>;
  queryParams: Record<string, string>;
  requestBody: string | null;
  responseBody: string | null;
  endpointId: string | null;
}

// Map<projectId, Set<callback>>
type Subscriber = (entry: InspectorLogEntry) => void;
const subscribers = new Map<string, Set<Subscriber>>();

export function subscribe(projectId: string, cb: Subscriber): () => void {
  if (!subscribers.has(projectId)) {
    subscribers.set(projectId, new Set());
  }
  subscribers.get(projectId)!.add(cb);

  // Return an unsubscribe function
  return () => {
    const set = subscribers.get(projectId);
    if (set) {
      set.delete(cb);
      if (set.size === 0) subscribers.delete(projectId);
    }
  };
}

export function publish(projectId: string, entry: InspectorLogEntry): void {
  const set = subscribers.get(projectId);
  if (!set || set.size === 0) return; // nobody is watching, skip
  for (const cb of set) {
    try {
      cb(entry);
    } catch (e) {
      console.error('[inspector-bus] subscriber error', e);
    }
  }
}
