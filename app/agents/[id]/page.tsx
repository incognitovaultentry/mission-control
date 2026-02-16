"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow, format } from "date-fns";
import { ArrowLeft, Zap, CheckCircle, XCircle, Clock, Activity } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import clsx from "clsx";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    running: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    completed: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    failed: "bg-red-500/10 text-red-400 border border-red-500/20",
    idle: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
    error: "bg-red-500/10 text-red-400 border border-red-500/20",
    offline: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
  };
  const icons: Record<string, React.ReactNode> = {
    running: <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />,
    completed: <CheckCircle size={10} />,
    failed: <XCircle size={10} />,
    idle: <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />,
    error: <XCircle size={10} />,
    offline: <span className="w-1.5 h-1.5 rounded-full bg-gray-500 inline-block" />,
  };
  return (
    <span className={clsx("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", styles[status] ?? styles.offline)}>
      {icons[status]}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function LogLevelBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    info: "text-blue-400",
    warn: "text-amber-400",
    error: "text-red-400",
    debug: "text-gray-500",
  };
  return (
    <span className={clsx("text-xs font-mono uppercase w-12 shrink-0", colors[level] ?? "text-gray-400")}>
      [{level}]
    </span>
  );
}

function formatDuration(ms?: number) {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60000)}m`;
}

export default function AgentDetail() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();

  const id = params?.id as string;
  const agent = useQuery(api.agents.getAgent, id ? { id: id as Id<"agents"> } : "skip");
  const stats = useQuery(api.agents.getAgentStats, id ? { agentId: id as Id<"agents"> } : "skip");
  const tasks = useQuery(api.tasks.listTasks, id ? { agentId: id as Id<"agents"> } : "skip");
  const logs = useQuery(api.logs.listLogs, id ? { agentId: id as Id<"agents">, limit: 50 } : "skip");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push("/");
    return null;
  }

  if (agent === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Agent not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Nav */}
      <nav className="border-b border-[#1e1e2e] px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2 font-bold text-lg">
          <Zap className="text-yellow-400" size={20} />
          Mission Control
        </div>
      </nav>

      <main className="px-6 py-6 max-w-5xl mx-auto">
        {/* Agent header */}
        {agent ? (
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold mb-1">{agent.name}</h1>
                <p className="text-gray-400 text-sm">{agent.description}</p>
                <p className="text-gray-500 text-xs mt-2">
                  Last seen {formatDistanceToNow(agent.lastSeen, { addSuffix: true })}
                </p>
              </div>
              <StatusBadge status={agent.status} />
            </div>

            {/* Stats row */}
            {stats && (
              <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#1e1e2e]">
                {[
                  { label: "Total Tasks", value: stats.total, icon: Activity, color: "text-blue-400" },
                  { label: "Completed", value: stats.completed, icon: CheckCircle, color: "text-emerald-400" },
                  { label: "Failed", value: stats.failed, icon: XCircle, color: "text-red-400" },
                  { label: "Running", value: stats.running, icon: Clock, color: "text-amber-400" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                      <s.icon size={12} className={s.color} />
                      {s.label}
                    </div>
                    <div className="text-xl font-bold">{s.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6 mb-6 animate-pulse h-40" />
        )}

        {/* Task history */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-400 mb-3">Task History</h2>
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden">
            {!tasks || tasks.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No tasks yet</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e1e2e]">
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Title</th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Status</th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Started</th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, i) => (
                    <tr
                      key={task._id}
                      className={clsx(
                        "border-b border-[#1e1e2e] last:border-0",
                        i % 2 === 1 && "bg-[#0d0d14]"
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-sm">{task.title}</div>
                        {task.description && (
                          <div className="text-xs text-gray-400 mt-0.5">{task.description}</div>
                        )}
                        {task.error && (
                          <div className="text-xs text-red-400 mt-0.5">Error: {task.error}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {format(task.startedAt, "MMM d, HH:mm")}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                        {formatDuration(task.durationMs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Live log stream */}
        <div>
          <h2 className="text-sm font-medium text-gray-400 mb-3">Log Stream</h2>
          <div className="bg-[#0d0d14] border border-[#1e1e2e] rounded-xl p-4 h-[360px] overflow-y-auto font-mono">
            {!logs || logs.length === 0 ? (
              <div className="text-center text-gray-600 text-xs mt-8">No logs yet</div>
            ) : (
              <div className="space-y-1">
                {logs.map((log) => (
                  <div key={log._id} className="flex items-start gap-2 text-xs">
                    <span className="text-gray-600 shrink-0 w-14">
                      {format(log.timestamp, "HH:mm:ss")}
                    </span>
                    <LogLevelBadge level={log.level} />
                    <span
                      className={clsx("break-words", {
                        "text-blue-300": log.level === "info",
                        "text-amber-300": log.level === "warn",
                        "text-red-300": log.level === "error",
                        "text-gray-500": log.level === "debug",
                      })}
                    >
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
