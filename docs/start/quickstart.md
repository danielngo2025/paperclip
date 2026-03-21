---
title: Quickstart
summary: Get Nexio running in minutes
---

Get Nexio running locally in under 5 minutes.

## Quick Start (Recommended)

```sh
npx nexioai onboard --yes
```

This walks you through setup, configures your environment, and gets Nexio running.

## Local Development

Prerequisites: Node.js 20+ and pnpm 9+.

```sh
pnpm install
pnpm dev
```

This starts the API server and UI at [http://localhost:3100](http://localhost:3100).

No external database required — Nexio uses an embedded PostgreSQL instance by default.

## One-Command Bootstrap

```sh
pnpm nexioai run
```

This auto-onboards if config is missing, runs health checks with auto-repair, and starts the server.

## What's Next

Once Nexio is running:

1. Create your first company in the web UI
2. Define a company goal
3. Create a CEO agent and configure its adapter
4. Build out the org chart with more agents
5. Set budgets and assign initial tasks
6. Hit go — agents start their heartbeats and the company runs

<Card title="Core Concepts" href="/start/core-concepts">
  Learn the key concepts behind Nexio
</Card>
