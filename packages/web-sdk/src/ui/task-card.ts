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

export function renderGeoSphereTaskCardHtml(props: GeoSphereTaskCardProps): string {
  return `<div class="geosphere-card" data-geosphere-ui="task-card">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
      <span class="geosphere-card-title">${props.type} • ${props.priority}</span>
      <span class="geosphere-status-badge">${props.status}</span>
    </div>
    <h3 style="font-size: 1rem; font-weight: 600; margin: 0 0 0.25rem 0; color: #f8fafc;">${props.title}</h3>
    <p style="font-size: 0.75rem; color: #94a3b8; margin: 0 0 0.75rem 0;">${props.address}</p>
    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; border-top: 1px solid #1e293b; padding-top: 0.5rem;">
      <span style="color: #cbd5e1;">${props.assignedAgentName || "Unassigned"}</span>
      <span style="color: #818cf8; font-weight: 500;">ID: ${props.id}</span>
    </div>
  </div>`;
}
