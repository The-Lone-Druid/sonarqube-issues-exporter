# NPM Package Installation & Usage Guide

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g sonarqube-issues-exporter
```

After global installation, you can use the CLI from anywhere:

```bash
sonarqube-exporter --help
# or the short alias
sq-exporter --help
```

### Local Installation

```bash
npm install sonarqube-issues-exporter
```

Then use with npx:

```bash
npx sonarqube-exporter --help
```

## 🚀 Quick Start

### Method 1: Environment Variables

```bash
# Set required environment variables
export SONARQUBE_URL="https://your-sonarqube-server.com"
export SONARQUBE_TOKEN="your_sonarqube_token"
export SONARQUBE_PROJECT_KEY="your_project_key"

# Export issues
sonarqube-exporter export
```

### Method 2: Configuration File

Create a `sonarqube.config.json` file:

```json
{
  "sonarqube": {
    "url": "https://your-sonarqube-server.com",
    "token": "your_sonarqube_token",
    "projectKey": "your_project_key",
    "organization": "your_organization_key"
  },
  "export": {
    "outputPath": "./reports",
    "filename": "sonarqube-report.html",
    "template": "default",
    "maxIssues": 10000,
    "excludeStatuses": ["CLOSED"],
    "includeResolvedIssues": false
  },
  "logging": {
    "level": "info",
    "file": "./logs/export.log"
  }
}
```

Then run:

```bash
sonarqube-exporter export --config sonarqube.config.json
```

### Method 3: Command Line Options

```bash
sonarqube-exporter export \
  --config ./my-config.json \
  --output ./my-reports \
  --filename custom-report.html \
  --template default \
  --max-issues 5000 \
  --verbose
```

## 📋 Configuration Options

### Environment Variables

- `SONARQUBE_URL` - SonarQube server URL
- `SONARQUBE_TOKEN` - Authentication token
- `SONARQUBE_PROJECT_KEY` - Project key to analyze
- `SONARQUBE_ORGANIZATION` - Organization key (for SonarCloud)
- `EXPORT_OUTPUT_PATH` - Output directory
- `EXPORT_FILENAME` - Output filename
- `LOG_LEVEL` - Logging level (error, warn, info, debug)

### Configuration File Schema

```json
{
  "sonarqube": {
    "url": "string (required)",
    "token": "string (required)",
    "projectKey": "string (required)",
    "organization": "string (optional)"
  },
  "export": {
    "outputPath": "string (default: './reports')",
    "filename": "string (default: 'sonarqube-issues-report.html')",
    "template": "string (default: 'default')",
    "maxIssues": "number (default: 10000)",
    "excludeStatuses": "array (default: ['CLOSED'])",
    "includeResolvedIssues": "boolean (default: false)"
  },
  "logging": {
    "level": "string (default: 'info')",
    "file": "string (optional)"
  }
}
```

## 🔧 CLI Commands

### Export Command

```bash
sonarqube-exporter export [options]

Options:
  -c, --config <path>            Path to configuration file
  -o, --output <path>            Output directory path
  -f, --filename <name>          Output filename
  --template <name>              Template name (default: "default")
  --max-issues <number>          Maximum issues to fetch (default: "10000")
  --include-resolved             Include resolved issues
  --exclude-statuses <statuses>  Comma-separated statuses to exclude
  -v, --verbose                  Enable verbose logging
  -h, --help                     Display help
```

### Validate Command

```bash
sonarqube-exporter validate [options]

Options:
  -c, --config <path>   Path to configuration file
  -h, --help           Display help
```

## 💻 Programmatic Usage

### Basic Usage

```javascript
const { exportSonarQubeIssues, loadConfig } = require('sonarqube-issues-exporter');

async function generateReport() {
  try {
    const config = loadConfig();
    const result = await exportSonarQubeIssues(config);

    if (result.success) {
      console.log(`Report generated: ${result.outputPath}`);
      console.log(`Issues exported: ${result.issuesCount}`);
    }
  } catch (error) {
    console.error('Export failed:', error);
  }
}

generateReport();
```

### Advanced Usage with Custom Configuration

```javascript
const { exportSonarQubeIssues } = require('sonarqube-issues-exporter');

const customConfig = {
  sonarqube: {
    url: 'https://sonarcloud.io',
    token: 'your-token',
    projectKey: 'your-project',
    organization: 'your-org',
  },
  export: {
    outputPath: './custom-reports',
    filename: 'security-report.html',
    maxIssues: 5000,
    excludeStatuses: ['CLOSED', 'RESOLVED'],
  },
  logging: {
    level: 'debug',
  },
};

exportSonarQubeIssues(customConfig)
  .then((result) => console.log('Success:', result))
  .catch((error) => console.error('Error:', error));
```

## 🔐 Authentication

### SonarQube Server

1. Go to User > My Account > Security
2. Generate a new token
3. Use the token in your configuration

### SonarCloud

1. Go to Account > Security
2. Generate a new token
3. Include your organization key in the configuration

## 📊 Report Features

The generated HTML reports include:

- **Interactive Dashboard** - Overview metrics and charts
- **Searchable Table** - All issues with filtering capabilities
- **Dark/Light Theme** - Toggle between themes
- **Responsive Design** - Works on desktop and mobile
- **Export Options** - Print-friendly and shareable
- **GitHub Integration** - Link to source repository

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Errors**

   ```
   Error: Failed to connect to SonarQube
   ```

   - Check your token permissions
   - Verify the server URL is correct
   - Ensure the project key exists

2. **Permission Errors**

   ```
   Error: Insufficient privileges
   ```

   - Your token needs "Browse" permission on the project
   - Contact your SonarQube administrator

3. **Network Issues**

   ```
   Error: timeout of 30000ms exceeded
   ```

   - Check your network connection
   - Verify firewall settings
   - Try increasing timeout in configuration

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
sonarqube-exporter export --verbose
```

Or set log level in configuration:

```json
{
  "logging": {
    "level": "debug",
    "file": "./debug.log"
  }
}
```

## 📝 Examples

### SonarCloud Example

```bash
export SONARQUBE_URL="https://sonarcloud.io"
export SONARQUBE_TOKEN="your_sonarcloud_token"
export SONARQUBE_PROJECT_KEY="your_project_key"
export SONARQUBE_ORGANIZATION="your_organization"

sonarqube-exporter export --output ./reports --verbose
```

### On-Premise SonarQube Example

```bash
export SONARQUBE_URL="http://localhost:9000"
export SONARQUBE_TOKEN="your_token"
export SONARQUBE_PROJECT_KEY="my-project"

sonarqube-exporter export --filename security-audit.html
```

### CI/CD Integration Example

```yaml
# GitHub Actions example
- name: Generate SonarQube Report
  run: |
    npm install -g sonarqube-issues-exporter
    sonarqube-exporter export --output ./reports
  env:
    SONARQUBE_URL: ${{ secrets.SONARQUBE_URL }}
    SONARQUBE_TOKEN: ${{ secrets.SONARQUBE_TOKEN }}
    SONARQUBE_PROJECT_KEY: ${{ github.event.repository.name }}
```

## 🤝 Support

- **Issues**: [GitHub Issues](https://github.com/The-Lone-Druid/sonarqube-issues-exporter/issues)
- **Documentation**: [GitHub Repository](https://github.com/The-Lone-Druid/sonarqube-issues-exporter)
- **License**: MIT
