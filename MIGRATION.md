# Migration Guide: v1.x/v2.x to v3.0.0

This guide helps you migrate from the JavaScript-based v1.x or the early TypeScript v2.x to the new npm package-based v3.0.0.

## What's New in v3.0.0

### 🚀 Major Improvements

- **NPM Package**: Now available as a global npm package
- **CLI Commands**: New `sonarqube-exporter` and `sq-exporter` global commands
- **Simplified Installation**: No more git cloning required
- **Automated Versioning**: Conventional commits and automated releases
- **Enhanced Documentation**: Comprehensive guides and examples

## Breaking Changes from v1.x/v2.x

### 1. Installation Method (BREAKING)

```bash
# v1.x/v2.x (old method)
git clone https://github.com/The-Lone-Druid/sonarqube-issues-exporter.git
cd sonarqube-issues-exporter
npm install
npm run build

# v3.0.0 (new method)
npm install -g sonarqube-issues-exporter
```

### 2. Command Usage (BREAKING)

```bash
# v1.x
node export_issues.js

# v2.x (development)
npm run export

# v3.0.0 (production - recommended)
sonarqube-exporter
# or
sq-exporter

# v3.0.0 (development - for contributors)
npm run export
```

### 3. Configuration (Enhanced)

The configuration is now more structured and type-safe:

#### Environment Variables (Enhanced)

```bash
# v1.x (basic)
SONARQUBE_URL=http://localhost:9000
SONARQUBE_TOKEN=your-token
SONARQUBE_PROJECT_KEY=your-project

# v2.x/v3.0.0 (comprehensive)
SONARQUBE_URL=http://localhost:9000
SONARQUBE_TOKEN=your-token
SONARQUBE_PROJECT_KEY=your-project
SONARQUBE_ORGANIZATION=your-org  # New for SonarCloud
EXPORT_OUTPUT_PATH=./reports     # New: configurable output
EXPORT_FILENAME=report.html      # New: configurable filename
EXPORT_EXCLUDE_STATUSES=CLOSED   # New: filtering options
EXPORT_MAX_ISSUES=10000          # New: performance control
LOG_LEVEL=info                   # New: logging control
```

#### CLI Arguments (New in v3.0.0)

```bash
# v3.0.0 supports rich CLI arguments
sonarqube-exporter \
  --url https://sonarqube.company.com \
  --token your-token \
  --project your-project \
  --output ./reports \
  --filename custom-report.html \
  --verbose
```

#### Configuration Files (Enhanced)

You can now use JSON configuration files:

```json
{
  "sonarqube": {
    "url": "https://sonarcloud.io",
    "token": "your-token",
    "projectKey": "your-project",
    "organization": "your-org"
  },
  "export": {
    "outputPath": "./reports",
    "filename": "issues-report.html",
    "excludeStatuses": ["CLOSED"],
    "includeResolvedIssues": false,
    "maxIssues": 10000,
    "template": "default"
  },
  "logging": {
    "level": "info",
    "file": "./logs/export.log"
  }
}
```

### 4. CLI Interface (New)

v2.x introduces a proper CLI with commands and options:

```bash
# Export with options
npm run export -- --output ./my-reports --verbose

# Validate configuration
npm run export -- validate

# Use configuration file
npm run export -- --config ./config.json
```

### 5. Output Changes

- **Old**: Always creates `sonarqube_issues.html` in current directory
- **New**: Configurable output path and filename
- **Default**: `./reports/sonarqube-issues-report.html`

## Migration Steps

### Step 1: Update Node.js

Ensure you have Node.js 18+ installed:

```bash
node --version  # Should be 18.0.0 or higher
```

### Step 2: Install New Dependencies

```bash
# Remove old dependencies and install new ones
rm -rf node_modules package-lock.json
npm install
```

### Step 3: Build the Project

```bash
npm run build
```

### Step 4: Update Scripts

If you have automation scripts, update them:

```bash
# Old automation
node export_issues.js

# New automation
npm run export
# or for production
npm run build && npm run export:prod
```

### Step 5: Configure (Optional)

Create a configuration file for easier management:

```bash
cp config.example.json config.json
# Edit config.json with your settings
```

### Step 6: Test

Validate your configuration:

```bash
npm run export -- validate
```

Export a test report:

```bash
npm run export -- --output ./test-reports --verbose
```

## New Features Available

### 1. Progress Tracking

v2.x shows real-time progress when fetching large numbers of issues.

### 2. Better Error Handling

More descriptive error messages and validation.

### 3. Flexible Filtering

- Exclude specific statuses
- Control maximum number of issues
- Include/exclude resolved issues

### 4. Enhanced Reports

- Improved responsive design
- Better metrics dashboard
- Enhanced theme support

### 5. Development Tools

- TypeScript support
- ESLint and Prettier
- Comprehensive testing
- Git hooks for quality

## Troubleshooting

### Issue: "Cannot find module" errors

**Solution**: Run `npm install` to install TypeScript dependencies.

### Issue: Build fails

**Solution**: Ensure Node.js 18+ is installed and run `npm run build`.

### Issue: Old output file location

**Solution**: Update your file paths to use the new default `./reports/` directory.

### Issue: Environment variables not working

**Solution**: Check the new variable names in the updated `.env.example`.

## Quick Migration Steps to v3.0.0

### 1. Uninstall Old Version (if applicable)

```bash
# Remove old git clone directory
rm -rf sonarqube-issues-exporter

# Or move it for backup
mv sonarqube-issues-exporter sonarqube-issues-exporter-backup
```

### 2. Install v3.0.0

```bash
# Install globally
npm install -g sonarqube-issues-exporter

# Verify installation
sonarqube-exporter --version
```

### 3. Update Your Scripts

```bash
# Old way (v1.x/v2.x)
cd sonarqube-issues-exporter
npm run export

# New way (v3.0.0)
sonarqube-exporter --config ./config.json
```

### 4. Configuration Migration

Your existing configuration files should work as-is:

- `.env` files are supported
- `config.json` files are supported
- All environment variables remain the same

## Troubleshooting v3.0.0

### Issue: "Command not found: sonarqube-exporter"

**Solution**: Ensure global installation completed successfully:

```bash
npm install -g sonarqube-issues-exporter
npm list -g sonarqube-issues-exporter
```

### Issue: Permission errors on global install

**Solution**: Use sudo (macOS/Linux) or run as administrator (Windows):

```bash
sudo npm install -g sonarqube-issues-exporter
```

### Issue: Want to use local installation

**Solution**: Install locally and use npx:

```bash
npm install sonarqube-issues-exporter
npx sonarqube-exporter --help
```

### Issue: Need development setup

**Solution**: Clone and build for contributing:

```bash
git clone https://github.com/The-Lone-Druid/sonarqube-issues-exporter.git
cd sonarqube-issues-exporter
npm install
npm run build
npm run dev
```

## Rollback Plan

If you need to rollback from v3.0.0:

1. **Uninstall v3.0.0**: `npm uninstall -g sonarqube-issues-exporter`
2. **Restore backup**: Use your backed-up git clone directory
3. **Use old method**: `cd sonarqube-issues-exporter-backup && npm run export`

## Support

If you encounter issues during migration to v3.0.0:

1. Check this migration guide
2. Review the updated [README.md](./README.md) and [NPM_GUIDE.md](./NPM_GUIDE.md)
3. Check the [VERSIONING.md](./VERSIONING.md) for development workflow
4. Open an issue on [GitHub](https://github.com/The-Lone-Druid/sonarqube-issues-exporter/issues)

---

**Note**: v3.0.0 is a major improvement with npm package distribution, global CLI access, and enhanced automation. We strongly recommend migrating to benefit from these improvements.
