"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

export interface OrganizationInfo {
  id: string;
  name: string;
  slug: string;
  status: string;
  ownerId?: string;
  timezone?: string;
  locale?: string;
}

export interface WorkspaceInfo {
  id: string;
  name: string;
  slug: string;
  status: string;
  description?: string;
}

export interface TenantContextState {
  activeOrg: OrganizationInfo | null;
  activeWorkspace: WorkspaceInfo | null;
  userOrgs: OrganizationInfo[];
  orgWorkspaces: WorkspaceInfo[];
  isLoading: boolean;
  error: string | null;
  setActiveOrg: (org: OrganizationInfo) => void;
  setActiveWorkspace: (ws: WorkspaceInfo) => void;
  refreshTenantState: () => Promise<void>;
}

const TenantContext = createContext<TenantContextState | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeOrg, setActiveOrgState] = useState<OrganizationInfo | null>(
    null,
  );
  const [activeWorkspace, setActiveWorkspaceState] =
    useState<WorkspaceInfo | null>(null);
  const [userOrgs, setUserOrgs] = useState<OrganizationInfo[]>([]);
  const [orgWorkspaces, setOrgWorkspaces] = useState<WorkspaceInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspacesForOrg = useCallback(async (orgId: string) => {
    try {
      const res = await fetch(`/api/v1/organizations/${orgId}/workspaces`, {
        headers: { "x-organization-id": orgId },
      });
      const data = await res.json();
      if (data.success) {
        setOrgWorkspaces(data.data);
        if (data.data.length > 0) {
          const storedWsId =
            typeof window !== "undefined"
              ? localStorage.getItem("active_workspace_id")
              : null;
          const match =
            data.data.find((w: WorkspaceInfo) => w.id === storedWsId) ||
            data.data[0];
          setActiveWorkspaceState(match);
        } else {
          setActiveWorkspaceState(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch workspaces:", err);
    }
  }, []);

  const refreshTenantState = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/organizations");
      const data = await res.json();
      if (data.success) {
        setUserOrgs(data.data);
        if (data.data.length > 0) {
          const storedOrgId =
            typeof window !== "undefined"
              ? localStorage.getItem("active_org_id")
              : null;
          const match =
            data.data.find((o: OrganizationInfo) => o.id === storedOrgId) ||
            data.data[0];
          setActiveOrgState(match);
          await fetchWorkspacesForOrg(match.id);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load tenant state",
      );
    } finally {
      setIsLoading(false);
    }
  }, [fetchWorkspacesForOrg]);

  useEffect(() => {
    refreshTenantState();
  }, [refreshTenantState]);

  const setActiveOrg = (org: OrganizationInfo) => {
    setActiveOrgState(org);
    if (typeof window !== "undefined") {
      localStorage.setItem("active_org_id", org.id);
    }
    fetchWorkspacesForOrg(org.id);
  };

  const setActiveWorkspace = (ws: WorkspaceInfo) => {
    setActiveWorkspaceState(ws);
    if (typeof window !== "undefined") {
      localStorage.setItem("active_workspace_id", ws.id);
    }
  };

  return (
    <TenantContext.Provider
      value={{
        activeOrg,
        activeWorkspace,
        userOrgs,
        orgWorkspaces,
        isLoading,
        error,
        setActiveOrg,
        setActiveWorkspace,
        refreshTenantState,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export function useTenantContext(): TenantContextState {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenantContext must be used within a TenantProvider");
  }
  return context;
}
