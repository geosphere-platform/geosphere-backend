/**
 * GeoSphere Web SDK — Level 2 Reusable UI Component: GeoSphereTaskCard
 */
export interface GeoSphereTaskCardProps {
    id: string;
    title: string;
    type: string;
    priority: string;
    status: string;
    address: string;
    assignedAgentName?: string;
    onExecute?: (taskId: string) => void;
}
export declare function renderGeoSphereTaskCardHtml(props: GeoSphereTaskCardProps): string;
//# sourceMappingURL=task-card.d.ts.map