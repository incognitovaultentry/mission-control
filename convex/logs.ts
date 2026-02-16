import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const addLog = mutation({
  args: {
    slug: v.string(),
    level: v.union(
      v.literal("info"),
      v.literal("warn"),
      v.literal("error"),
      v.literal("debug")
    ),
    message: v.string(),
    taskId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!agent) throw new Error(`Agent ${args.slug} not found`);
    await ctx.db.insert("logs", {
      agentId: agent._id,
      taskId: args.taskId,
      level: args.level,
      message: args.message,
      timestamp: Date.now(),
    });
    await ctx.db.patch(agent._id, { lastSeen: Date.now() });
  },
});

export const listLogs = query({
  args: {
    agentId: v.optional(v.id("agents")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    if (args.agentId) {
      return await ctx.db
        .query("logs")
        .withIndex("by_agent", (q) => q.eq("agentId", args.agentId!))
        .order("desc")
        .take(limit);
    }
    return await ctx.db.query("logs").order("desc").take(limit);
  },
});
