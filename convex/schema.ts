import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  agents: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    status: v.union(v.literal("idle"), v.literal("running"), v.literal("error"), v.literal("offline")),
    lastSeen: v.number(),
  }).index("by_slug", ["slug"]),
  tasks: defineTable({
    agentId: v.id("agents"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("running"), v.literal("completed"), v.literal("failed")),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    durationMs: v.optional(v.number()),
    error: v.optional(v.string()),
  }).index("by_agent", ["agentId"]).index("by_status", ["status"]),
  logs: defineTable({
    agentId: v.id("agents"),
    taskId: v.optional(v.id("tasks")),
    level: v.union(v.literal("info"), v.literal("warn"), v.literal("error"), v.literal("debug")),
    message: v.string(),
    timestamp: v.number(),
  }).index("by_agent", ["agentId"]).index("by_task", ["taskId"]),
});
