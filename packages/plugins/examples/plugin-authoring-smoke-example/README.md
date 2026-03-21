# Plugin Authoring Smoke Example

A Nexio plugin

## Development

```bash
pnpm install
pnpm dev            # watch builds
pnpm dev:ui         # local dev server with hot-reload events
pnpm test
```

## Install Into Nexio

```bash
pnpm nexioai plugin install ./
```

## Build Options

- `pnpm build` uses esbuild presets from `@nexioai/plugin-sdk/bundlers`.
- `pnpm build:rollup` uses rollup presets from the same SDK.
