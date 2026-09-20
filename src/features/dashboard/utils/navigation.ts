import { PERMISSIONS, Permission } from "@/core/constants";
import { NavItem } from "../types";

export const ALL_NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    iconName: "dashboard",
    exact: true,
  },
  {
    id: "tracking",
    label: "Live Tracking",
    href: "/dashboard/tracking",
    iconName: "tracking",
    requiredPermission: PERMISSIONS.TRACKING_READ_LIVE,
  },
  {
    id: "vehicles",
    label: "Vehicles",
    href: "/dashboard/vehicles",
    iconName: "vehicles",
    requiredPermission: PERMISSIONS.VEHICLE_READ,
  },
  {
    id: "geofences",
    label: "Geofences",
    href: "/dashboard/geofences",
    iconName: "geofences",
    requiredPermission: PERMISSIONS.GEOFENCE_READ,
  },
  {
    id: "reports",
    label: "Reports",
    href: "/dashboard/reports",
    iconName: "reports",
    requiredPermission: PERMISSIONS.REPORTS_READ,
  },
  {
    id: "audit",
    label: "Audit Logs",
    href: "/dashboard/audit",
    iconName: "audit",
    requiredPermission: PERMISSIONS.AUDIT_READ,
  },
  {
    id: "organization",
    label: "Organization",
    href: "/dashboard/organization",
    iconName: "organization",
    requiredPermission: PERMISSIONS.ORGANIZATION_MANAGE,
  },
  {
    id: "settings",
    label: "Settings",
    href: "/dashboard/settings",
    iconName: "settings",
  },
];

/**
 * Filter navigation items against the user's granted permissions array.
 * If an item requires a specific permission, it is only included if userPermissions contains it.
 */
export function filterNavItemsByPermission(
  items: NavItem[],
  userPermissions: Permission[],
): NavItem[] {
  return items.filter((item) => {
    if (!item.requiredPermission) return true;
    return userPermissions.includes(item.requiredPermission);
  });
}
