"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle, XCircle, Activity, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { useState } from "react";

type TabStatus = "all" | "running" | "completed" | "failed";

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

export default function Tasks() {
  const [activeTab, setActiveTab] = useState<TabStatus>("all");
  const tasks = useQuery(api.tasks.listTasks, { status: activeTab });
  const agents = useQuery(api.agents.listAgents);

  const agentMap = new Map(agents?.map((a) => [a._id, a.name]) ?? []);

  const tabs: { label: string; value: TabStatus }[] = [
    { label: "All", value: "all" },
    { label: "Running", value: "running" },
    { label: "Completed", value: "completed" },
    { label: "Failed", value: "failed" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <nav className="border-b border-[#1e1e2e] px-6 py-4 flex items-center gap-3 sticky top-0 bg-[#0a0a0f]/90 backdrop-blur-sm z-10">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <span className="font-semibold">All Tasks</span>
      </nav>

      <main className="px-6 py-6 max-w-5xl mx-auto">
        <div className="flex gap-1 bg-[#111118] border border-[#1e1e2e] rounded-lg p-1 w-fit mb-5">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={clsx(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                activeTab === tab.value ? "bg-[#1e1e2e] text-white" : "text-gray-500 hover:text-gray-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden">
          {!tasks || tasks.length === 0 ? (
            <div className="text-center py-16 text-gray-600 text-sm">No tasks found</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e1e2e]">
                  {["Agent", "Task", "Status", "Started", "Duration"].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, i) => (
                  <tr key={task._id} className={clsx("border-b border-[#1a1a28] last:border-0", i % 2 === 0 ? "" : "bg-white/[0.01]")}>
                    <td className="px-4 py-3 text-sm text-gray-400">{agentMap.get(task.agentId) ?? "Unknown"}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-200 max-w-xs truncate">{task.title}</div>
                      {task.error && <div className="text-xs text-red-400 mt-0.5 truncate max-w-xs">{task.error}</div>}
                    </td>
                    <td className="px-4 py-3"><TaskBadge status={task.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {formatDistanceToNow(task.startedAt, { addSuffix: true })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {task.durationMs
                        ? task.durationMs < 1000 ? `${task.durationMs}ms` : `${(task.durationMs / 1000).toFixed(1)}s`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
