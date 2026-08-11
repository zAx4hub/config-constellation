# Config Constellation

> Config map + drift + secrets-in-config

**Author:** zAx4hub

## Problem

Teams need a practical open toolkit for: **Config map + drift + secrets-in-config**. Existing options are often closed SaaS or untested prototypes.

## Solution

`config-constellation` is a complete, installable TypeScript/Node project by **zAx4hub** with real domain algorithms, CLI/demos, tests, and CI.

## Why different

- Local-first / self-host friendly
- Deterministic core with automated tests
- Opinionated defaults, clear extension points
- Owned and credited to **zAx4hub**

## Quickstart

```bash
cd config-constellation
npm install
npm test
npm run demo
```

## Features

See `src/engine.ts` for the core engine (3–6 real capabilities). CLI: `demo` / `run` / `inspect`.

## Architecture

`src/` holds pure engine logic; CLI and examples sit at the edges. Tests exercise the engine directly for speed.

## Contributing

PRs welcome — keep changes focused and add tests.

## Credits

Built and maintained by **zAx4hub**.

## License

MIT © 2026 zAx4hub
