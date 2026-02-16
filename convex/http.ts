import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

// Agent API — protected by X-API-Key header
const checkApiKey = (request: Request) => {
  const key = request.headers.get("x-api-key");
  return key === process.env.AGENT_API_KEY;
};

// POST /api/agent/heartbeat
// Body: { slug, name, description?, status }
http.route({
  path: "/api/agent/heartbeat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkApiKey(request)) {
      return new Response("Unauthorized", { status: 401 });
    }
    const body = await request.json();
    await ctx.runMutation(api.agents.upsertAgent, body);
    return new Response("ok", { status: 200 });
  }),
});

// POST /api/agent/task/start
// Body: { slug, title, description? }
http.route({
  path: "/api/agent/task/start",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkApiKey(request)) {
      return new Response("Unauthorized", { status: 401 });
    }
    const body = await request.json();
    const taskId = await ctx.runMutation(api.tasks.startTask, body);
    return Response.json({ taskId });
  }),
});

// POST /api/agent/task/complete
// Body: { taskId }
http.route({
  path: "/api/agent/task/complete",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkApiKey(request)) {
      return new Response("Unauthorized", { status: 401 });
    }
    const body = await request.json();
    await ctx.runMutation(api.tasks.completeTask, body);
    return new Response("ok", { status: 200 });
  }),
});

// POST /api/agent/task/fail
// Body: { taskId, error? }
http.route({
  path: "/api/agent/task/fail",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkApiKey(request)) {
      return new Response("Unauthorized", { status: 401 });
    }
    const body = await request.json();
    await ctx.runMutation(api.tasks.failTask, body);
    return new Response("ok", { status: 200 });
  }),
});

// POST /api/agent/log
// Body: { slug, level, message, taskId? }
http.route({
  path: "/api/agent/log",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkApiKey(request)) {
      return new Response("Unauthorized", { status: 401 });
    }
    const body = await request.json();
    await ctx.runMutation(api.logs.addLog, body);
    return new Response("ok", { status: 200 });
  }),
});

// POST /api/kanban/card — create a card (agents can use this)
// Body: { title, description?, status?, priority?, assignedAgent?, tags? }
http.route({
  path: "/api/kanban/card",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkApiKey(request)) {
      return new Response("Unauthorized", { status: 401 });
    }
    const body = await request.json();
    const id = await ctx.runMutation(api.kanban.createCard, {
      title: body.title,
      description: body.description,
      status: body.status ?? "open",
      priority: body.priority ?? "medium",
      assignedAgent: body.assignedAgent,
      tags: body.tags,
    });
    return Response.json({ id });
  }),
});

// PATCH /api/kanban/card — move/update a card
// Body: { id, status?, title?, description?, priority? }
http.route({
  path: "/api/kanban/card",
  method: "PATCH",
  handler: httpAction(async (ctx, request) => {
    if (!checkApiKey(request)) {
      return new Response("Unauthorized", { status: 401 });
    }
    const body = await request.json();
    await ctx.runMutation(api.kanban.updateCard, body);
    return new Response("ok", { status: 200 });
  }),
});

export default http;
