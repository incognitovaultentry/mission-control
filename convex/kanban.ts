import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listCards = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("kanbanCards").order("desc").collect();
  },
});

export const createCard = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("open"), v.literal("inprogress"), v.literal("review"), v.literal("done")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    assignedAgent: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("kanbanCards", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateCard = mutation({
  args: {
    id: v.id("kanbanCards"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal("open"), v.literal("inprogress"), v.literal("review"), v.literal("done"))),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    assignedAgent: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, { ...filtered, updatedAt: Date.now() });
  },
});

export const moveCard = mutation({
  args: {
    id: v.id("kanbanCards"),
    status: v.union(v.literal("open"), v.literal("inprogress"), v.literal("review"), v.literal("done")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status, updatedAt: Date.now() });
  },
});

export const deleteCard = mutation({
  args: { id: v.id("kanbanCards") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
