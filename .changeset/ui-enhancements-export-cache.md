---
'sonarqube-issues-exporter': major
---

feat: CSV export, ECharts charts, 2026 UI overhaul, disk cache, IDE integration removal

### Breaking changes

- Removed `IdeConfig`, `EditorId`, and `IdeResolution` types from the public library surface (`export type * from './types'`). Consumers importing these types will need to remove the imports.
- `AppConfig` no longer has an `ide` field. Config files with an `ide` key are silently ignored.
- The `--editor` CLI flag for `serve` has been removed.

### New features

- **Export menu**: Topbar now has a single "Export" dropdown listing both PDF and CSV options side-by-side.
- **CSV export**: Downloads all issues for the current project as a standards-compliant CSV (RFC 4180) containing all issue fields — key, rule, severity, type, component, line, status, message, effort, debt, author, assignee, tags, created, updated.
- **Disk-based JSON cache**: Server now persists in-memory cache entries to `~/.sq-exporter/cache/` after each successful SonarQube fetch. Cache is warmed from disk on startup, so data survives server restarts.

### Enhancements

- **Charts**: Replaced Recharts (deprecated 1.x/2.x) with ECharts + echarts-for-react. Charts are now theme-aware, feature gradient bar fills, and rich tooltips showing count + percentage.
- **2026 UI overhaul**: New indigo/violet primary palette (light: `#6366f1`, dark: `#818cf8`), deep navy dark background, `fadeInUp`/`slideInRight` keyframe entrance animations, staggered metric card reveals, card hover-lift effect, `active:scale-95` button press feedback, sidebar active-state left-border indicator.
- **IDE integration removed**: `EditorPicker` dropdown, "Open in IDE" button, and all server-side IDE path resolution code have been removed to eliminate user confusion.
