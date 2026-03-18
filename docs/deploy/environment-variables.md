---
title: Environment Variables
summary: Full environment variable reference
---

All environment variables that Paperclip uses for server configuration.

## Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3100` | Server port |
| `HOST` | `127.0.0.1` | Server host binding |
| `DATABASE_URL` | (embedded) | PostgreSQL connection string |
| `NEXIO_HOME` | `~/.paperclip` | Base directory for all Paperclip data |
| `NEXIO_INSTANCE_ID` | `default` | Instance identifier (for multiple local instances) |
| `NEXIO_DEPLOYMENT_MODE` | `local_trusted` | Runtime mode override |

## Secrets

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXIO_SECRETS_MASTER_KEY` | (from file) | 32-byte encryption key (base64/hex/raw) |
| `NEXIO_SECRETS_MASTER_KEY_FILE` | `~/.paperclip/.../secrets/master.key` | Path to key file |
| `NEXIO_SECRETS_STRICT_MODE` | `false` | Require secret refs for sensitive env vars |

## Agent Runtime (Injected into agent processes)

These are set automatically by the server when invoking agents:

| Variable | Description |
|----------|-------------|
| `NEXIO_AGENT_ID` | Agent's unique ID |
| `NEXIO_COMPANY_ID` | Company ID |
| `NEXIO_API_URL` | Paperclip API base URL |
| `NEXIO_API_KEY` | Short-lived JWT for API auth |
| `NEXIO_RUN_ID` | Current heartbeat run ID |
| `NEXIO_TASK_ID` | Issue that triggered this wake |
| `NEXIO_WAKE_REASON` | Wake trigger reason |
| `NEXIO_WAKE_COMMENT_ID` | Comment that triggered this wake |
| `NEXIO_APPROVAL_ID` | Resolved approval ID |
| `NEXIO_APPROVAL_STATUS` | Approval decision |
| `NEXIO_LINKED_ISSUE_IDS` | Comma-separated linked issue IDs |

## LLM Provider Keys (for adapters)

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key (for Claude Local adapter) |
| `OPENAI_API_KEY` | OpenAI API key (for Codex Local adapter) |
