"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow, format } from "date-fns";
import {
  Activity, CheckCircle, XCircle, Zap, Users, X, Clock, AlertCircle, Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { useState } from "react";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    idle: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    running: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    error: "bg-red-500/20 text-red-400 border-red-500/30",
    offline: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  const dots: Record<string, string> = {
    idle: "bg-emerald-400",
    running: "bg-blue-400 animate-pulse",
    error: "bg-red-400",
    offline: "bg-gray-400",
  };
  const labels: Record<string, string> = {
    idle: "Idle", running: "Running", error: "Error", offline: "Offline",
  };
  return (
    <span className={clsx("inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border", colors[status] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30")}>
      <span className={clsx("w-1.5 h-1.5 rounded-full", dots[status] ?? "bg-gray-400")} />
      {labels[status] ?? status}
    </span>
  );
}

function TaskBadge({ status }: { status: string }) {
  const styles: Record<string, { icon: React.ReactNode; cls: string }> = {
    completed: { icon: <CheckCircle size={12} />, cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    failed: { icon: <XCircle size={12} />, cls: "text-red-400 bg-red-500/10 border-red-500/20" },
    running: { icon: <Activity size={12} className="animate-pulse" />, cls: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  };
  const s = styles[status] ?? { icon: null, cls: "text-gray-400 bg-gray-500/10 border-gray-500/20" };
  return (
    <span className={clsx("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium", s.cls)}>
      {s.icon}
      <span className="capitalize">{status}</span>
    </span>
  );
}

function LogLevel({ level }: { level: string }) {
  const colors: Record<string, string> = {
    info: "text-blue-400", warn: "text-amber-400", error: "text-red-400", debug: "text-gray-500",
  };
  return <span className={clsx("text-xs font-mono uppercase font-semibold", colors[level] ?? "text-gray-400")}>[{level}]</span>;
}

function AgentPanel({ agentId, onClose }: { agentId: Id<"agents">; onClose: () => void }) {
  const agent = useQuery(api.agents.getAgent, { id: agentId });
  const tasks = useQuery(api.tasks.listTasks, { agentId });
  const logs = useQuery(api.logs.listLogs, { agentId, limit: 40 });
  const stats = useQuery(api.agents.getAgentStats, { agentId });

  if (!agent) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-lg bg-[#0d0d14] border-l border-[#1e1e2e] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e1e2e] flex items-center justify-between">
          <div>
            <div className="font-semibold">{agent.name}</div>
            <div className="text-xs text-gray-400 mt-0.5">{agent.description}</div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={agent.status} />
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 px-5 py-4 border-b border-[#1e1e2e]">
          {[
            { label: "Total Tasks", value: stats?.total ?? 0 },
            { label: "Completion", value: `${stats?.completionRate ?? 0}%` },
            { label: "Failed", value: stats?.failed ?? 0 },
          ].map((s) => (
            <div key={s.label} className="bg-[#111118] rounded-lg p-3 text-center">
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 border-b border-[#1e1e2e]">
            <h3 className="text-xs font-medium text-gray-400 mb-3">Recent Tasks</h3>
            {!tasks || tasks.length === 0 ? (
              <p className="text-xs text-gray-600">No tasks yet</p>
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 10).map((task) => (
                  <div key={task._id} className="bg-[#111118] rounded-lg px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm text-gray-200 flex-1 min-w-0 truncate">{task.title}</span>
                      <TaskBadge status={task.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={10} />
                        {formatDistanceToNow(task.startedAt, { addSuffix: true })}
                      </span>
                      {task.durationMs && (
                        <span className="text-xs text-gray-500">
                          {task.durationMs < 1000 ? `${task.durationMs}ms` : `${(task.durationMs / 1000).toFixed(1)}s`}
                        </span>
                      )}
                    </div>
                    {task.error && (
                      <div className="mt-1.5 text-xs text-red-400 flex items-start gap-1">
                        <AlertCircle size={10} className="mt-0.5 flex-shrink-0" />
                        {task.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-5 py-4">
            <h3 className="text-xs font-medium text-gray-400 mb-3">Activity Log</h3>
            {!logs || logs.length === 0 ? (
              <p className="text-xs text-gray-600">No logs yet</p>
            ) : (
              <div className="space-y-2 font-mono">
                {logs.map((log) => (
                  <div key={log._id} className="text-xs">
                    <div className="flex items-center gap-2 mb-0.5">
                      <LogLevel level={log.level} />
                      <span className="text-gray-600">{format(log.timestamp, "HH:mm:ss")}</span>
                    </div>
                    <div className="text-gray-300 pl-1 break-words leading-relaxed">{log.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [selectedAgent, setSelectedAgent] = useState<Id<"agents"> | null>(null);

  const stats = useQuery(api.tasks.getGlobalStats);
  const agents = useQuery(api.agents.listAgents);
  const logs = useQuery(api.logs.listLogs, { limit: 40 });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <nav className="border-b border-[#1e1e2e] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0f]/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2 font-bold text-base">
          <Zap className="text-yellow-400" size={18} />
          Mission Control
        </div>
        <Link href="/tasks" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
          <LinkIcon size={12} />
          All Tasks
        </Link>
      </nav>

      <main className="px-6 py-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Agents", value: stats?.totalAgents ?? 0, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Running Tasks", value: stats?.runningTasks ?? 0, icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { label: "Completed Today", value: stats?.completedToday ?? 0, icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
            { label: "Failed Today", value: stats?.failedToday ?? 0, icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
          ].map((s) => (
            <div key={s.label} className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500">{s.label}</span>
                <div className={clsx("p-1.5 rounded-lg", s.bg)}>
                  <s.icon size={13} className={s.color} />
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Agents</h2>
            {(!agents || agents.length === 0) ? (
              <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-10 text-center">
                <Zap className="text-yellow-400/30 mx-auto mb-3" size={32} />
                <p className="text-gray-500 text-sm">No agents connected yet.</p>
                <p className="text-gray-600 text-xs mt-1">Tony will appear here once the API key is configured.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {agents.map((agent) => (
                  <button
                    key={agent._id}
                    onClick={() => setSelectedAgent(agent._id)}
                    className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 hover:border-[#2d2d4e] hover:bg-[#13131c] transition-all text-left w-full group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm group-hover:text-white transition-colors">{agent.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate">{agent.description}</div>
                      </div>
                      <StatusBadge status={agent.status} />
                    </div>
                    <div className="text-xs text-gray-600 flex items-center gap-1">
                      <Clock size={10} />
                      {formatDistanceToNow(agent.lastSeen, { addSuffix: true })}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Live Activity</h2>
            <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 h-[400px] overflow-y-auto">
              {(!logs || logs.length === 0) ? (
                <div className="text-center text-gray-600 text-xs mt-10">No activity yet</div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log._id} className="text-xs border-b border-[#1a1a28] pb-3 last:border-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <LogLevel level={log.level} />
                        <span className="text-gray-600">{formatDistanceToNow(log.timestamp, { addSuffix: true })}</span>
                      </div>
                      <div className="text-gray-400 break-words leading-relaxed">{log.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {selectedAgent && (
        <AgentPanel agentId={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}
    </div>
  );
}
