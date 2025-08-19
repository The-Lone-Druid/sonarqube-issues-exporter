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

#### Development Installation

```bash
# For development or contributing
git clone https://github.com/The-Lone-Druid/sonarqube-issues-exporter.git
cd sonarqube-issues-exporter

# Install dependencies
npm install

# Build the project
npm run build
```

### Configuration

1. **Environment Variables** (Quick Setup):

   ```bash
   cp .env.example .env
   # Edit .env with your SonarQube configuration
   ```

2. **Configuration File** (Recommended):
   ```bash
   cp config.example.json config.json
   # Edit config.json with your settings
   ```

### Basic Usage

#### Using Global Installation

```bash
# Export with default configuration
sonarqube-exporter

# Export with custom options
sonarqube-exporter --url https://sonarqube.company.com --token your-token --project your-project

# Use short alias
sq-exporter --output ./reports --filename my-report.html --verbose
```

#### Using NPX (Local Installation)

```bash
# Export issues using npx
npx sonarqube-exporter --help

# Export with configuration
npx sonarqube-exporter --config ./config.json
```

#### Development Usage

```bash
# Export issues using npm scripts (for development)
npm run export

# Export with custom configuration
npm run export -- --config ./config.json

# Export with CLI options
npm run export -- --output ./my-reports --filename my-report.html --verbose
```

## 📖 Configuration

### Environment Variables

| Variable                  | Description                         | Default                        |
| ------------------------- | ----------------------------------- | ------------------------------ |
| `SONARQUBE_URL`           | SonarQube server URL                | `http://localhost:9000`        |
| `SONARQUBE_TOKEN`         | User token for authentication       | Required                       |
| `SONARQUBE_PROJECT_KEY`   | Project key to export               | Required                       |
| `SONARQUBE_ORGANIZATION`  | Organization key (SonarCloud)       | Optional                       |
| `EXPORT_OUTPUT_PATH`      | Output directory for reports        | `./reports`                    |
| `EXPORT_FILENAME`         | Output filename                     | `sonarqube-issues-report.html` |
| `EXPORT_EXCLUDE_STATUSES` | Comma-separated statuses to exclude | `CLOSED`                       |
| `EXPORT_INCLUDE_RESOLVED` | Include resolved issues             | `false`                        |
| `EXPORT_MAX_ISSUES`       | Maximum issues to fetch             | `10000`                        |
| `LOG_LEVEL`               | Logging level                       | `info`                         |

## 🛠️ Development

### Setup Development Environment

```bash
# Install dependencies
npm install

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
