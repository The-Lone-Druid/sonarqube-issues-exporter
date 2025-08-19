# SonarQube Issues Exporter

[![npm version](https://badge.fury.io/js/sonarqube-issues-exporter.svg)](https://badge.fury.io/js/sonarqube-issues-exporter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Downloads](https://img.shields.io/npm/dm/sonarqube-issues-exporter.svg)](https://npmjs.org/package/sonarqube-issues-exporter)

An enterprise-level Node.js application with TypeScript support for exporting SonarQube issues to beautiful, shareable HTML reports. Perfect for sharing code quality insights with your team and stakeholders.

> **📦 Now Available as NPM Package!** Install globally with `npm install -g sonarqube-issues-exporter` and use anywhere with the `sonarqube-exporter` or `sq-exporter` commands.

## ✨ Features

- 🚀 **Enterprise-Ready**: Built with TypeScript for type safety and maintainability
- 📊 **Beautiful Reports**: Generate responsive HTML reports with dark/light theme support
- 🔧 **Highly Configurable**: Flexible configuration via files, environment variables, or CLI options
- 📈 **Progress Tracking**: Real-time progress reporting during data fetching
- 🎯 **Filtering Options**: Filter by severity, type, status, and more
- 🔒 **Secure**: Token-based authentication with SonarQube
- 📱 **Responsive Design**: Reports work perfectly on desktop and mobile devices
- 🌙 **Theme Support**: Automatic dark/light mode based on user preference
- ⚡ **Fast**: Optimized data fetching with pagination and caching
- 🧪 **Well Tested**: Comprehensive test suite with high coverage

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- Access to a SonarQube server (version 7.9+)
- SonarQube user token with appropriate permissions

## 🚀 Quick Start

### Installation

#### Global Installation (Recommended)

```bash
# Install globally via npm
npm install -g sonarqube-issues-exporter
```

After global installation, you can use the CLI from anywhere:

```bash
sonarqube-exporter --help
# or use the short alias
sq-exporter --help
```

#### Local Installation

```bash
# Install in your project
npm install sonarqube-issues-exporter

# Use with npx
npx sonarqube-exporter --help
```

### Configuration

The SonarQube Issues Exporter supports multiple ways to configure your connection and export settings. Choose the method that works best for your workflow.

#### 🎯 Quick Setup (Interactive)

For first-time users, use the interactive setup command:

```bash
sonarqube-exporter setup
```

This will prompt you for your SonarQube details and create a configuration file for you.

#### 🔧 Configuration Methods (in order of precedence)

1. **CLI Options** (highest priority)
2. **Environment Variables**
3. **Configuration Files**
4. **Default Values** (lowest priority)

#### 📄 Configuration Files

The exporter looks for configuration files in the following order:

1. Custom path via `--config` option
2. `.sonarqube-exporter.json` (current directory)
3. `.sonarqube-exporter.js` (current directory)
4. `sonarqube-exporter.config.json` (current directory)
5. `~/.sonarqube-exporter.json` (user home directory)

**Example configuration file (`.sonarqube-exporter.json`):**

```json
{
  "sonarqube": {
    "url": "https://sonarqube.company.com",
    "token": "your-sonarqube-token",
    "projectKey": "your-project-key",
    "organization": "your-org"
  },
  "export": {
    "outputPath": "./reports",
    "filename": "sonarqube-issues-report.html",
    "excludeStatuses": ["CLOSED"],
    "includeResolvedIssues": false,
    "maxIssues": 10000,
    "template": "default"
  },
  "logging": {
    "level": "info"
  }
}
```

#### 🌍 Environment Variables

| Variable                  | Description                         | Default                        |
| ------------------------- | ----------------------------------- | ------------------------------ |
| `SONARQUBE_URL`           | SonarQube server URL                | `http://localhost:9000`        |
| `SONARQUBE_TOKEN`         | User token for authentication       | **Required**                   |
| `SONARQUBE_PROJECT_KEY`   | Project key to export               | **Required**                   |
| `SONARQUBE_ORGANIZATION`  | Organization key (SonarCloud)       | Optional                       |
| `EXPORT_OUTPUT_PATH`      | Output directory for reports        | `./reports`                    |
| `EXPORT_FILENAME`         | Output filename                     | `sonarqube-issues-report.html` |
| `EXPORT_EXCLUDE_STATUSES` | Comma-separated statuses to exclude | `CLOSED`                       |
| `EXPORT_INCLUDE_RESOLVED` | Include resolved issues             | `false`                        |
| `EXPORT_MAX_ISSUES`       | Maximum issues to fetch             | `10000`                        |
| `EXPORT_TEMPLATE`         | Template name for reports           | `default`                      |
| `LOG_LEVEL`               | Logging level                       | `info`                         |

**Example environment setup:**

```bash
export SONARQUBE_URL="https://sonarcloud.io"
export SONARQUBE_TOKEN="your-token-here"
export SONARQUBE_PROJECT_KEY="your-project-key"
export SONARQUBE_ORGANIZATION="your-organization"
sonarqube-exporter export
```

#### ⚡ CLI Options

All configuration can be overridden via command-line options:

```bash
# Basic usage with CLI options
sonarqube-exporter export \
  --url "https://sonarqube.company.com" \
  --token "your-token" \
  --project "your-project-key" \
  --output "./reports" \
  --filename "custom-report.html"

# Using short options
sq-exporter export \
  -c "./config.json" \
  -o "./custom-reports" \
  -f "weekly-report.html" \
  -v

# Validate configuration
sonarqube-exporter validate \
  --url "https://sonarqube.company.com" \
  --token "your-token" \
  --project "your-project-key"
```

### Usage Examples

#### 🚀 Quick Start Examples

```bash
# 1. Interactive setup (first time)
sonarqube-exporter setup

# 2. Export with default settings
sonarqube-exporter export

# 3. Export with custom filename
sonarqube-exporter export --filename "security-audit-$(date +%Y%m%d).html"

# 4. Export only critical and high severity issues
sonarqube-exporter export --exclude-statuses "CLOSED,RESOLVED"

# 5. Validate your configuration
sonarqube-exporter validate

# 6. Export with verbose logging
sonarqube-exporter export --verbose
```

#### 🏢 Enterprise Usage Examples

```bash
# Daily security report
sonarqube-exporter export \
  --project "banking-api" \
  --filename "security-$(date +%Y%m%d).html" \
  --exclude-statuses "CLOSED" \
  --max-issues 5000

# Team review report
sonarqube-exporter export \
  --project "frontend-app" \
  --include-resolved \
  --output "./team-reports" \
  --filename "code-review-$(date +%Y-%m-%d).html"

# CI/CD Integration
sonarqube-exporter export \
  --project "$CI_PROJECT_NAME" \
  --output "$CI_PROJECT_DIR/artifacts" \
  --filename "sonarqube-report-$CI_PIPELINE_ID.html"
```

#### 🐳 Docker Usage

```bash
# Using environment variables
docker run --rm \
  -e SONARQUBE_URL="https://sonarqube.company.com" \
  -e SONARQUBE_TOKEN="your-token" \
  -e SONARQUBE_PROJECT_KEY="your-project" \
  -v $(pwd)/reports:/app/reports \
  sonarqube-issues-exporter

# Using configuration file
docker run --rm \
  -v $(pwd)/.sonarqube-exporter.json:/app/.sonarqube-exporter.json \
  -v $(pwd)/reports:/app/reports \
  sonarqube-issues-exporter
```

## 🛠️ CLI Commands

### Available Commands

#### `export` - Export SonarQube Issues

```bash
sonarqube-exporter export [options]

Options:
  -c, --config <path>              Path to configuration file
  --url <url>                      SonarQube server URL
  --token <token>                  SonarQube authentication token
  --project <key>                  SonarQube project key
  --organization <org>             SonarQube organization (for SonarCloud)
  -o, --output <path>              Output directory path
  -f, --filename <name>            Output filename
  --template <name>                Template name to use (default: 'default')
  --max-issues <number>            Maximum number of issues to fetch (default: '10000')
  --include-resolved               Include resolved issues in the report
  --exclude-statuses <statuses>    Comma-separated list of statuses to exclude (default: 'CLOSED')
  -v, --verbose                    Enable verbose logging
  -h, --help                       Display help for command
```

#### `validate` - Validate Configuration

```bash
sonarqube-exporter validate [options]

Options:
  -c, --config <path>              Path to configuration file
  --url <url>                      SonarQube server URL
  --token <token>                  SonarQube authentication token
  --project <key>                  SonarQube project key
  --organization <org>             SonarQube organization (for SonarCloud)
  -h, --help                       Display help for command
```

#### `setup` - Interactive Configuration Setup

```bash
sonarqube-exporter setup [options]

Options:
  --global                         Create global configuration file
  -h, --help                       Display help for command
```

### NPX Usage (Local Installation)

```bash
# Export issues using npx
npx sonarqube-exporter export --help

# Export with configuration
npx sonarqube-exporter export --config ./config.json
```

## 🛠️ Development

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/The-Lone-Druid/sonarqube-issues-exporter.git
cd sonarqube-issues-exporter

# Install dependencies
npm install

# Build the project
npm run build

# Start development mode (CLI interface)
npm run dev

# Run library development mode with demo export
npm run dev:lib

# Watch for TypeScript changes
npm run watch

# Development with auto-restart
npm run dev:watch

# Run tests
npm test

# Run linting
npm run lint
```

### Development Usage

```bash
# Export issues using npm scripts (for development)
npm run export

# Export with custom configuration
npm run export -- --config ./config.json

# Export with CLI options
npm run export -- --output ./my-reports --filename my-report.html --verbose
```

### Project Structure

```
src/
├── config/          # Configuration management
├── services/        # Business logic services
├── exporters/       # Export functionality
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── templates/      # HTML templates
├── cli.ts          # CLI interface
└── index.ts        # Main entry point
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
