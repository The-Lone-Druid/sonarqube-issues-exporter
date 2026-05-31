---
'sonarqube-issues-exporter': major
---

v4.0 — rewrite from a static HTML exporter into a local SonarQube dashboard app.

- `serve`: starts a local server and opens a live React dashboard in the browser
  (multi-project + branch/PR, quality gate, issues explorer, hotspots, measures),
  with polling auto-refresh and client-side filtering. The SonarQube token stays
  server-side; the server binds to localhost.
- `export-pdf` (and an in-app Export button): server-side PDF rendering via
  Playwright, with a browser-print fallback when Chromium is unavailable.
- The token is fetched and viewed locally, removing the need to log into the
  SonarQube dashboard or SSH to a private VM.

BREAKING CHANGES:

- The `export` command and static HTML output are removed (use `serve` or
  `export-pdf`). The HTML templates and the `handlebars` dependency are gone.
- Node.js >= 20 is now required (was >= 18).
- The library surface is the framework-agnostic core; `SonarQubeConfig` is split
  into `SonarQubeConnection` + a per-call `AnalysisTarget`, and config moves from
  a single `projectKey` to an optional `defaultProjectKey`.

See MIGRATION.md for details.
