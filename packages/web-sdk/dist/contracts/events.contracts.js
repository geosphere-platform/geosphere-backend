/**
 * GeoSphere Framework-Neutral Event Contracts & Event Bus
 */
export class GeoSphereEventBus {
    listeners = new Map();
    on(eventType, handler) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        this.listeners.get(eventType).add(handler);
        return () => this.off(eventType, handler);
    }
    off(eventType, handler) {
        const handlers = this.listeners.get(eventType);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.listeners.delete(eventType);
            }
        }
    }
    emit(event) {
        const handlers = this.listeners.get(event.type);
        if (handlers) {
            handlers.forEach((handler) => {
                try {
                    handler(event);
                }
                catch (err) {
                    console.error(`[EVENT_BUS_ERROR] Error executing handler for event '${event.type}':`, err);
                }
            });
        }
    }
    clear() {
        this.listeners.clear();
    }
    listenerCount(eventType) {
        return this.listeners.get(eventType)?.size || 0;
    }
}
//# sourceMappingURL=events.contracts.js.map