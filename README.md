# Mission Control — AI Agent Dashboard

Real-time monitoring dashboard for AI agents. Built with Next.js + Convex + GitHub OAuth.

## Live: https://incognitovaultentry.pages.dev

---

## Setup Guide

### 1. Convex Setup
1. Go to https://convex.dev and create a free account
2. Install Convex CLI: `npm install -g convex`
3. In this directory: `npx convex dev` — this creates your deployment and generates types
4. Note your deployment URL (e.g., `happy-panda-123.convex.cloud`)

### 2. GitHub OAuth App
1. Go to https://github.com/settings/developers → New OAuth App
2. Homepage URL: `https://incognitovaultentry.pages.dev`
3. Callback URL: `https://<your-convex-deployment>.convex.site/api/auth/callback/github`
4. Note the Client ID and Client Secret

### 3. Convex Environment Variables
In the Convex dashboard (https://dashboard.convex.dev), go to your project → Settings → Environment Variables and add:

| Variable | Value |
|----------|-------|
| `AUTH_GITHUB_ID` | GitHub OAuth Client ID |
| `AUTH_GITHUB_SECRET` | GitHub OAuth Client Secret |
| `SITE_URL` | `https://incognitovaultentry.pages.dev` |
| `JWT_PRIVATE_KEY` | Generate with command below |
| `AGENT_API_KEY` | Random secret for agent API calls |

Generate JWT key:
```bash
openssl genpkey -algorithm ed25519 | openssl pkcs8 -topk8 -nocrypt -out - | cat
```

Generate API key:
```bash
openssl rand -hex 32
```

### 4. Convex Auth Setup
Run in the project directory:
```bash
npx @convex-dev/auth
```

### 5. Local Development
```bash
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_CONVEX_URL with your deployment URL
npm install
npm run dev
```

### 6. Deploy to Cloudflare Pages
1. Push this repo to GitHub (already done ✅)
2. Go to https://pages.cloudflare.com → New project → Connect to Git
3. Select the `mission-control` repo and set:
   - **Build command:** `npm run build`
   - **Output directory:** `out`
   - **Environment variable:** `NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud`
4. Deploy!

---

## Agent API Reference

**Base URL:** `https://<convex-deployment>.convex.site`

All requests require the header: `x-api-key: <AGENT_API_KEY>`

### Heartbeat
```http
POST /api/agent/heartbeat
Content-Type: application/json
x-api-key: <key>

{
  "slug": "tony",
  "name": "Tony ⚡",
  "description": "OpenClaw agent",
  "status": "idle"
}
```

### Start Task
```http
POST /api/agent/task/start
Content-Type: application/json
x-api-key: <key>

{
  "slug": "tony",
  "title": "Checking emails",
  "description": "Reading inbox"
}

→ { "taskId": "jd7..." }
```

### Complete Task
```http
POST /api/agent/task/complete
Content-Type: application/json
x-api-key: <key>

{ "taskId": "jd7..." }
```

### Fail Task
```http
POST /api/agent/task/fail
Content-Type: application/json
x-api-key: <key>

{ "taskId": "jd7...", "error": "Something went wrong" }
```

### Add Log
```http
POST /api/agent/log
Content-Type: application/json
x-api-key: <key>

{
  "slug": "tony",
  "level": "info",
  "message": "Processed 3 emails",
  "taskId": "jd7..."
}
```

**Log levels:** `info` | `warn` | `error` | `debug`

---

## Tony Integration (where to store the API key)

Store `AGENT_API_KEY` in `/root/.openclaw/workspace/.env` or wherever your OpenClaw config lives. Tony should read it from there when calling the Mission Control API.

Example heartbeat call from Tony:
```bash
curl -s -X POST https://<convex>.convex.site/api/agent/heartbeat \
  -H "Content-Type: application/json" \
  -H "x-api-key: $AGENT_API_KEY" \
  -d '{"slug":"tony","name":"Tony ⚡","description":"OpenClaw AI agent","status":"idle"}'
```

---

## Tech Stack

- **Next.js 14** — App Router, static export (`output: 'export'`)
- **Convex** — Real-time database + HTTP endpoints
- **@convex-dev/auth** — GitHub OAuth
- **Tailwind CSS** — Dark theme
- **lucide-react** — Icons
- **TypeScript** — Throughout
- **Cloudflare Pages** — Hosting
