/**
 * GeoSphere Framework-Neutral Event Contracts & Event Bus
 */
export type EventCategory = "LIFECYCLE" | "SDK" | "UI" | "CONFIGURATION" | "DOMAIN";
export interface GeoSphereEvent<T = unknown> {
    eventId: string;
    type: string;
    category: EventCategory;
    timestamp: string;
    source: string;
    payload: T;
    correlationId?: string;
    tenantId?: string;
}
export type GeoSphereEventHandler<T = unknown> = (event: GeoSphereEvent<T>) => void | Promise<void>;
export declare class GeoSphereEventBus {
    private listeners;
    on<T = unknown>(eventType: string, handler: GeoSphereEventHandler<T>): () => void;
    off<T = unknown>(eventType: string, handler: GeoSphereEventHandler<T>): void;
    emit<T = unknown>(event: GeoSphereEvent<T>): void;
    clear(): void;
    listenerCount(eventType: string): number;
}
//# sourceMappingURL=events.contracts.d.ts.map