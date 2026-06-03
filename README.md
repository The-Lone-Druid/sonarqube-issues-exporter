# sonarqube-issues-exporter

[![npm version](https://badge.fury.io/js/sonarqube-issues-exporter.svg)](https://badge.fury.io/js/sonarqube-issues-exporter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Run a local SonarQube dashboard on your own machine. View live issues, the
> quality gate, security hotspots, and coverage across projects, branches, and
> pull requests — then export a PDF for stakeholders. No more logging into the
> SonarQube dashboard or SSHing to a private VM for every check.

The tool starts a small local server that talks to your SonarQube/SonarCloud
server (your token stays on your machine) and opens a fast React dashboard in
your browser.

> **Upgrading?**
>
> - **v4 → v5**: IDE integration (`--editor`, `ide.projectRoots` config) was removed. CSV export, ECharts charts, and disk-based cache were added. See [MIGRATION.md](./MIGRATION.md).
> - **v3 → v4**: `export` (static HTML) was replaced by `serve` (live dashboard) + `export-pdf`. See [MIGRATION.md](./MIGRATION.md).

---

## Quick start

```bash
# No install needed — run it with npx:
npx sonarqube-issues-exporter serve \
  --url "https://your-sonarqube.example.com" \
  --token "YOUR_TOKEN"
```

This finds a free port, starts the dashboard on `http://127.0.0.1:7010`, and
opens it in your browser. Pick a project from the switcher and you're in.

Prefer a global install:

```bash
npm install -g sonarqube-issues-exporter
sonarqube-exporter serve          # or the short alias: sq-exporter serve
```

Save your connection once, then just run `serve`:

```bash
sonarqube-exporter setup          # interactive: writes .sonarqube-exporter.json
sonarqube-exporter serve
```

---

## Features

- **Live dashboard** — quality gate status with failing conditions, headline
  metric cards (bugs, vulnerabilities, code smells, hotspots, coverage, debt,
  ratings), and severity/type/status charts. Auto-refreshes on a poll.
- **Issues explorer** — sortable, searchable, faceted table (severity, type,
  status, tags) with a tabbed detail drawer: **Why** (rule root cause),
  **How to fix** (remediation + examples), **Code** (snippet with the offending
  line highlighted + git blame), and **Activity** (changelog).
- **CSV export** — download the current filtered issue list or hotspot list as a
  CSV from the dashboard toolbar (RFC 4180, all fields included).
- **ECharts visualisations** — interactive severity, type, and status distribution
  charts powered by Apache ECharts with full dark-mode support.
- **Disk-based cache** — API responses are persisted to `~/.sq-exporter/cache/`
  so the dashboard loads instantly after a server restart.
- **New Code focus** — an Overall / New code toggle (Clean as You Code) that
  filters issues and measures to the new code period.
- **In-app triage** _(opt-in)_ — resolve / false-positive / won't-fix, assign,
  comment, and change hotspot status without leaving the dashboard.
- **Security hotspots & measures** — priority/category breakdowns with a risk +
  fix drawer; coverage, duplication, LOC, technical debt, and A–E ratings.
- **Multi-project + branch/PR** — switch projects and branches/pull requests
  from the top bar; the selection lives in the URL so views are shareable.
- **PDF export** — a print-optimised report for PMs/SREs, rendered server-side
  via headless Chromium, with a browser-print fallback.
- **Token stays local** — the server holds the token and proxies the SonarQube
  API; it is never sent to the browser. Binds to `127.0.0.1` by default.

---

## Commands

| Command                      | Description                                                       |
| ---------------------------- | ----------------------------------------------------------------- |
| `serve`                      | Start the dashboard and open it in the browser (default command). |
| `validate`                   | Check the connection and that the token can see projects.         |
| `setup`                      | Interactively write a config file.                                |
| `export-pdf --project <key>` | Render a project report to a PDF (headless — for CI).             |
| `scan`                       | Run a SonarQube scan on the current directory and stream the log. |

### `serve` options

```text
-c, --config <path>     Path to configuration file
--url <url>             SonarQube server URL
--token <token>         SonarQube authentication token
--project <key>         Project to pre-select on startup
--organization <org>    SonarQube organization (for SonarCloud)
-p, --port <number>     Preferred port (auto-increments if busy; default 7010)
--host <host>           Host to bind (default 127.0.0.1)
--no-open               Do not open the browser automatically
--auth                  Require a local token for API access (shared machines)
--allow-write           Enable in-app triage (issue transitions, hotspot status)
-v, --verbose           Verbose logging
```

### In-app triage (write actions)

`serve --allow-write` enables resolving/assigning/commenting on issues and
changing hotspot status from the drawer (each action is confirmed). Writes are
rejected by the server unless this flag is set, and your token must have the
relevant SonarQube permissions.

---

## Configuration

Settings are resolved from CLI flags → config file → environment variables →
defaults. A config file (`.sonarqube-exporter.json` in the project or your home
directory) looks like:

```json
{
  "sonarqube": {
    "url": "https://sonarcloud.io",
    "token": "YOUR_TOKEN",
    "organization": "your-org",
    "defaultProjectKey": "your_project_key"
  },
  "server": { "port": 7010, "host": "127.0.0.1", "open": true, "auth": false, "allowWrite": false }
}
```

Environment variables: `SONARQUBE_URL`, `SONARQUBE_TOKEN`,
`SONARQUBE_ORGANIZATION`, `SONARQUBE_PROJECT_KEY`, `SQ_PORT`, `SQ_HOST`,
`LOG_LEVEL`. A local `.env` file is loaded automatically.

> **Never commit your token.** Keep it in `.env` or a config file that is
> gitignored.

---

## PDF export in CI

`export-pdf` boots the server on an ephemeral port, renders the report with
headless Chromium, writes the file, and exits:

```bash
sonarqube-exporter export-pdf --project my_project -o report.pdf
```

Chromium isn't bundled (to keep installs lean). On first use it is downloaded
once (~150 MB) via the optional `playwright-core` dependency. In CI, pre-install
it or point at a system browser:

```bash
npx playwright-core install chromium      # pre-install in your pipeline
# or disable auto-install and rely on the in-app browser-print fallback:
SQ_AUTO_INSTALL_BROWSER=false sonarqube-exporter serve
```

`PLAYWRIGHT_BROWSERS_PATH` and `PLAYWRIGHT_DOWNLOAD_HOST` are respected for
shared caches and corporate proxies.

---

## Using it as a library

The package still exports a framework-agnostic SonarQube client:

```ts
import { loadConfig, toConnection, listProjects, fetchAllIssues } from 'sonarqube-issues-exporter';

const config = loadConfig();
const conn = toConnection(config);
const { projects } = await listProjects(conn);
const issues = await fetchAllIssues(conn, { projectKey: projects[0].key });
```

---

## Architecture

Single npm package, three layers (one published artifact):

- `src/core` — framework-agnostic SonarQube client, config, types, formatting,
  and the public library entry.
- `src/server` — Hono server: REST proxy with a TTL cache (single-flight +
  stale-while-revalidate), static SPA serving, and the Playwright PDF renderer.
- `src/web` — React 19 + Vite + Tailwind + TanStack Query/Table + ECharts SPA,
  built into `dist/web` and served by the server.

```bash
pnpm install
pnpm dev          # Vite on :5173 proxying /api to the Hono server on :7010
pnpm build        # builds the SPA + bundles the server/CLI into dist/
pnpm test         # vitest
pnpm lint         # tsc (core + web) + eslint
```

Requires **Node.js ≥ 20**.

## License

MIT
