import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const startTask = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!agent) throw new Error(`Agent ${args.slug} not found`);
    await ctx.db.patch(agent._id, { status: "running", lastSeen: Date.now() });
    return await ctx.db.insert("tasks", {
      agentId: agent._id,
      title: args.title,
      description: args.description,
      status: "running",
      startedAt: Date.now(),
    });
  },
});

export const completeTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    const now = Date.now();
    await ctx.db.patch(args.taskId, {
      status: "completed",
      completedAt: now,
      durationMs: now - task.startedAt,
    });
    await ctx.db.patch(task.agentId, { status: "idle", lastSeen: now });
  },
});

export const failTask = mutation({
  args: { taskId: v.id("tasks"), error: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    const now = Date.now();
    await ctx.db.patch(args.taskId, {
      status: "failed",
      completedAt: now,
      durationMs: now - task.startedAt,
      error: args.error,
    });
    await ctx.db.patch(task.agentId, { status: "error", lastSeen: now });
  },
});

export const listTasks = query({
  args: {
    agentId: v.optional(v.id("agents")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let tasks;
    if (args.agentId) {
      tasks = await ctx.db
        .query("tasks")
        .withIndex("by_agent", (q) => q.eq("agentId", args.agentId!))
        .order("desc")
        .take(100);
    } else {
      tasks = await ctx.db.query("tasks").order("desc").take(100);
    }
    if (args.status && args.status !== "all") {
      tasks = tasks.filter((t) => t.status === args.status);
    }
    return tasks;
  },
});

export const getGlobalStats = query({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db.query("agents").collect();
    const allTasks = await ctx.db.query("tasks").order("desc").take(1000);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTs = todayStart.getTime();
    const todayTasks = allTasks.filter((t) => t.startedAt >= todayTs);
    return {
      totalAgents: agents.length,
      activeAgents: agents.filter((a) => a.status === "running").length,
      completedToday: todayTasks.filter((t) => t.status === "completed").length,
      failedToday: todayTasks.filter((t) => t.status === "failed").length,
      runningTasks: allTasks.filter((t) => t.status === "running").length,
    };
  },
});
