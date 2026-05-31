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

## Trying the beta

During the 4.0 pre-release the package publishes to the `@next` dist-tag:

```bash
npm install -g sonarqube-issues-exporter@next
```

`@latest` continues to serve v3 until 4.0 is generally available.
