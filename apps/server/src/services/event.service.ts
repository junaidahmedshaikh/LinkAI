import type { SyncEventType } from "@linkai/types";

type SyncListener = (payload: { userId: string; event: SyncEventType; data?: unknown }) => void;

class EventService {
  private listeners = new Map<SyncEventType, Set<SyncListener>>();

  on(event: SyncEventType, listener: SyncListener): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener);
    return () => this.listeners.get(event)?.delete(listener);
  }

  emit(userId: string, event: SyncEventType, data?: unknown): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const listener of set) {
      try {
        listener({ userId, event, data });
      } catch {
        // listener errors must not break emitters
      }
    }
  }
}

export const eventService = new EventService();
