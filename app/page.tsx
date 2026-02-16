"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  CheckCircle,
  XCircle,
  Zap,
  Users,
  LogOut,
  Github,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    idle: "bg-emerald-500",
    running: "bg-blue-500 animate-pulse",
    error: "bg-red-500",
    offline: "bg-gray-500",
  };
  const labels: Record<string, string> = {
    idle: "Idle",
    running: "Running",
    error: "Error",
    offline: "Offline",
  };
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium">
      <span
        className={clsx("w-2 h-2 rounded-full", colors[status] ?? "bg-gray-500")}
      />
      {labels[status] ?? status}
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
    <span
      className={clsx(
        "text-xs font-mono uppercase",
        colors[level] ?? "text-gray-400"
      )}
    >
      [{level}]
    </span>
  );
}

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();

  const stats = useQuery(api.tasks.getGlobalStats);
  const agents = useQuery(api.agents.listAgents);
  const logs = useQuery(api.logs.listLogs, { limit: 30 });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <div className="flex items-center gap-2 text-2xl font-bold">
          <Zap className="text-yellow-400" size={28} />
          Mission Control
        </div>
        <p className="text-gray-400 text-sm">
          Sign in to monitor your AI agents
        </p>
        <button
          onClick={() => void signIn("github")}
          className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
        >
          <Github size={18} />
          Sign in with GitHub
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Nav */}
      <nav className="border-b border-[#1e1e2e] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Zap className="text-yellow-400" size={20} />
          Mission Control
        </div>
        <button
          onClick={() => void signOut()}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </nav>

      <main className="px-6 py-6 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Total Agents",
              value: stats?.totalAgents ?? 0,
              icon: Users,
              color: "text-blue-400",
            },
            {
              label: "Active Now",
              value: stats?.runningTasks ?? 0,
              icon: Activity,
              color: "text-emerald-400",
            },
            {
              label: "Completed Today",
              value: stats?.completedToday ?? 0,
              icon: CheckCircle,
              color: "text-green-400",
            },
            {
              label: "Failed Today",
              value: stats?.failedToday ?? 0,
              icon: XCircle,
              color: "text-red-400",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">{s.label}</span>
                <s.icon size={14} className={s.color} />
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Agents */}
          <div className="lg:col-span-2">
            <h2 className="text-sm font-medium text-gray-400 mb-3">Agents</h2>
            {!agents || agents.length === 0 ? (
              <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-8 text-center text-gray-500 text-sm">
                No agents connected yet. Tony will appear here once the API key
                is configured.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {agents.map((agent) => (
                  <Link key={agent._id} href={`/agents/${agent._id}`}>
                    <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 hover:border-[#2d2d4e] transition-colors cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-medium text-sm">{agent.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {agent.description}
                          </div>
                        </div>
                        <StatusBadge status={agent.status} />
                      </div>
                      <div className="text-xs text-gray-500">
                        Last seen{" "}
                        {formatDistanceToNow(agent.lastSeen, {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div>
            <h2 className="text-sm font-medium text-gray-400 mb-3">
              Live Activity
            </h2>
            <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 h-[420px] overflow-y-auto">
              {!logs || logs.length === 0 ? (
                <div className="text-center text-gray-500 text-xs mt-8">
                  No activity yet
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div key={log._id} className="text-xs">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <LogLevelBadge level={log.level} />
                        <span className="text-gray-500">
                          {formatDistanceToNow(log.timestamp, {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <div className="text-gray-300 pl-1 break-words">
                        {log.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick link to tasks */}
        <div className="mt-4">
          <Link
            href="/tasks"
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            View all tasks →
          </Link>
        </div>
      </main>
    </div>
  );
}
