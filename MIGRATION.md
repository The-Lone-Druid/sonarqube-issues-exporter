# Migrating from v4 to v5

v5 removes IDE integration, adds CSV export, switches the chart library from Recharts to ECharts, and adds a disk-based API cache.

## TL;DR

| v4                                           | v5                                           |
| -------------------------------------------- | -------------------------------------------- |
| `--editor <name>` flag on `serve`            | Flag removed — Open in IDE feature is gone   |
| `ide.projectRoots` config block              | Config key removed — delete from config file |
| Recharts charts                              | ECharts charts (no user action needed)       |
| In-memory API cache (lost on server restart) | Disk cache at `~/.sq-exporter/cache/`        |
| No CSV export                                | Export CSV button in the dashboard toolbar   |
| No `scan` command                            | `sonarqube-exporter scan` added              |

## Breaking changes

### IDE integration removed

The `--editor` flag and the `ide` config block no longer exist.

```diff
- sonarqube-exporter serve --editor vscode
+ sonarqube-exporter serve
```

Remove the `ide` key from `.sonarqube-exporter.json` if present:

```diff
  {
    "sonarqube": { ... },
    "server": { ... },
-   "ide": { "projectRoots": { "my_project": "/Users/me/code/my-project" } }
  }
```

No other config keys changed.

## New features

### CSV export

Click **Export CSV** in the Issues or Security Hotspots toolbar to download the currently filtered results. No CLI flag or configuration needed.

### `scan` command

```bash
sonarqube-exporter scan
```

Runs a SonarQube scan in the current directory using `sonarqube-scanner`, streams the log, and waits for the analysis to complete. Accepts `--project <key>`, `--branch <name>`, and standard connection flags.

### Disk-based cache

The server writes API responses to `~/.sq-exporter/cache/` and pre-loads them on startup. Dashboards open instantly after a server restart without re-fetching everything.

## Installing v5

```bash
npm install -g sonarqube-issues-exporter   # pulls @latest = 5.x
# or
npx sonarqube-issues-exporter serve
```

---

# Migrating from v3 to v4

v4 is a ground-up rewrite. v3 was a one-shot CLI that wrote a **static HTML
file** (`export`). v4 is a **local dashboard application** (`serve`) plus a
headless **`export-pdf`** for automation.

## TL;DR

| v3                                   | v4                                                            |
| ------------------------------------ | ------------------------------------------------------------- |
| `sq-exporter export` → `report.html` | `sq-exporter serve` → live dashboard in your browser          |
| Static HTML, regenerate to refresh   | Live, auto-refreshing dashboard; switch projects/branches/PRs |
| Shareable HTML artifact              | In-app **Export PDF** + `export-pdf` for CI                   |
| Node ≥ 18                            | **Node ≥ 20**                                                 |

## What changed

### Commands

- **`export` is removed.** Running it prints guidance. Replace it:
  - Interactive dashboard: `sonarqube-exporter serve`
  - File output for CI/stakeholders: `sonarqube-exporter export-pdf --project <key> -o report.pdf`
- `validate` and `setup` remain (setup now stores connection details; the
  project is chosen in the UI).

### Output

- The static HTML report, the `default`/`enhanced` Handlebars templates, and the
  `handlebars` dependency are **gone**. The report is now the live SPA, and PDF
  export renders it server-side via headless Chromium (falling back to the
  browser's own print when Chromium isn't available).

### Configuration

- Config file shape changed. v3 nested an `export` block and a required
  `sonarqube.projectKey`. v4 uses:

  ```json
  {
    "sonarqube": {
      "url": "...",
      "token": "...",
      "organization": "...",
      "defaultProjectKey": "..."
    },
    "server": { "port": 7010, "host": "127.0.0.1", "open": true, "auth": false }
  }
  ```

  Old files are read leniently: `sonarqube.projectKey` is mapped to
  `defaultProjectKey`. The `export.*` settings no longer apply.

- `projectKey` is now optional — you pick and switch projects in the UI.
- Removed env vars: `EXPORT_OUTPUT_PATH`, `EXPORT_FILENAME`,
  `EXPORT_EXCLUDE_STATUSES`, `EXPORT_INCLUDE_RESOLVED`, `EXPORT_MAX_ISSUES`,
  `EXPORT_TEMPLATE`. New: `SQ_PORT`, `SQ_HOST`. Still supported:
  `SONARQUBE_URL`, `SONARQUBE_TOKEN`, `SONARQUBE_ORGANIZATION`,
  `SONARQUBE_PROJECT_KEY` (→ default project), `LOG_LEVEL`.

### Library API

If you imported the package programmatically:

- `SonarQubeConfig` is split into `SonarQubeConnection` (`url`/`token`/
  `organization`) and a per-call `AnalysisTarget` (`projectKey` + optional
  `branch`/`pullRequest`).
- Functions now take `(connection, target)`:

  ```ts
  // v3
  const issues = await fetchAllIssues({ url, token, projectKey });

  // v4
  const issues = await fetchAllIssues({ url, token }, { projectKey });
  ```

- `exportToHtml` and the report-only types (`ProcessedIssue`, `ReportMetrics`,
  `ReportMetadata`, `EnhancedTemplateData`) are removed.
- New helpers: `listProjects`, `listBranches`, `listPullRequests`,
  `getSystemStatus`, `getIssueFacets`, `getSourceLines`, `toConnection`.

### Runtime

- **Node.js ≥ 20** is required (Playwright, Vite, and React 19 align on 20+).

## CI migration example

```diff
- - run: npx sonarqube-issues-exporter export --project my_project -o report.html
+ - run: npx playwright-core install chromium
+ - run: npx sonarqube-issues-exporter export-pdf --project my_project -o report.pdf
```

## Installing v4

v4.0.0 is the stable release on the `@latest` dist-tag:

```bash
npm install -g sonarqube-issues-exporter
```
