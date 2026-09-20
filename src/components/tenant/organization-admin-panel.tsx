"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTenantContext } from "../../core/context/tenant-context";

interface MemberItem {
  membershipId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  joinedAt: string;
}

interface InvitationItem {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

interface WorkspaceItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  description?: string;
}

export const OrganizationAdminPanel: React.FC = () => {
  const { activeOrg, activeWorkspace, refreshTenantState } = useTenantContext();
  const [activeTab, setActiveTab] = useState<
    "general" | "members" | "invitations" | "workspaces"
  >("general");

  const [members, setMembers] = useState<MemberItem[]>([]);
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Invite modal state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [generatedRawToken, setGeneratedRawToken] = useState<string | null>(
    null,
  );

  // Create workspace modal state
  const [newWsName, setNewWsName] = useState("");
  const [newWsSlug, setNewWsSlug] = useState("");

  const loadData = useCallback(async () => {
    if (!activeOrg) return;
    setLoading(true);
    try {
      if (activeTab === "members") {
        const res = await fetch(
          `/api/v1/organizations/${activeOrg.id}/members`,
          {
            headers: { "x-organization-id": activeOrg.id },
          },
        );
        const data = await res.json();
        if (data.success) setMembers(data.data.members);
      } else if (activeTab === "invitations") {
        const res = await fetch(
          `/api/v1/organizations/${activeOrg.id}/invitations`,
          {
            headers: { "x-organization-id": activeOrg.id },
          },
        );
        const data = await res.json();
        if (data.success) setInvitations(data.data);
      } else if (activeTab === "workspaces") {
        const res = await fetch(
          `/api/v1/organizations/${activeOrg.id}/workspaces?includeArchived=true`,
          {
            headers: { "x-organization-id": activeOrg.id },
          },
        );
        const data = await res.json();
        if (data.success) setWorkspaces(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeOrg, activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg || !inviteEmail) return;
    setMessage(null);
    try {
      const res = await fetch(
        `/api/v1/organizations/${activeOrg.id}/invitations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-organization-id": activeOrg.id,
          },
          body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
        },
      );
      const data = await res.json();
      if (data.success) {
        setGeneratedRawToken(data.data.rawToken);
        setMessage(
          `Invitation created for ${inviteEmail}! Token generated below.`,
        );
        setInviteEmail("");
        loadData();
      } else {
        setMessage(
          `Error: ${data.error?.message || "Failed to create invitation"}`,
        );
      }
    } catch (err) {
      setMessage(
        `Error: ${err instanceof Error ? err.message : "Failed to invite"}`,
      );
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg || !newWsName || !newWsSlug) return;
    setMessage(null);
    try {
      const res = await fetch(
        `/api/v1/organizations/${activeOrg.id}/workspaces`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-organization-id": activeOrg.id,
          },
          body: JSON.stringify({ name: newWsName, slug: newWsSlug }),
        },
      );
      const data = await res.json();
      if (data.success) {
        setMessage(`Workspace '${data.data.name}' created!`);
        setNewWsName("");
        setNewWsSlug("");
        refreshTenantState();
        loadData();
      } else {
        setMessage(
          `Error: ${data.error?.message || "Failed to create workspace"}`,
        );
      }
    } catch (err) {
      setMessage(
        `Error: ${err instanceof Error ? err.message : "Failed to create workspace"}`,
      );
    }
  };

  const handleRevokeInvite = async (invitationId: string) => {
    if (!activeOrg) return;
    try {
      const res = await fetch(`/api/v1/invitations/${invitationId}/revoke`, {
        method: "POST",
        headers: { "x-organization-id": activeOrg.id },
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Invitation revoked");
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveMember = async (membershipId: string) => {
    if (!activeOrg) return;
    try {
      const res = await fetch(
        `/api/v1/organizations/${activeOrg.id}/members/${membershipId}`,
        {
          method: "DELETE",
          headers: { "x-organization-id": activeOrg.id },
        },
      );
      const data = await res.json();
      if (data.success) {
        setMessage("Member removed");
        loadData();
      } else {
        setMessage(
          `Error: ${data.error?.message || "Failed to remove member"}`,
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!activeOrg) {
    return (
      <div className="p-8 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl text-gray-500 dark:text-slate-400 transition-colors">
        No active organization context selected.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-6 text-gray-900 dark:text-white transition-colors">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{activeOrg.name}</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 font-mono">
            Slug: <span className="text-indigo-600 dark:text-indigo-400">{activeOrg.slug}</span> |
            Active Workspace:{" "}
            <span className="text-cyan-600 dark:text-cyan-400">
              {activeWorkspace?.name || "None"}
            </span>
          </p>
        </div>
        <div className="flex space-x-2 flex-wrap gap-1">
          <button
            onClick={() => setActiveTab("general")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "general"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300"
            }`}
          >
            General Profile
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "members"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300"
            }`}
          >
            Members
          </button>
          <button
            onClick={() => setActiveTab("invitations")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "invitations"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300"
            }`}
          >
            Invitations
          </button>
          <button
            onClick={() => setActiveTab("workspaces")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "workspaces"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300"
            }`}
          >
            Workspaces
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200 rounded-lg text-sm font-medium">
          {message}
        </div>
      )}

      {/* General Tab */}
      {activeTab === "general" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200">
            Organization Settings & Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700/50">
              <span className="text-xs uppercase text-gray-500 dark:text-slate-400 font-semibold block mb-1">
                Timezone
              </span>
              <p className="text-gray-900 dark:text-slate-200 font-mono">
                {activeOrg.timezone || "UTC"}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700/50">
              <span className="text-xs uppercase text-gray-500 dark:text-slate-400 font-semibold block mb-1">
                Locale
              </span>
              <p className="text-gray-900 dark:text-slate-200 font-mono">
                {activeOrg.locale || "en-US"}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700/50">
              <span className="text-xs uppercase text-gray-500 dark:text-slate-400 font-semibold block mb-1">
                Status
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                {activeOrg.status}
              </span>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700/50">
              <span className="text-xs uppercase text-gray-500 dark:text-slate-400 font-semibold block mb-1">
                Organization ID
              </span>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-mono">{activeOrg.id}</p>
            </div>
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === "members" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200">
              Organization Members
            </h3>
          </div>
          {loading ? (
            <p className="text-sm text-gray-500 dark:text-slate-400">Loading members...</p>
          ) : (
            <div className="overflow-x-auto border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm">
              <table className="w-full text-left text-sm text-gray-700 dark:text-slate-300">
                <thead className="bg-gray-50 dark:bg-slate-800 text-xs uppercase text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-750">
                  <tr>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {members.map((m) => (
                    <tr key={m.membershipId} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-100">
                        {m.firstName} {m.lastName}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">
                        {m.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded text-xs font-mono">
                          {m.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded text-xs font-medium">
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRemoveMember(m.membershipId)}
                          className="px-2 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900 text-red-700 dark:text-red-300 rounded text-xs transition-colors border border-red-200 dark:border-red-800"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Invitations Tab */}
      {activeTab === "invitations" && (
        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-slate-800/40 p-4 rounded-xl border border-gray-200 dark:border-slate-700/50 space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-200">
              Invite New Member
            </h4>
            <form
              onSubmit={handleCreateInvite}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                required
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="MEMBER">MEMBER</option>
                <option value="VIEWER">VIEWER</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Generate Invitation
              </button>
            </form>
            {generatedRawToken && (
              <div className="p-3 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs space-y-1">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold block">
                  Invitation Token Generated:
                </span>
                <p className="font-mono text-gray-800 dark:text-slate-200 break-all select-all">
                  {generatedRawToken}
                </p>
                <p className="text-gray-500 dark:text-slate-500">
                  Accept endpoint:{" "}
                  <code className="text-gray-600 dark:text-slate-400">
                    /api/v1/invitations/{generatedRawToken}/accept
                  </code>
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-200">
              Pending & Historical Invitations
            </h4>
            <div className="overflow-x-auto border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm">
              <table className="w-full text-left text-sm text-gray-700 dark:text-slate-300">
                <thead className="bg-gray-50 dark:bg-slate-800 text-xs uppercase text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Expires At</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {invitations.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-slate-200">
                        {inv.email}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-slate-400">
                        {inv.role}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            inv.status === "PENDING"
                              ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-transparent"
                              : inv.status === "ACCEPTED"
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-transparent"
                                : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">
                        {new Date(inv.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {inv.status === "PENDING" && (
                          <button
                            onClick={() => handleRevokeInvite(inv.id)}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 rounded text-xs transition-colors"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Workspaces Tab */}
      {activeTab === "workspaces" && (
        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-slate-800/40 p-4 rounded-xl border border-gray-200 dark:border-slate-700/50 space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-200">
              Create New Workspace
            </h4>
            <form
              onSubmit={handleCreateWorkspace}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="text"
                placeholder="Workspace Name (e.g. Analytics)"
                value={newWsName}
                onChange={(e) => {
                  setNewWsName(e.target.value);
                  setNewWsSlug(
                    e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"),
                  );
                }}
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                required
              />
              <input
                type="text"
                placeholder="slug (e.g. analytics)"
                value={newWsSlug}
                onChange={(e) => setNewWsSlug(e.target.value)}
                className="w-48 px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Create Workspace
              </button>
            </form>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-200">
              Workspaces List
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  className={`p-4 rounded-xl border transition-all ${
                    ws.id === activeWorkspace?.id
                      ? "bg-cyan-50 dark:bg-cyan-950/30 border-cyan-400 dark:border-cyan-500/50 shadow-md shadow-cyan-950/20"
                      : "bg-gray-50 dark:bg-slate-800/40 border-gray-200 dark:border-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-800/80"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-semibold text-gray-900 dark:text-white">{ws.name}</h5>
                      <span className="text-xs text-gray-500 dark:text-slate-400 font-mono">
                        /{ws.slug}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        ws.status === "ACTIVE"
                          ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300"
                          : "bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-slate-400"
                      }`}
                    >
                      {ws.status}
                    </span>
                  </div>
                  {ws.description && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
                      {ws.description}
                    </p>
                  )}
                  <div className="text-xs text-gray-400 dark:text-slate-500 font-mono">
                    ID: {ws.id}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
