# Using sonarqube-issues-exporter

## Installation

### Global install (recommended)

```bash
npm install -g sonarqube-issues-exporter
sonarqube-exporter --help
# or the short alias
sq-exporter --help
```

### No-install via npx

```bash
npx sonarqube-issues-exporter serve --url "https://your-sonarqube.example.com" --token "YOUR_TOKEN"
```

Requires Node.js ≥ 20.

---

## Quick start

```bash
npx sonarqube-issues-exporter serve \
  --url "https://your-sonarqube.example.com" \
  --token "YOUR_TOKEN"
```

This finds a free port, starts the dashboard on `http://127.0.0.1:7010`, and opens it in your browser. Pick a project from the switcher and you're in.

Or save your connection once with the setup wizard:

```bash
sonarqube-exporter setup
sonarqube-exporter serve
```

---

## Commands

| Command                      | Description                                                       |
| ---------------------------- | ----------------------------------------------------------------- |
| `serve`                      | Start the live dashboard and open it in the browser (default).    |
| `validate`                   | Check the connection and that the token can see projects.         |
| `setup`                      | Interactively write a config file and store credentials.          |
| `export-pdf --project <key>` | Render a project report to a PDF (headless — for CI).             |
| `scan`                       | Run a SonarQube scan on the current directory and stream the log. |

---

## `serve` options

```
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

---

## Configuration

Settings are resolved from CLI flags → config file → environment variables → defaults.

### Config file

Create `.sonarqube-exporter.json` in your project directory or home directory:

```json
{
  "sonarqube": {
    "url": "https://sonarcloud.io",
    "token": "YOUR_TOKEN",
    "organization": "your-org",
    "defaultProjectKey": "your_project_key"
  },
  "server": {
    "port": 7010,
    "host": "127.0.0.1",
    "open": true,
    "auth": false,
    "allowWrite": false
  }
}
```

> **Never commit your token.** Use `sonarqube-exporter setup` — it stores the token in `~/.sonarqube-exporter.env` (chmod 600), separate from the JSON config.

### Environment variables

| Variable                 | Description                           |
| ------------------------ | ------------------------------------- |
| `SONARQUBE_URL`          | SonarQube server URL                  |
| `SONARQUBE_TOKEN`        | Authentication token                  |
| `SONARQUBE_ORGANIZATION` | Organization key (SonarCloud)         |
| `SONARQUBE_PROJECT_KEY`  | Default project key                   |
| `SQ_PORT`                | Server port                           |
| `SQ_HOST`                | Server host                           |
| `LOG_LEVEL`              | Logging level (error/warn/info/debug) |

---

## CSV export

Open the dashboard, navigate to **Issues** or **Security Hotspots**, apply any filters, then click **Export CSV** in the toolbar. The downloaded file is RFC 4180 compliant and includes all visible fields.

---

## PDF export

`export-pdf` boots the server on an ephemeral port, renders the report with headless Chromium, writes the file, and exits:

```bash
sonarqube-exporter export-pdf --project my_project_key -o report.pdf
```

Chromium is not bundled. On first use it is downloaded once (~150 MB) via the optional `playwright-core` dependency. In CI, pre-install it:

```bash
npx playwright-core install chromium
```

Or disable auto-install and rely on the in-app browser-print fallback:

```bash
SQ_AUTO_INSTALL_BROWSER=false sonarqube-exporter export-pdf --project my_project_key -o report.pdf
```

`PLAYWRIGHT_BROWSERS_PATH` and `PLAYWRIGHT_DOWNLOAD_HOST` are respected for shared caches and corporate proxies.

---

## Running a scan

The `scan` command runs `sonarqube-scanner` on the current directory, streams the analysis log, and waits for the quality gate result:

```bash
sonarqube-exporter scan
```

Options:

```
--project <key>     SonarQube project key
--branch <name>     Branch name (defaults to current git branch)
--url <url>         SonarQube server URL
--token <token>     Authentication token
```

The command reads `sonar-project.properties` if present.

---

## Programmatic usage (library API)

The package exports a framework-agnostic SonarQube client:

```ts
import { loadConfig, toConnection, listProjects, fetchAllIssues } from 'sonarqube-issues-exporter';

const config = loadConfig();
const conn = toConnection(config);
const { projects } = await listProjects(conn);
const issues = await fetchAllIssues(conn, { projectKey: projects[0].key });
```

---

## Authentication

### SonarQube server

1. Go to **User > My Account > Security**
2. Generate a new token
3. Pass it via `--token`, the config file, or `SONARQUBE_TOKEN`

### SonarCloud

1. Go to **Account > Security**
2. Generate a new token
3. Include your organization key via `--organization` or the config file

---

## CI/CD example

```yaml
# GitHub Actions — generate a PDF report after analysis
- name: Install Chromium
  run: npx playwright-core install chromium

- name: Export PDF report
  run: npx sonarqube-issues-exporter export-pdf --project "$PROJECT_KEY" -o report.pdf
  env:
    SONARQUBE_URL: ${{ secrets.SONARQUBE_URL }}
    SONARQUBE_TOKEN: ${{ secrets.SONARQUBE_TOKEN }}
    PROJECT_KEY: ${{ github.event.repository.name }}

- name: Upload report
  uses: actions/upload-artifact@v4
  with:
    name: sonarqube-report
    path: report.pdf
```

---

## Troubleshooting

### Authentication errors

```
Error: Failed to connect to SonarQube
```

- Check that your token has Browse permission on the project
- Verify the server URL (include the scheme: `https://`)
- Run `sonarqube-exporter validate` to confirm connectivity

### Permission errors

```
Error: Insufficient privileges
```

Your token needs the **Browse** permission on the target project. Contact your SonarQube administrator.

### Network timeout

```
Error: timeout of 30000ms exceeded
```

- Check your network connection and firewall rules
- Verify the SonarQube server is reachable from your machine

### Debug mode

```bash
sonarqube-exporter serve --verbose
```

---

## Support

- **Issues**: [GitHub Issues](https://github.com/The-Lone-Druid/sonarqube-issues-exporter/issues)
- **Repository**: [GitHub](https://github.com/The-Lone-Druid/sonarqube-issues-exporter)
- **License**: MIT
