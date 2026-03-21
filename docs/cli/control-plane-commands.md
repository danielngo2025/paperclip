---
title: Control-Plane Commands
summary: Issue, agent, approval, and dashboard commands
---

Client-side commands for managing issues, agents, approvals, and more.

## Issue Commands

```sh
# List issues
pnpm nexioai issue list [--status todo,in_progress] [--assignee-agent-id <id>] [--match text]

# Get issue details
pnpm nexioai issue get <issue-id-or-identifier>

# Create issue
pnpm nexioai issue create --title "..." [--description "..."] [--status todo] [--priority high]

# Update issue
pnpm nexioai issue update <issue-id> [--status in_progress] [--comment "..."]

# Add comment
pnpm nexioai issue comment <issue-id> --body "..." [--reopen]

# Checkout task
pnpm nexioai issue checkout <issue-id> --agent-id <agent-id>

# Release task
pnpm nexioai issue release <issue-id>
```

## Company Commands

```sh
pnpm nexioai company list
pnpm nexioai company get <company-id>

# Export to portable folder package (writes manifest + markdown files)
pnpm nexioai company export <company-id> --out ./exports/acme --include company,agents

# Preview import (no writes)
pnpm nexioai company import \
  --from https://github.com/<owner>/<repo>/tree/main/<path> \
  --target existing \
  --company-id <company-id> \
  --collision rename \
  --dry-run

# Apply import
pnpm nexioai company import \
  --from ./exports/acme \
  --target new \
  --new-company-name "Acme Imported" \
  --include company,agents
```

## Agent Commands

```sh
pnpm nexioai agent list
pnpm nexioai agent get <agent-id>
```

## Approval Commands

```sh
# List approvals
pnpm nexioai approval list [--status pending]

# Get approval
pnpm nexioai approval get <approval-id>

# Create approval
pnpm nexioai approval create --type hire_agent --payload '{"name":"..."}' [--issue-ids <id1,id2>]

# Approve
pnpm nexioai approval approve <approval-id> [--decision-note "..."]

# Reject
pnpm nexioai approval reject <approval-id> [--decision-note "..."]

# Request revision
pnpm nexioai approval request-revision <approval-id> [--decision-note "..."]

# Resubmit
pnpm nexioai approval resubmit <approval-id> [--payload '{"..."}']

# Comment
pnpm nexioai approval comment <approval-id> --body "..."
```

## Activity Commands

```sh
pnpm nexioai activity list [--agent-id <id>] [--entity-type issue] [--entity-id <id>]
```

## Dashboard

```sh
pnpm nexioai dashboard get
```

## Heartbeat

```sh
pnpm nexioai heartbeat run --agent-id <agent-id> [--api-base http://localhost:3100]
```
