import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const upsertAgent = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("idle"), v.literal("running"), v.literal("error"), v.literal("offline")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agents")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        status: args.status,
        lastSeen: Date.now(),
        ...(args.description ? { description: args.description } : {}),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("agents", {
        slug: args.slug,
        name: args.name,
        description: args.description ?? "",
        status: args.status,
        lastSeen: Date.now(),
      });
    }
  },
});

export const listAgents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("agents").collect();
  },
});

export const getAgent = query({
  args: { id: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getAgentBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const getAgentStats = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const failed = tasks.filter((t) => t.status === "failed").length;
    const running = tasks.filter((t) => t.status === "running").length;
    const completionRate =
      total > 0 ? Math.round((completed / (total - running)) * 100) : 0;
    return { total, completed, failed, running, completionRate };
  },
});
