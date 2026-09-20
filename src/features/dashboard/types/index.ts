import { Permission, UserRole } from "@/core/constants";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  iconName:
    | "dashboard"
    | "tracking"
    | "vehicles"
    | "geofences"
    | "reports"
    | "audit"
    | "organization"
    | "settings";
  requiredPermission?: Permission;
  badge?: string;
  exact?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string | null;
  emailVerifiedAt: Date | null;
  isActive: boolean;
}

export interface DashboardStats {
  totalVehicles: number;
  activeVehicles: number;
  stationaryVehicles: number;
  maintenanceVehicles: number;
  totalDistanceKm: number;
  activeAlerts: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: "info" | "warning" | "alert";
}
