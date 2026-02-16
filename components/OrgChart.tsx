"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowLeft, Zap, Crown } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";

const ORG: {
  founder: OrgNode;
  ceo: OrgNode;
  team: OrgNode[];
} = {
  founder: {
    slug: "founder",
    name: "Farhad",
    role: "Founder",
    emoji: "👑",
    color: "border-yellow-500/50 bg-yellow-500/5",
    dotColor: "bg-yellow-400",
  },
  ceo: {
    slug: "tony",
    name: "Tony",
    role: "CEO",
    emoji: "⚡",
    color: "border-blue-500/50 bg-blue-500/5",
    dotColor: "bg-blue-400",
  },
  team: [
    {
      slug: "sam",
      name: "Sam",
      role: "Product Manager",
      emoji: "🧭",
      color: "border-purple-500/40 bg-purple-500/5",
      dotColor: "bg-purple-400",
    },
    {
      slug: "alex",
      name: "Alex",
      role: "CMO / Head of Growth",
      emoji: "📣",
      color: "border-pink-500/40 bg-pink-500/5",
      dotColor: "bg-pink-400",
    },
    {
      slug: "maya",
      name: "Maya",
      role: "Content & Copy",
      emoji: "✍️",
      color: "border-green-500/40 bg-green-500/5",
      dotColor: "bg-green-400",
    },
    {
      slug: "kai",
      name: "Kai",
      role: "SEO Specialist",
      emoji: "🔍",
      color: "border-orange-500/40 bg-orange-500/5",
      dotColor: "bg-orange-400",
    },
    {
      slug: "riley",
      name: "Riley",
      role: "Email & Lifecycle",
      emoji: "📧",
      color: "border-teal-500/40 bg-teal-500/5",
      dotColor: "bg-teal-400",
    },
  ],
};

type OrgNode = {
  slug: string;
  name: string;
  role: string;
  emoji: string;
  color: string;
  dotColor: string;
};

type AgentStatus = "idle" | "running" | "error" | "offline";

const STATUS_LABEL: Record<AgentStatus, string> = {
  idle: "Idle",
  running: "Running",
  error: "Error",
  offline: "Offline",
};

const STATUS_DOT: Record<AgentStatus, string> = {
  idle: "bg-emerald-400",
  running: "bg-blue-400 animate-pulse",
  error: "bg-red-400",
  offline: "bg-gray-600",
};

function NodeCard({
  node,
  agentData,
  size = "md",
}: {
  node: OrgNode;
  agentData?: { status: AgentStatus; lastSeen: number } | null;
  size?: "lg" | "md" | "sm";
}) {
  const status: AgentStatus = agentData?.status ?? "offline";

  return (
    <div
      className={clsx(
        "relative border rounded-2xl flex flex-col items-center text-center transition-all hover:scale-105",
        node.color,
        size === "lg" && "px-8 py-5 min-w-[160px]",
        size === "md" && "px-5 py-4 min-w-[130px]",
        size === "sm" && "px-4 py-3 min-w-[120px]",
      )}
    >
      {/* Status dot */}
      <span className="absolute top-2.5 right-2.5 flex items-center gap-1">
        <span className={clsx("w-1.5 h-1.5 rounded-full", STATUS_DOT[status])} />
      </span>

      <div className={clsx("mb-1.5", size === "lg" ? "text-3xl" : size === "md" ? "text-2xl" : "text-xl")}>
        {node.emoji}
      </div>
      <div className={clsx("font-bold text-white", size === "lg" ? "text-base" : "text-sm")}>
        {node.name}
      </div>
      <div className={clsx("text-gray-400 mt-0.5 leading-tight", size === "lg" ? "text-xs" : "text-[11px]")}>
        {node.role}
      </div>
      <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-500">
        <span className={clsx("w-1.5 h-1.5 rounded-full", STATUS_DOT[status])} />
        {STATUS_LABEL[status]}
        {agentData && status !== "offline" && (
          <span className="text-gray-700"> · {formatDistanceToNow(agentData.lastSeen, { addSuffix: true })}</span>
        )}
      </div>
    </div>
  );
}

// Vertical connector line
function VLine({ height = 32 }: { height?: number }) {
  return <div className="w-px bg-[#2a2a3e] mx-auto" style={{ height }} />;
}

// Horizontal connector spanning multiple children
function HConnector({ count }: { count: number }) {
  if (count <= 1) return null;
  return (
    <div className="flex items-center justify-center w-full px-[calc(50%/var(--cols,5))]">
      <div className="flex-1 h-px bg-[#2a2a3e]" />
    </div>
  );
}

export default function OrgChart() {
  const agents = useQuery(api.agents.listAgents);

  const agentMap = new Map(
    (agents ?? []).map((a) => [a.slug, { status: a.status as AgentStatus, lastSeen: a.lastSeen }])
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* Nav */}
      <nav className="border-b border-[#1e1e2e] px-6 py-4 flex items-center gap-3 sticky top-0 bg-[#0a0a0f]/90 backdrop-blur-sm z-10">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex items-center gap-2 font-bold text-base">
          <Zap className="text-yellow-400" size={16} />
          Team
        </div>
        <span className="text-xs text-gray-600">
          {1 + 1 + ORG.team.length} members · {(agents ?? []).filter(a => a.status !== "offline").length} online
        </span>
      </nav>

      <main className="flex-1 flex flex-col items-center px-6 py-10">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-xl font-bold text-white mb-1">Sitepins Growth Team</h1>
          <p className="text-sm text-gray-500">AI-powered team working toward $10K MRR</p>
        </div>

        {/* Founder */}
        <NodeCard node={ORG.founder} agentData={null} size="lg" />

        {/* Founder → CEO */}
        <VLine height={36} />

        {/* CEO */}
        <NodeCard node={ORG.ceo} agentData={agentMap.get("tony") ?? null} size="lg" />

        {/* CEO → Team connector */}
        <VLine height={36} />

        {/* Horizontal top bar spanning team */}
        <div className="relative w-full max-w-4xl flex items-start justify-center">
          {/* Top horizontal line */}
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-[#2a2a3e]" />

          {/* Team columns */}
          <div className="flex gap-4 items-start justify-center w-full">
            {ORG.team.map((member) => (
              <div key={member.slug} className="flex flex-col items-center flex-1">
                {/* Drop line from top bar */}
                <VLine height={32} />
                <NodeCard
                  node={member}
                  agentData={agentMap.get(member.slug) ?? null}
                  size="sm"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-16 flex items-center gap-5 text-xs text-gray-600 border border-[#1e1e2e] rounded-xl px-5 py-3">
          {(["idle", "running", "error", "offline"] as AgentStatus[]).map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className={clsx("w-2 h-2 rounded-full", STATUS_DOT[s])} />
              {STATUS_LABEL[s]}
            </span>
          ))}
        </div>

        {/* Objective note */}
        <div className="mt-6 max-w-lg text-center">
          <p className="text-xs text-gray-600">
            All agents report to Tony ⚡. Farhad sets objectives — Tony coordinates execution.
          </p>
        </div>
      </main>
    </div>
  );
}
