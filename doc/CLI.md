# CLI Reference

Nexio CLI now supports both:

- instance setup/diagnostics (`onboard`, `doctor`, `configure`, `env`, `allowed-hostname`)
- control-plane client operations (issues, approvals, agents, activity, dashboard)

## Base Usage

Use repo script in development:

```sh
pnpm nexioai --help
```

First-time local bootstrap + run:

```sh
pnpm nexioai run
```

Choose local instance:

```sh
pnpm nexioai run --instance dev
```

## Deployment Modes

Mode taxonomy and design intent are documented in `doc/DEPLOYMENT-MODES.md`.

Current CLI behavior:

- `nexioai onboard` and `nexioai configure --section server` set deployment mode in config
- runtime can override mode with `NEXIO_DEPLOYMENT_MODE`
- `nexioai run` and `nexioai doctor` do not yet expose a direct `--mode` flag

Target behavior (planned) is documented in `doc/DEPLOYMENT-MODES.md` section 5.

Allow an authenticated/private hostname (for example custom Tailscale DNS):

```sh
pnpm nexioai allowed-hostname dotta-macbook-pro
```

All client commands support:

- `--data-dir <path>`
- `--api-base <url>`
- `--api-key <token>`
- `--context <path>`
- `--profile <name>`
- `--json`

Company-scoped commands also support `--company-id <id>`.

Use `--data-dir` on any CLI command to isolate all default local state (config/context/db/logs/storage/secrets) away from `~/.nexio`:

```sh
pnpm nexioai run --data-dir ./tmp/nexio-dev
pnpm nexioai issue list --data-dir ./tmp/nexio-dev
```

## Context Profiles

Store local defaults in `~/.nexio/context.json`:

```sh
pnpm nexioai context set --api-base http://localhost:3100 --company-id <company-id>
pnpm nexioai context show
pnpm nexioai context list
pnpm nexioai context use default
```

To avoid storing secrets in context, set `apiKeyEnvVarName` and keep the key in env:

```sh
pnpm nexioai context set --api-key-env-var-name NEXIO_API_KEY
export NEXIO_API_KEY=...
```

## Company Commands

```sh
pnpm nexioai company list
pnpm nexioai company get <company-id>
pnpm nexioai company delete <company-id-or-prefix> --yes --confirm <same-id-or-prefix>
```

Examples:

```sh
pnpm nexioai company delete PAP --yes --confirm PAP
pnpm nexioai company delete 5cbe79ee-acb3-4597-896e-7662742593cd --yes --confirm 5cbe79ee-acb3-4597-896e-7662742593cd
```

Notes:

- Deletion is server-gated by `NEXIO_ENABLE_COMPANY_DELETION`.
- With agent authentication, company deletion is company-scoped. Use the current company ID/prefix (for example via `--company-id` or `NEXIO_COMPANY_ID`), not another company.

## Issue Commands

```sh
pnpm nexioai issue list --company-id <company-id> [--status todo,in_progress] [--assignee-agent-id <agent-id>] [--match text]
pnpm nexioai issue get <issue-id-or-identifier>
pnpm nexioai issue create --company-id <company-id> --title "..." [--description "..."] [--status todo] [--priority high]
pnpm nexioai issue update <issue-id> [--status in_progress] [--comment "..."]
pnpm nexioai issue comment <issue-id> --body "..." [--reopen]
pnpm nexioai issue checkout <issue-id> --agent-id <agent-id> [--expected-statuses todo,backlog,blocked]
pnpm nexioai issue release <issue-id>
```

## Agent Commands

```sh
pnpm nexioai agent list --company-id <company-id>
pnpm nexioai agent get <agent-id>
pnpm nexioai agent local-cli <agent-id-or-shortname> --company-id <company-id>
```

`agent local-cli` is the quickest way to run local Claude/Codex manually as a Nexio agent:

- creates a new long-lived agent API key
- installs missing Nexio skills into `~/.codex/skills` and `~/.claude/skills`
- prints `export ...` lines for `NEXIO_API_URL`, `NEXIO_COMPANY_ID`, `NEXIO_AGENT_ID`, and `NEXIO_API_KEY`

Example for shortname-based local setup:

```sh
pnpm nexioai agent local-cli codexcoder --company-id <company-id>
pnpm nexioai agent local-cli claudecoder --company-id <company-id>
```

## Approval Commands

```sh
pnpm nexioai approval list --company-id <company-id> [--status pending]
pnpm nexioai approval get <approval-id>
pnpm nexioai approval create --company-id <company-id> --type hire_agent --payload '{"name":"..."}' [--issue-ids <id1,id2>]
pnpm nexioai approval approve <approval-id> [--decision-note "..."]
pnpm nexioai approval reject <approval-id> [--decision-note "..."]
pnpm nexioai approval request-revision <approval-id> [--decision-note "..."]
pnpm nexioai approval resubmit <approval-id> [--payload '{"...":"..."}']
pnpm nexioai approval comment <approval-id> --body "..."
```

## Activity Commands

```sh
pnpm nexioai activity list --company-id <company-id> [--agent-id <agent-id>] [--entity-type issue] [--entity-id <id>]
```

## Dashboard Commands

```sh
pnpm nexioai dashboard get --company-id <company-id>
```

## Heartbeat Command

`heartbeat run` now also supports context/api-key options and uses the shared client stack:

```sh
pnpm nexioai heartbeat run --agent-id <agent-id> [--api-base http://localhost:3100] [--api-key <token>]
```

## Local Storage Defaults

Default local instance root is `~/.nexio/instances/default`:

- config: `~/.nexio/instances/default/config.json`
- embedded db: `~/.nexio/instances/default/db`
- logs: `~/.nexio/instances/default/logs`
- storage: `~/.nexio/instances/default/data/storage`
- secrets key: `~/.nexio/instances/default/secrets/master.key`

Override base home or instance with env vars:

```sh
NEXIO_HOME=/custom/home NEXIO_INSTANCE_ID=dev pnpm nexioai run
```

## Storage Configuration

Configure storage provider and settings:

```sh
pnpm nexioai configure --section storage
```

Supported providers:

- `local_disk` (default; local single-user installs)
- `s3` (S3-compatible object storage)
