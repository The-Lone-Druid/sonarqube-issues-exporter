---
'sonarqube-issues-exporter': minor
---

feat(scan): in-app SonarQube scan — no more leaving the dashboard

### New features

- **`sonarqube-exporter scan` CLI command**: scans the current directory against your configured SonarQube/SonarCloud instance, streams live logs to stdout, and waits for the Compute Engine task to finish before exiting. Exits 0 on success, 1 on failure.
- **Scan button in the dashboard Topbar**: opens a slide-in log drawer showing live scanner output. Polls every second during active scans, auto-refreshes all dashboard data when analysis completes.
- **Auto-detects git branch**: passes the current branch name as `sonar.branch.name` automatically.
- **Respects `sonar-project.properties`**: if the file exists in the project root, project-level settings are read from it; only connection credentials (URL, token, organization) are injected by the tool.
- **No separate install required**: bundles `sonarqube-scanner` as a runtime dependency. On first run the scanner downloads its JRE and engine (~200 MB, cached for subsequent runs).
- **SonarCloud support**: `sonar.organization` is forwarded automatically from your existing configuration.
