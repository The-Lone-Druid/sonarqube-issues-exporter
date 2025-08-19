# Migration Guide: v1.x to v2.x

This guide helps you migrate from the JavaScript-based v1.x to the new TypeScript-based v2.x.

## Breaking Changes

### 1. Node.js Version Requirement
- **Old**: Node.js v12+
- **New**: Node.js v18+

### 2. Command Changes
```bash
# v1.x
node export_issues.js

# v2.x
npm run export
# or
npm run build && npm run export:prod
```

### 3. Configuration
The configuration is now more structured and type-safe:

#### Environment Variables (Enhanced)
```bash
# v1.x (basic)
SONARQUBE_URL=http://localhost:9000
SONARQUBE_TOKEN=your-token
SONARQUBE_PROJECT_KEY=your-project

# v2.x (comprehensive)
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

#### Configuration Files (New)
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

## Rollback Plan

If you need to rollback to v1.x:

1. The old file is backed up as `export_issues.js.bak`
2. Restore it: `mv export_issues.js.bak export_issues.js`
3. Use the old command: `node export_issues.js`

## Support

If you encounter issues during migration:

1. Check this migration guide
2. Review the updated README.md
3. Open an issue on GitHub
4. Contact the development team

---

**Note**: The old v1.x functionality is preserved in `export_issues.js.bak` for emergency use, but we recommend completing the migration to benefit from the new features and improvements.
