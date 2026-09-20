/**
 * GeoSphere Web SDK — Embedded Security Audit Stream Controller & UI
 */
export interface SDKAuditEvent {
    id: string;
    actor: string;
    action: string;
    target: string;
    result: "SUCCESS" | "DENIED" | "ERROR";
    timestamp: string;
}
export declare class GeoSphereAuditStreamController {
    private events;
    constructor(events: SDKAuditEvent[]);
    renderHTML(): string;
}
//# sourceMappingURL=audit-stream.d.ts.map