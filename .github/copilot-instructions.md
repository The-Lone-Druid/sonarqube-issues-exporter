<!-- SPECKIT START -->

# sonarqube-issues-exporter — GitHub Copilot Agent Instructions

Read `.specify/memory/constitution.md` for the full governance rules. This file
gives you the quick-reference you need to work without breaking CI.

## CI Gate Sequence — run before every commit

```bash
pnpm lint          # tsc --noEmit (both tsconfigs) + eslint src tests
pnpm exec knip     # must exit 0 with zero findings (hints are OK, violations are not)
pnpm test:coverage # vitest run --coverage — coverage thresholds must hold
pnpm build         # clean + build:web (Vite) + build:server (tsup)
```

Run them in that order. `pnpm lint` catches type errors cheaply before the slower build.
Never disable a gate or use `--no-verify`. If a gate fails, fix it — then commit.

## Commit Message Rules (commitlint enforced)

Format: `<type>(<scope>): <subject>`

Allowed types: `build` `chore` `ci` `docs` `feat` `fix` `perf` `refactor` `revert` `style` `test`

Examples: `feat(export): add CSV download`, `fix(setup): hide token input`, `chore: version packages`

## Architecture — where things live

| Layer                       | Path                                 | Rule                                                   |
| --------------------------- | ------------------------------------ | ------------------------------------------------------ |
| Core (framework-agnostic)   | `src/core/`                          | No imports from `src/server` or `src/web`              |
| Server (Hono + cache + PDF) | `src/server/`                        | Imports `core` only                                    |
| Web (React SPA)             | `src/web/`                           | Imports `core` types only; zero Node built-ins         |
| CLI entry                   | `src/cli.ts`                         | Orchestrates server startup                            |
| Library surface             | `src/index.ts` → `src/core/index.ts` | `export type * from './types'` — removals are breaking |

Shared types have one source: `src/core/types.ts`.

## Key conventions

- **Charts**: ECharts via `echarts-for-react` (replaced Recharts). Components in `src/web/components/charts/breakdown.tsx` — `BreakdownBar` + `BreakdownDonut` preserve their props interface.
- **Theming**: CSS variables in `globals.css`; class-based dark mode (`<html class="dark">`). Use `useTheme()` to read current mode.
- **Cache**: in-memory TTL cache in `src/server/cache.ts`; also persists to `~/.sq-exporter/cache/` after each fetch.
- **Secrets**: token goes to `~/.sonarqube-exporter.env` (chmod 600), never in JSON config. `loadConfig()` auto-loads it.
- **Export**: `ExportMenu` in Topbar handles PDF + Issues CSV + Hotspots CSV. Client-side CSV via `src/web/lib/export.ts`.
- **Versioning**: Changesets (`pnpm changeset`). Breaking changes need a `major` entry **and** a `MIGRATION.md` update.
- **knip**: must stay at zero findings. Unused exports = CI failure. Wire everything up or delete it.

## Before you push

```bash
pnpm lint && pnpm exec knip && pnpm test:coverage && pnpm build
```

All four must pass. The release workflow also runs `pnpm build` — a build that passes locally will pass there.

<!-- SPECKIT END -->
