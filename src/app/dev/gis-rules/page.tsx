"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { MapView, MapMarker } from "@gis/map";

interface RuleFormState {
  name: string;
  description: string;
  triggerType: string;
  priority: number;
  subjectTypeScope: string;
  field: string;
  operator: string;
  value: string;
  actionType: string;
  alertSeverity: string;
  alertTitle: string;
  alertMessage: string;
  taskTitle: string;
  webhookUrl: string;
}

export default function GisRulesPlaygroundPage() {
  const [activeTab, setActiveTab] = useState<
    "builder" | "alerts" | "tasks" | "executions"
  >("builder");
  const [token, setToken] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Form State
  const [form, setForm] = useState<RuleFormState>({
    name: "Speed Boundary Alert Rule",
    description:
      "Generates HIGH severity alert when subject exceeds threshold inside zone",
    triggerType: "SPATIAL_ENTER",
    priority: 1,
    subjectTypeScope: "",
    field: "location.speed",
    operator: "GREATER_THAN",
    value: "80",
    actionType: "CREATE_ALERT",
    alertSeverity: "HIGH",
    alertTitle: "High Speed Boundary Entry",
    alertMessage:
      "Subject {{subject.id}} entered zone at speed {{location.speed}} km/h",
    taskTitle: "Inspect Spatial Subject",
    webhookUrl: "https://api.external-system.com/webhooks/spatial-events",
  });

  // Data Collections
  const [rulesList, setRulesList] = useState<any[]>([]);
  const [alertsList, setAlertsList] = useState<any[]>([]);
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [executionsList, setExecutionsList] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  // Dry Run State
  const [dryRunResult, setDryRunResult] = useState<any>(null);
  const [sampleSpeed, setSampleSpeed] = useState<number>(95);

  // Fetch token or use default auth token
  useEffect(() => {
    const savedToken = localStorage.getItem("accessToken") || "";
    setToken(savedToken);
  }, []);

  const getHeaders = useCallback(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  );

  // Load Rules, Alerts, Tasks & Metrics
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const [rRes, aRes, tRes, mRes] = await Promise.all([
        fetch("/api/v1/rules", { headers: getHeaders() }).then((r) => r.json()),
        fetch("/api/v1/alerts", { headers: getHeaders() }).then((r) =>
          r.json(),
        ),
        fetch("/api/v1/tasks", { headers: getHeaders() }).then((r) => r.json()),
        fetch("/api/v1/rules/metrics", { headers: getHeaders() }).then((r) =>
          r.json(),
        ),
      ]);

      if (rRes.success) setRulesList(rRes.data?.items || []);
      if (aRes.success) setAlertsList(aRes.data?.items || []);
      if (tRes.success) setTasksList(tRes.data?.items || []);
      if (mRes.success) setMetrics(mRes.data || null);
    } catch (err: any) {
      // Data load silently handled
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Human-Readable Rule Preview
  const naturalLanguageSummary = useMemo(() => {
    const triggerLabel =
      form.triggerType === "SPATIAL_ENTER"
        ? "subject ENTERS spatial zone"
        : form.triggerType === "SPATIAL_EXIT"
          ? "subject EXITS spatial zone"
          : form.triggerType === "LOCATION_UPDATED"
            ? "location position UPDATES"
            : `${form.triggerType} occurs`;

    const scopePart = form.subjectTypeScope
      ? ` for subject type '${form.subjectTypeScope}'`
      : "";

    const conditionPart = `IF ${form.field} ${form.operator.replace(/_/g, " ")} ${form.value}`;

    let actionPart = "";
    if (form.actionType === "CREATE_ALERT") {
      actionPart = `THEN generate ${form.alertSeverity} alert '${form.alertTitle}'`;
    } else if (form.actionType === "CREATE_TASK") {
      actionPart = `THEN create task '${form.taskTitle}'`;
    } else if (form.actionType === "SEND_WEBHOOK") {
      actionPart = `THEN send HTTP webhook to ${form.webhookUrl}`;
    } else {
      actionPart = `THEN execute ${form.actionType}`;
    }

    return `WHEN ${triggerLabel}${scopePart} ${conditionPart} ${actionPart}.`;
  }, [form]);

  // Construct Rule Config JSON Payload
  const buildRuleConfigPayload = () => {
    const valNum = parseFloat(form.value);
    const parsedVal = !isNaN(valNum) ? valNum : form.value;

    let actionPayload: any = {};
    if (form.actionType === "CREATE_ALERT") {
      actionPayload = {
        severity: form.alertSeverity,
        title: form.alertTitle,
        message: form.alertMessage,
      };
    } else if (form.actionType === "CREATE_TASK") {
      actionPayload = {
        title: form.taskTitle,
        priority: "HIGH",
      };
    } else if (form.actionType === "SEND_WEBHOOK") {
      actionPayload = {
        url: form.webhookUrl,
        method: "POST",
      };
    }

    return {
      name: form.name,
      description: form.description,
      priority: Number(form.priority),
      triggerType: form.triggerType,
      scope: form.subjectTypeScope
        ? { subjectType: form.subjectTypeScope }
        : {},
      configuration: {
        trigger: { type: form.triggerType },
        scope: form.subjectTypeScope
          ? { subjectType: form.subjectTypeScope }
          : {},
        conditions: {
          type: "group",
          logical: "AND",
          conditions: [
            {
              type: "atomic",
              field: form.field,
              operator: form.operator,
              value: parsedVal,
            },
          ],
        },
        actions: [
          {
            id: "act-1",
            type: form.actionType,
            order: 1,
            payload: actionPayload,
          },
        ],
        executionPolicy: "ALLOW_CONCURRENT",
        cooldownSeconds: 0,
        actionFailurePolicy: "STOP_ON_FAILURE",
      },
    };
  };

  // Create Rule Handler
  const handleSaveRule = async () => {
    try {
      setLoading(true);
      setStatusMsg(null);
      const payload = buildRuleConfigPayload();

      const res = await fetch("/api/v1/rules", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || "Failed to create rule");
      }

      setStatusMsg({
        text: `Rule '${data.data?.rule?.name}' created successfully as DRAFT!`,
        type: "success",
      });
      refreshData();
    } catch (err: any) {
      setStatusMsg({
        text: err.message || "Failed to create rule",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Activate Rule Handler
  const handleActivateRule = async (ruleId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/rules/${ruleId}/activate`, {
        method: "POST",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!data.success)
        throw new Error(data.error?.message || "Activation failed");
      setStatusMsg({ text: "Rule activated successfully!", type: "success" });
      refreshData();
    } catch (err: any) {
      setStatusMsg({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Deactivate Rule Handler
  const handleDeactivateRule = async (ruleId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/rules/${ruleId}/deactivate`, {
        method: "POST",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!data.success)
        throw new Error(data.error?.message || "Deactivation failed");
      setStatusMsg({ text: "Rule deactivated!", type: "info" });
      refreshData();
    } catch (err: any) {
      setStatusMsg({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Run Dry Run Simulation
  const handleDryRun = async () => {
    try {
      setLoading(true);
      const payload = buildRuleConfigPayload();

      const dryRunInput = {
        configuration: payload.configuration,
        context: {
          event: {
            id: `evt-test-${Date.now()}`,
            type: form.triggerType,
            timestamp: new Date().toISOString(),
          },
          subject: {
            id: "subj-sim-101",
            type: form.subjectTypeScope || "vehicle",
            name: "Simulated Subject",
          },
          location: {
            latitude: 18.5204,
            longitude: 73.8567,
            speed: sampleSpeed,
            heading: 120,
          },
          geofence: {
            id: "gf-zone-alpha",
            name: "Zone Alpha",
            state: "INSIDE",
            transition: "ENTER",
          },
          timestamp: new Date().toISOString(),
        },
      };

      const res = await fetch("/api/v1/rules/dry-run", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(dryRunInput),
      });

      const data = await res.json();
      if (!data.success)
        throw new Error(data.error?.message || "Dry run simulation failed");
      setDryRunResult(data.data);
      setStatusMsg({ text: "Dry run completed successfully!", type: "info" });
    } catch (err: any) {
      setStatusMsg({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Update Alert Status Handler
  const handleUpdateAlert = async (alertId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/v1/alerts/${alertId}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) refreshData();
    } catch (err) {}
  };

  // Map Markers from Spatial Alerts
  const mapAlertMarkers: MapMarker[] = useMemo(() => {
    return alertsList
      .filter((a) => a.geometry && a.geometry.type === "Point")
      .map((a) => ({
        id: a.id,
        coordinate: a.geometry.coordinates as [number, number],
        title: `${a.severity}: ${a.title}`,
        style: {
          fillColor:
            a.severity === "CRITICAL"
              ? "#ef4444"
              : a.severity === "HIGH"
                ? "#f97316"
                : a.severity === "MEDIUM"
                  ? "#eab308"
                  : "#3b82f6",
          circleRadius: 10,
          label: a.title,
        },
      }));
  }, [alertsList]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-amber-500/20">
            GIS
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Generic GIS Rules, Automation & Workflow Engine
            </h1>
            <p className="text-xs text-slate-400">
              Phase 11 Dev Playground & Rule Builder
            </p>
          </div>
        </div>

        {/* Operational Metrics Badges */}
        {metrics && (
          <div className="hidden md:flex items-center gap-4 text-xs">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <span className="text-slate-400">Total Evaluated:</span>
              <span className="font-bold text-white">
                {metrics.totalEvaluated}
              </span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <span className="text-slate-400">Matched:</span>
              <span className="font-bold text-emerald-400">
                {metrics.totalMatched}
              </span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <span className="text-slate-400">Avg Duration:</span>
              <span className="font-bold text-amber-400">
                {metrics.averageDurationMs} ms
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/50 p-4 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab("builder")}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition flex items-center justify-between ${
              activeTab === "builder"
                ? "bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/40 text-amber-300"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            }`}
          >
            <span>Rule Builder & Simulator</span>
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full">
              {rulesList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("alerts")}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition flex items-center justify-between ${
              activeTab === "alerts"
                ? "bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/40 text-amber-300"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            }`}
          >
            <span>Alert Center</span>
            <span className="text-xs bg-rose-950 text-rose-300 px-2 py-0.5 rounded-full border border-rose-800">
              {alertsList.filter((a) => a.status === "OPEN").length} Open
            </span>
          </button>

          <button
            onClick={() => setActiveTab("tasks")}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition flex items-center justify-between ${
              activeTab === "tasks"
                ? "bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/40 text-amber-300"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            }`}
          >
            <span>Workflow Tasks</span>
            <span className="text-xs bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-800">
              {tasksList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("executions")}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition flex items-center justify-between ${
              activeTab === "executions"
                ? "bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/40 text-amber-300"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            }`}
          >
            <span>Execution Audit Log</span>
          </button>

          <div className="mt-auto pt-4 border-t border-slate-800 text-xs text-slate-500 flex flex-col gap-1">
            <span>Status: Engine Active</span>
            <span>Idempotency: Enforced</span>
            <span>Worker: FOR UPDATE SKIP LOCKED</span>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Status Message Notification Banner */}
          {statusMsg && (
            <div
              className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
                statusMsg.type === "success"
                  ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                  : statusMsg.type === "error"
                    ? "bg-rose-950/60 border-rose-500/40 text-rose-300"
                    : "bg-blue-950/60 border-blue-500/40 text-blue-300"
              }`}
            >
              <span>{statusMsg.text}</span>
              <button
                onClick={() => setStatusMsg(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {/* TAB 1: VISUAL RULE BUILDER */}
          {activeTab === "builder" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Rule Builder Panel (2 columns) */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6 backdrop-blur">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    Visual Rule Builder (WHEN - IF - THEN)
                  </h2>

                  {/* Rule Name & Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Rule Name
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Priority (1 = High)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={form.priority}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            priority: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* 1. WHEN SECTION (Trigger) */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
                    <div className="flex items-center gap-2 font-semibold text-amber-400 text-sm">
                      <span className="px-2 py-0.5 bg-amber-950 text-amber-300 rounded text-xs border border-amber-800">
                        1. WHEN
                      </span>
                      <span>Event / Trigger occurs</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">
                          Trigger Type
                        </label>
                        <select
                          value={form.triggerType}
                          onChange={(e) =>
                            setForm({ ...form, triggerType: e.target.value })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                        >
                          <option value="SPATIAL_ENTER">
                            SPATIAL_ENTER (Enter Geofence)
                          </option>
                          <option value="SPATIAL_EXIT">
                            SPATIAL_EXIT (Exit Geofence)
                          </option>
                          <option value="LOCATION_UPDATED">
                            LOCATION_UPDATED (Telemetry Update)
                          </option>
                          <option value="SPATIAL_PROXIMITY_ENTER">
                            SPATIAL_PROXIMITY_ENTER
                          </option>
                          <option value="SCHEDULED">
                            SCHEDULED (Cron / Time)
                          </option>
                          <option value="MANUAL">MANUAL (On Demand)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 block mb-1">
                          Filter Subject Type (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. vehicle, employee, drone, asset"
                          value={form.subjectTypeScope}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              subjectTypeScope: e.target.value,
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. IF SECTION (Conditions) */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
                    <div className="flex items-center gap-2 font-semibold text-emerald-400 text-sm">
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded text-xs border border-emerald-800">
                        2. IF
                      </span>
                      <span>Conditions are satisfied</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">
                          Field Path
                        </label>
                        <input
                          type="text"
                          value={form.field}
                          onChange={(e) =>
                            setForm({ ...form, field: e.target.value })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 block mb-1">
                          Operator
                        </label>
                        <select
                          value={form.operator}
                          onChange={(e) =>
                            setForm({ ...form, operator: e.target.value })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                        >
                          <option value="EQUALS">EQUALS (=)</option>
                          <option value="NOT_EQUALS">NOT_EQUALS (≠)</option>
                          <option value="GREATER_THAN">
                            GREATER_THAN (&gt;)
                          </option>
                          <option value="GREATER_THAN_OR_EQUAL">
                            GREATER_THAN_OR_EQUAL (≥)
                          </option>
                          <option value="LESS_THAN">LESS_THAN (&lt;)</option>
                          <option value="CONTAINS">CONTAINS</option>
                          <option value="WITHIN_DISTANCE">
                            WITHIN_DISTANCE (Meters)
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 block mb-1">
                          Threshold Value
                        </label>
                        <input
                          type="text"
                          value={form.value}
                          onChange={(e) =>
                            setForm({ ...form, value: e.target.value })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. THEN SECTION (Actions) */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
                    <div className="flex items-center gap-2 font-semibold text-indigo-400 text-sm">
                      <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 rounded text-xs border border-indigo-800">
                        3. THEN
                      </span>
                      <span>Action is executed</span>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Action Type
                      </label>
                      <select
                        value={form.actionType}
                        onChange={(e) =>
                          setForm({ ...form, actionType: e.target.value })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white"
                      >
                        <option value="CREATE_ALERT">
                          CREATE_ALERT (Generic Alert)
                        </option>
                        <option value="CREATE_TASK">
                          CREATE_TASK (Workflow Task)
                        </option>
                        <option value="SEND_WEBHOOK">
                          SEND_WEBHOOK (SSRF Protected Webhook)
                        </option>
                        <option value="SEND_NOTIFICATION">
                          SEND_NOTIFICATION (Notification Abstraction)
                        </option>
                      </select>
                    </div>

                    {form.actionType === "CREATE_ALERT" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">
                            Alert Severity
                          </label>
                          <select
                            value={form.alertSeverity}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                alertSeverity: e.target.value,
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                          >
                            <option value="INFO">INFO</option>
                            <option value="LOW">LOW</option>
                            <option value="MEDIUM">MEDIUM</option>
                            <option value="HIGH">HIGH</option>
                            <option value="CRITICAL">CRITICAL</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">
                            Alert Title
                          </label>
                          <input
                            type="text"
                            value={form.alertTitle}
                            onChange={(e) =>
                              setForm({ ...form, alertTitle: e.target.value })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                          />
                        </div>
                      </div>
                    )}

                    {form.actionType === "SEND_WEBHOOK" && (
                      <div className="pt-2">
                        <label className="text-xs text-slate-400 block mb-1">
                          Webhook URL
                        </label>
                        <input
                          type="text"
                          value={form.webhookUrl}
                          onChange={(e) =>
                            setForm({ ...form, webhookUrl: e.target.value })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* Dynamic Natural Language Summary Preview */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-950 border border-amber-500/30 text-amber-200 text-sm">
                    <span className="font-bold text-amber-400 block text-xs uppercase tracking-wider mb-1">
                      Human-Readable Rule Summary:
                    </span>
                    <p className="italic">{naturalLanguageSummary}</p>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-4 pt-2">
                    <button
                      onClick={handleSaveRule}
                      disabled={loading}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-semibold text-sm shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
                    >
                      Save Rule Draft
                    </button>

                    <button
                      onClick={handleDryRun}
                      disabled={loading}
                      className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition disabled:opacity-50"
                    >
                      Run Dry Run Simulation
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Panel: Dry Run Output & Existing Rules List */}
              <div className="space-y-6">
                {/* Dry Run Results Card */}
                {dryRunResult && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h3 className="font-bold text-white text-sm">
                        Dry Run Simulation Result
                      </h3>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          dryRunResult.ruleMatched
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : "bg-rose-950 text-rose-300 border border-rose-800"
                        }`}
                      >
                        {dryRunResult.ruleMatched
                          ? "RULE MATCHED"
                          : "NOT MATCHED"}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Execution Time:</span>
                        <span className="text-white font-mono">
                          {dryRunResult.executionTimeMs} ms
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Trigger Matched:</span>
                        <span
                          className={
                            dryRunResult.triggerMatched
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }
                        >
                          {String(dryRunResult.triggerMatched)}
                        </span>
                      </div>
                    </div>

                    {/* Condition Breakdown */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <span className="text-xs font-semibold text-slate-400">
                        Condition Evaluations:
                      </span>
                      {dryRunResult.conditionResults?.map(
                        (res: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1"
                          >
                            <div className="flex justify-between">
                              <span className="font-mono text-slate-300">
                                {res.field}
                              </span>
                              <span
                                className={
                                  res.matched
                                    ? "text-emerald-400 font-bold"
                                    : "text-rose-400 font-bold"
                                }
                              >
                                {res.matched ? "MATCH" : "FAIL"}
                              </span>
                            </div>
                            <div className="text-slate-500 text-[11px]">
                              Expected {res.operator}{" "}
                              {String(res.expectedValue)} (Actual:{" "}
                              {String(res.actualValue)})
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Existing Rules List */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="font-bold text-white text-sm">
                    Configured Spatial Rules ({rulesList.length})
                  </h3>

                  {rulesList.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-4 text-center">
                      No rules created yet.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {rulesList.map((rule) => (
                        <div
                          key={rule.id}
                          className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">
                              {rule.name}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                rule.status === "ACTIVE"
                                  ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {rule.status}
                            </span>
                          </div>

                          <p className="text-slate-400 line-clamp-2">
                            {rule.description}
                          </p>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-900">
                            <span>Trigger: {rule.triggerType}</span>
                            <span>v{rule.currentVersion}</span>
                          </div>

                          <div className="flex gap-2 pt-1">
                            {rule.status !== "ACTIVE" ? (
                              <button
                                onClick={() => handleActivateRule(rule.id)}
                                className="px-3 py-1 rounded bg-emerald-900 hover:bg-emerald-800 text-emerald-200 text-[11px] transition"
                              >
                                Activate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDeactivateRule(rule.id)}
                                className="px-3 py-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 text-[11px] transition"
                              >
                                Deactivate
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ALERT CENTER */}
          {activeTab === "alerts" && (
            <div className="space-y-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Alert Center
                    </h2>
                    <p className="text-xs text-slate-400">
                      Real-time GIS & Rule Triggered Alerts
                    </p>
                  </div>
                  <button
                    onClick={refreshData}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs text-slate-200"
                  >
                    Refresh Alerts
                  </button>
                </div>

                {alertsList.length === 0 ? (
                  <p className="text-sm text-slate-500 py-8 text-center">
                    No alerts recorded yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {alertsList.map((alert) => (
                      <div
                        key={alert.id}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                                alert.severity === "CRITICAL"
                                  ? "bg-rose-950 text-rose-300 border border-rose-800"
                                  : alert.severity === "HIGH"
                                    ? "bg-amber-950 text-amber-300 border border-amber-800"
                                    : "bg-slate-800 text-slate-300"
                              }`}
                            >
                              {alert.severity}
                            </span>
                            <h3 className="font-bold text-white text-sm">
                              {alert.title}
                            </h3>
                          </div>
                          <p className="text-xs text-slate-300">
                            {alert.message}
                          </p>
                          <div className="text-[11px] text-slate-500 flex gap-4 pt-1">
                            <span>Status: {alert.status}</span>
                            <span>
                              Created:{" "}
                              {new Date(alert.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {alert.status === "OPEN" && (
                            <button
                              onClick={() =>
                                handleUpdateAlert(alert.id, "ACKNOWLEDGED")
                              }
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700"
                            >
                              Acknowledge
                            </button>
                          )}
                          {alert.status !== "RESOLVED" && (
                            <button
                              onClick={() =>
                                handleUpdateAlert(alert.id, "RESOLVED")
                              }
                              className="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-emerald-200 text-xs rounded-lg border border-emerald-700"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TASK CENTER */}
          {activeTab === "tasks" && (
            <div className="space-y-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6 backdrop-blur">
                <h2 className="text-lg font-bold text-white">
                  Workflow Task Center
                </h2>
                {tasksList.length === 0 ? (
                  <p className="text-sm text-slate-500 py-8 text-center">
                    No workflow tasks generated yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {tasksList.map((task) => (
                      <div
                        key={task.id}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 text-xs rounded border border-indigo-800 font-semibold">
                              {task.priority}
                            </span>
                            <h3 className="font-bold text-white text-sm">
                              {task.title}
                            </h3>
                          </div>
                          <p className="text-xs text-slate-400">
                            {task.description || "No description"}
                          </p>
                        </div>
                        <span className="text-xs text-slate-400">
                          {task.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: EXECUTION LOG */}
          {activeTab === "executions" && (
            <div className="space-y-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6 backdrop-blur">
                <h2 className="text-lg font-bold text-white">
                  Execution Audit Log
                </h2>
                <p className="text-xs text-slate-400">
                  Historical records of rule trigger evaluations
                </p>

                <div className="text-xs text-slate-400 italic py-4">
                  All historical executions reference rule version numbers and
                  are persisted across rule archive events.
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
