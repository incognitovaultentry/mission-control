"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { format } from "date-fns";
import { ArrowLeft, Zap, CheckCircle, XCircle, Clock, Activity } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";

type TabStatus = "all" | "running" | "completed" | "failed";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    running: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    completed: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    failed: "bg-red-500/10 text-red-400 border border-red-500/20",
  };
  const icons: Record<string, React.ReactNode> = {
    running: <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />,
    completed: <CheckCircle size={10} />,
    failed: <XCircle size={10} />,
  };
  return (
    <span className={clsx("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", styles[status] ?? "bg-gray-500/10 text-gray-400")}>
      {icons[status]}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function formatDuration(ms?: number) {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60000)}m`;
}

const tabs: { label: string; value: TabStatus; icon: React.ElementType }[] = [
  { label: "All", value: "all", icon: Activity },
  { label: "Running", value: "running", icon: Clock },
  { label: "Completed", value: "completed", icon: CheckCircle },
  { label: "Failed", value: "failed", icon: XCircle },
];

export default function TasksPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabStatus>("all");

  const tasks = useQuery(
    api.tasks.listTasks,
    activeTab === "all" ? {} : { status: activeTab }
  );

  // Fetch all agents to get agent names
  const agents = useQuery(api.agents.listAgents);
  const agentMap = new Map(agents?.map((a) => [a._id as string, a]) ?? []);

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
        <span className="text-gray-600">/</span>
        <span className="text-gray-300 text-sm">Tasks</span>
      </nav>

      <main className="px-6 py-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">All Tasks</h1>
          <span className="text-xs text-gray-500">
            {tasks?.length ?? 0} task{tasks?.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-[#111118] border border-[#1e1e2e] rounded-lg p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                activeTab === tab.value
                  ? "bg-[#1e1e2e] text-white"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <tab.icon size={12} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tasks table */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden">
          {!tasks || tasks.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              No {activeTab !== "all" ? activeTab : ""} tasks found
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e1e2e]">
                  <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Task</th>
                  <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Agent</th>
                  <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Status</th>
                  <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Started</th>
                  <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Duration</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, i) => {
                  const agent = agentMap.get(task.agentId as string);
                  return (
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
                          <div className="text-xs text-gray-500 mt-0.5">{task.description}</div>
                        )}
                        {task.error && (
                          <div className="text-xs text-red-400 mt-0.5">↳ {task.error}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {agent ? (
                          <Link
                            href={`/agents/${task.agentId}`}
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            {agent.name}
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-500">Unknown</span>
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
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
