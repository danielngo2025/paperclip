---
title: Setup Commands
summary: Onboard, run, doctor, and configure
---

Instance setup and diagnostics commands.

## `nexioai run`

One-command bootstrap and start:

```sh
pnpm nexioai run
```

Does:

1. Auto-onboards if config is missing
2. Runs `nexioai doctor` with repair enabled
3. Starts the server when checks pass

Choose a specific instance:

```sh
pnpm nexioai run --instance dev
```

## `nexioai onboard`

Interactive first-time setup:

```sh
pnpm nexioai onboard
```

First prompt:

1. `Quickstart` (recommended): local defaults (embedded database, no LLM provider, local disk storage, default secrets)
2. `Advanced setup`: full interactive configuration

Start immediately after onboarding:

```sh
pnpm nexioai onboard --run
```

Non-interactive defaults + immediate start (opens browser on server listen):

```sh
pnpm nexioai onboard --yes
```

## `nexioai doctor`

Health checks with optional auto-repair:

```sh
pnpm nexioai doctor
pnpm nexioai doctor --repair
```

Validates:

- Server configuration
- Database connectivity
- Secrets adapter configuration
- Storage configuration
- Missing key files

## `nexioai configure`

Update configuration sections:

```sh
pnpm nexioai configure --section server
pnpm nexioai configure --section secrets
pnpm nexioai configure --section storage
```

## `nexioai env`

Show resolved environment configuration:

```sh
pnpm nexioai env
```

## `nexioai allowed-hostname`

Allow a private hostname for authenticated/private mode:

```sh
pnpm nexioai allowed-hostname my-tailscale-host
```

## Local Storage Paths

| Data | Default Path |
|------|-------------|
| Config | `~/.nexio/instances/default/config.json` |
| Database | `~/.nexio/instances/default/db` |
| Logs | `~/.nexio/instances/default/logs` |
| Storage | `~/.nexio/instances/default/data/storage` |
| Secrets key | `~/.nexio/instances/default/secrets/master.key` |

Override with:

```sh
NEXIO_HOME=/custom/home NEXIO_INSTANCE_ID=dev pnpm nexioai run
```

Or pass `--data-dir` directly on any command:

```sh
pnpm nexioai run --data-dir ./tmp/nexio-dev
pnpm nexioai doctor --data-dir ./tmp/nexio-dev
```
