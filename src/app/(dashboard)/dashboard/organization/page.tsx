"use client";

import React, { useState } from "react";

interface MemberItem {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "DISPATCHER" | "DRIVER" | "VIEWER";
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
  lastActive: string;
}

const INITIAL_MEMBERS: MemberItem[] = [
  {
    id: "mem-01",
    name: "System Administrator",
    email: "admin@fleet.com",
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    lastActive: "Just now",
  },
  {
    id: "mem-02",
    name: "Dispatch Controller",
    email: "dispatcher@fleet.com",
    role: "DISPATCHER",
    status: "ACTIVE",
    lastActive: "12 mins ago",
  },
  {
    id: "mem-03",
    name: "Rajesh Sharma",
    email: "rajesh.sharma@fleet.com",
    role: "DRIVER",
    status: "ACTIVE",
    lastActive: "1 hour ago",
  },
  {
    id: "mem-04",
    name: "Amit Verma",
    email: "amit.verma@fleet.com",
    role: "DRIVER",
    status: "ACTIVE",
    lastActive: "4 hours ago",
  },
  {
    id: "mem-05",
    name: "Pooja Deshmukh",
    email: "pooja.deshmukh@fleet.com",
    role: "DRIVER",
    status: "INVITED",
    lastActive: "Pending confirmation",
  },
];

export default function OrganizationPage() {
  const [members, setMembers] = useState<MemberItem[]>(INITIAL_MEMBERS);
  const [activeWorkspace, setActiveWorkspace] = useState("ws-nagpur");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberItem["role"]>("DISPATCHER");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) return;

    const newMember: MemberItem = {
      id: `mem-${Date.now()}`,
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      status: "INVITED",
      lastActive: "Just invited",
    };

    setMembers((prev) => [newMember, ...prev]);
    setIsInviteModalOpen(false);
    setInviteEmail("");
    setInviteName("");
    setSuccessMsg(`Invitation sent to ${newMember.email}`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-white via-slate-50 to-blue-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-950 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm dark:shadow-xl text-gray-900 dark:text-white transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider rounded uppercase bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30">
              Multi-Tenant SaaS Boundary
            </span>
            <span className="text-xs text-gray-500 dark:text-slate-400">• Tenant ID: tenant_enterprise_01</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1.5 text-gray-900 dark:text-white">
            Organization & Workspace Operations
          </h1>
          <p className="text-xs text-gray-600 dark:text-slate-300 mt-1">
            Manage dispatch team rosters, role permissions, multi-branch workspaces, and tenant resource isolation.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsInviteModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-md"
        >
          <span>➕ Invite Team Member</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-medium animate-in fade-in flex items-center justify-between">
          <span>✓ {successMsg}</span>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-white text-xs ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Workspace Switcher Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>🏢 Branch Workspaces</span>
          <span className="text-xs text-gray-500 dark:text-slate-400 font-normal">
            (Select active dispatch workspace)
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              id: "ws-nagpur",
              name: "Nagpur Central Logistics Hub",
              region: "Vidarbha, Maharashtra",
              vehicles: 12,
              activeZones: 6,
              status: "PRIMARY",
            },
            {
              id: "ws-mumbai",
              name: "Mumbai Coastal Terminal Hub",
              region: "MMR / Konkan, Maharashtra",
              vehicles: 24,
              activeZones: 14,
              status: "BRANCH",
            },
            {
              id: "ws-pune",
              name: "Pune Western Freight Depot",
              region: "Western Maharashtra",
              vehicles: 8,
              activeZones: 4,
              status: "BRANCH",
            },
          ].map((ws) => (
            <button
              key={ws.id}
              type="button"
              onClick={() => setActiveWorkspace(ws.id)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                activeWorkspace === ws.id
                  ? "bg-blue-50 dark:bg-blue-950/80 border-blue-500 ring-1 ring-blue-500 text-blue-950 dark:text-white"
                  : "bg-white dark:bg-slate-900/80 border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 dark:text-white text-sm">{ws.name}</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    activeWorkspace === ws.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-400"
                  }`}
                >
                  {ws.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{ws.region}</p>
              <div className="flex items-center gap-4 text-[11px] text-gray-600 dark:text-slate-300 mt-3 pt-3 border-t border-gray-200 dark:border-slate-800/80">
                <span>🚚 {ws.vehicles} Vehicles</span>
                <span>📍 {ws.activeZones} Geofences</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Member Roster Table */}
      <div className="bg-white dark:bg-slate-900/90 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm dark:shadow-none transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Team Members & Role Entitlements</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {members.length} team members provisioned in tenant workspace.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700 dark:text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-950/50 text-[11px] font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Name</th>
                <th className="py-3 px-3">Email Address</th>
                <th className="py-3 px-3">Assigned Role</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 font-sans">
              {members.map((mem) => (
                <tr key={mem.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-semibold text-gray-900 dark:text-white">{mem.name}</td>
                  <td className="py-3 px-3 font-mono text-gray-700 dark:text-slate-300">{mem.email}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        mem.role === "SUPER_ADMIN"
                          ? "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                          : mem.role === "DISPATCHER"
                            ? "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                            : mem.role === "DRIVER"
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300"
                      }`}
                    >
                      {mem.role}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        mem.status === "ACTIVE"
                          ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80"
                          : "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80"
                      }`}
                    >
                      {mem.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-gray-500 dark:text-slate-400">{mem.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 text-gray-900 dark:text-white space-y-4 font-sans transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Invite Team Member</h3>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white flex items-center justify-center text-xs transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-gray-700 dark:text-slate-300 font-semibold block">Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Suresh Kamble"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-700 dark:text-slate-300 font-semibold block">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="suresh@fleet.com"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-700 dark:text-slate-300 font-semibold block">Role Assignment</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as MemberItem["role"])}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DISPATCHER">DISPATCHER (Live Tracking & Vehicles)</option>
                  <option value="DRIVER">DRIVER (Field Agent / Mobile App)</option>
                  <option value="ADMIN">ADMIN (Workspace Management)</option>
                  <option value="VIEWER">VIEWER (Read-Only Telemetry)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md transition-colors"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
