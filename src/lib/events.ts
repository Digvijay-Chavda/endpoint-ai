// A simple event emitter to allow sibling components to communicate
// specifically used to notify the Sidebar to re-fetch when a project is created

type Listener = () => void;

class EventBus {
  private listeners: Record<string, Listener[]> = {};

  subscribe(event: string, callback: Listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners[event] = this.listeners[event].filter(
        (listener) => listener !== callback
      );
    };
  }

  emit(event: string) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => callback());
    }
  }
}

export const appEvents = new EventBus();
