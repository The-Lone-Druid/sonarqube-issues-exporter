<!--
Sync Impact Report
==================
Version change: 1.0.0 → 1.1.0
Rationale: MINOR — expanded Principle I with exact CI command sequence; updated
Engineering Constraints (Recharts → ECharts); updated Principle III to reflect
credentials-file approach; added Principle I local verification checklist.

Changes:
  - Principle I: explicit ordered CI commands matching .github/workflows/ci.yml
  - Principle III: token storage updated to ~/.sonarqube-exporter.env approach
  - Engineering Constraints: Recharts replaced with ECharts
  - Commitlint allowed types listed explicitly

Templates reviewed:
  ✅ All templates — no structural changes needed
-->

# sonarqube-issues-exporter Constitution

This project is an npm package that runs a **local SonarQube dashboard** plus a headless
PDF export. It is built collaboratively by humans and AI agents. This constitution is the
highest-priority source of truth for how the project is changed; it exists so agents can work
effortlessly while humans stay in control of consequential decisions.

## Core Principles

### I. Quality Gates Are Law

Every change MUST leave the repository green. The CI pipeline (`ci.yml`) is the authority;
the exact commands that must pass locally before every commit are:

```
pnpm lint          # tsc --noEmit (Node + web tsconfigs) + eslint src tests
pnpm exec knip     # zero findings — unused exports/deps are a hard failure
pnpm test:coverage # vitest run --coverage — coverage thresholds in vitest.config.mts must hold
pnpm build         # pnpm clean && pnpm build:web && pnpm build:server
```

Run them **in that order** (lint first catches type errors before the slower build).
A change that breaks any gate is not "done" — it is in progress.
Gates are never disabled or downgraded to make a change pass; they are fixed.

Commits MUST follow **Conventional Commits** enforced by commitlint. Allowed types:
`build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`.
The `lint-staged` hook (ESLint + Prettier) also runs on every commit.

Rationale: deterministic, automated gates are what let agents move fast without humans
re-checking every line. The gates are the contract.

### II. Layered Architecture & Boundaries

The codebase has three layers and the boundaries are non-negotiable:

- `src/core` — framework-agnostic domain (SonarQube client, config, types, formatting). It
  MUST NOT import from `src/server` or `src/web`, nor from `hono`/server-only packages.
- `src/server` — the Hono server, cache, PDF renderer; depends on `core`.
- `src/web` — the React SPA; MUST NOT import Node built-ins or `src/server` (types from
  `core` are allowed).

These rules are enforced by ESLint `no-restricted-imports`. Shared types have a single source
in `src/core/types.ts`. The package MUST keep publishing as a single artifact with the SPA
bundled into `dist/web`.

Rationale: clear seams keep the core reusable as a library, keep the browser bundle free of
server code, and make it obvious where any given change belongs.

### III. Secret Safety & Local-First

The SonarQube token MUST stay server-side: it is held by the local server and used only to
proxy the SonarQube API; it MUST NOT be sent to the browser or appear in any `/api` response.
The server binds to `127.0.0.1` by default.

Secrets MUST NOT appear in JSON config files or be committed to version control. The
`sonarqube-exporter setup` command writes `SONARQUBE_TOKEN` (and `SONARQUBE_URL`) to
`~/.sonarqube-exporter.env` (chmod 600, home directory, never in a project folder) and omits
the token from the JSON config entirely. `loadConfig()` automatically loads this file before
any JSON config. The token input during `setup` is hidden (raw-mode stdin). Sending project
data to any external service is an outward-facing action subject to Principle V.

Rationale: the whole point of the tool is to view results locally without exposing
credentials; security here is a feature, not an afterthought.

### IV. Test-Backed & Verified

Core logic (SonarQube client, config, metrics, formatting) and server routes MUST be covered
by tests, using fetch mocking / `app.request` rather than real network calls. Coverage
thresholds defined in `vitest.config.mts` MUST hold. Beyond unit tests, a change is only
reported as working after it has been **verified end-to-end** appropriate to its scope
(e.g. `pnpm build` then run `serve`/`export-pdf`, or a pack-check of the tarball). Outcomes
MUST be reported faithfully: if a test fails or a step was skipped, say so with evidence.

Rationale: trustworthy automation requires that "done" means observed-to-work, not
assumed-to-work.

### V. Human-in-the-Loop for Consequential Actions

AI agents operate autonomously on reversible, in-repo work, but MUST pause for explicit human
approval before consequential or hard-to-reverse actions, including: publishing to npm,
pushing branches/tags, rewriting git history, deleting or overwriting files the agent did not
create, removing/adding dependencies, introducing breaking changes, and any outward-facing
call. Non-trivial work follows the spec-kit flow (`specify → clarify → plan → tasks →
implement`) with the human reviewing at each phase boundary. Plans for ambiguous or
high-impact work MUST be presented and approved before execution. Work MUST land in small,
reviewable, conventionally-named commits.

Rationale: humans stay in control of anything that affects the outside world or is costly to
undo, while agents handle the rest without friction.

### VI. Simplicity, Reuse & Lean Dependencies

Prefer existing utilities, patterns, and the standard library over new code. New runtime
dependencies MUST be justified and kept minimal; heavy/optional capabilities (e.g. the PDF
browser) are optional dependencies installed lazily, never bloating a base install. Dead code,
unused exports, and unused dependencies MUST be removed (`knip` stays at zero findings). Match
the style, naming, and comment density of surrounding code.

Rationale: a small, consistent surface is cheaper to maintain and far easier for the next
agent or human to reason about.

### VII. Compatibility & Semantic Versioning

Releases follow semantic versioning and are driven by Changesets. Any breaking change
(removed/renamed commands, config shape, library API, or a Node engine bump) REQUIRES a
`major` changeset and a corresponding entry in `MIGRATION.md`. Pre-release work publishes to
the `@next` dist-tag via Changesets pre mode; `@latest` is reserved for generally-available
releases. The published tarball MUST contain the bundled SPA and a runnable bin (verified by
`check-dist` / pack-check).

Rationale: predictable versioning and migration notes protect the teams who depend on this
package.

## Engineering Constraints

- **Runtime**: Node.js >= 20.
- **Language**: TypeScript in strict mode (including `exactOptionalPropertyTypes` and
  `noUncheckedIndexedAccess` for the Node project).
- **Package manager**: pnpm. **Build**: Vite (SPA) + tsup (library/server/CLI) into `dist/`.
- **Server**: Hono (localhost). **Web**: React 19 + Tailwind + TanStack Query/Table + ECharts (via echarts-for-react).
- **PDF**: `playwright-core` as an optional dependency, browser installed lazily on first use,
  with a browser-print fallback.
- **CI**: lint + knip + tests (Node 20 & 22) and a pack-check that installs the tarball and
  asserts `dist/web/index.html` ships and the bin runs.
- **Library API**: `src/core` is the public surface; document changes to it.

## AI Agent Workflow & Human-in-the-Loop

- Agents read this constitution and any project memory before acting, and keep the task list
  current as work proceeds.
- For substantive work, use spec-kit: write/confirm the spec, get clarifications, produce a
  plan, derive tasks, then implement — pausing at each boundary for human review. The
  configured git hooks offer commit checkpoints between phases.
- Agents propose; humans approve the consequential steps enumerated in Principle V. When a
  decision is genuinely the human's to make and cannot be resolved from the repo or sensible
  defaults, ask rather than guess.
- Keep commits small and conventional; never weaken a quality gate to land a change; report
  results honestly, including failures and skipped steps.

## Governance

This constitution supersedes other practices when they conflict. Amendments are made by
editing this file via a normal reviewed change (`/speckit-constitution`), with a Sync Impact
Report describing the change and its version bump.

Versioning of this document follows semantic versioning:

- **MAJOR**: principle removed/redefined or other backward-incompatible governance change.
- **MINOR**: a new principle/section added or materially expanded guidance.
- **PATCH**: clarifications and wording fixes with no semantic change.

Compliance: every plan's "Constitution Check" MUST verify alignment with these principles, and
reviewers (human or agent) MUST confirm compliance before work is considered complete. Any
deliberate deviation MUST be justified in writing in the relevant plan or PR. Day-to-day
runtime guidance for contributors lives in `README.md` and `MIGRATION.md`.

**Version**: 1.1.0 | **Ratified**: 2026-05-31 | **Last Amended**: 2026-06-03
