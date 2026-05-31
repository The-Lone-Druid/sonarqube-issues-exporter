---
'sonarqube-issues-exporter': minor
---

Review-&-fix cockpit: turn the dashboard into a single place to review and fix
issues faster.

- Rich issue drawer with tabs: Why (rule root cause), How to fix (remediation +
  examples, sanitized HTML), Code (snippet with the offending line highlighted +
  git blame), and Activity (changelog). Security hotspots get a matching risk +
  fix drawer.
- Open in IDE: jump from a file:line to the exact spot in VS Code, Cursor,
  Windsurf, or JetBrains (path resolved from the working directory, with a
  per-project `ide.projectRoots` override; `serve --editor`).
- New Code focus (Clean as You Code): an Overall / New code toggle that filters
  issues and measures to the new code period.
- In-app triage (opt-in, `serve --allow-write`): resolve / false-positive /
  won't-fix, assign, comment, and change hotspot status, each confirmed; the
  server rejects writes unless enabled.
