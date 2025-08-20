# SonarQube Issues Exporter

[![npm version](https://badge.fury.io/js/sonarqube-issues-exporter.svg)](https://badge.fury.io/js/sonarqube-issues-exporter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Downloads](https://img.shields.io/npm/dm/sonarqube-issues-exporter.svg)](https://npmjs.org/package/sonarqube-issues-exporter)

**Transform your SonarQube code quality data into beautiful, shareable HTML reports.**

Perfect for team leads, project managers, and developers who need to share code quality insights with stakeholders, clients, or team members who don't have direct SonarQube access.

> 🚀 **Ready to use in 2 minutes:** `npm install -g sonarqube-issues-exporter`

## 🤔 Why Use This Tool?

### **The Problem**

SonarQube's built-in interface is great for developers, but:

- ❌ Hard to share with non-technical stakeholders
- ❌ No offline access to reports
- ❌ Limited customization for presentations
- ❌ Difficult to integrate into documentation workflows
- ❌ Requires SonarQube access for every viewer

### **The Solution**

Transform your SonarQube data into:

- ✅ Beautiful, shareable HTML reports
- ✅ Mobile-friendly presentations for any device
- ✅ Offline-accessible documentation
- ✅ Client-ready deliverables
- ✅ Professional reports for executives and stakeholders

## � Who This Is For

### 🏢 **Team Leads & Project Managers**

- Generate executive-friendly reports for stakeholders
- Track code quality metrics across sprints
- Share progress with non-technical team members
- Create compliance documentation for audits

### 👨‍💻 **DevOps Engineers**

- Integrate quality reports into CI/CD pipelines
- Create automated quality gates documentation
- Generate reports for deployment approvals
- Archive quality metrics for historical tracking

### 🔍 **QA Engineers & Security Teams**

- Export security vulnerabilities for detailed analysis
- Create comprehensive bug tracking reports
- Generate compliance documentation for audits
- Share security findings with external teams

### 📊 **Development Teams**

- Share code review insights with external teams
- Create beautiful reports for client presentations
- Export issues for offline analysis and planning
- Document technical debt for stakeholders

## 🎯 Common Use Cases

### 📈 **Sprint Reviews & Retrospectives**

```bash
# Generate a clean report for sprint retrospectives
sq-exporter export --project "mobile-app" --filename "sprint-42-review.html"
```

_Perfect for showing code quality trends and improvements to the team._

### 🔒 **Security Audits & Compliance**

```bash
# Export only security vulnerabilities for compliance reports
sq-exporter export --project "banking-api" --exclude-statuses "CLOSED"
```

_Generate security-focused reports for compliance teams and auditors._

### 👥 **Client Presentations & Meetings**

```bash
# Create a professional report for client meetings
sq-exporter export --project "client-portal" --filename "quality-report-$(date +%Y%m%d).html"
```

_Show clients your commitment to code quality with professional reports._

### ⚙️ **CI/CD Pipeline Integration**

```bash
# Automated quality reports in your pipeline
sq-exporter export --project "$CI_PROJECT_NAME" --output "$CI_ARTIFACTS_DIR"
```

_Automatically generate reports for every deployment or release._

### 📋 **Executive & Stakeholder Updates**

```bash
# Weekly quality dashboard for management
sq-exporter export --project "main-product" --filename "weekly-quality-$(date +%Y-W%V).html"
```

_Keep stakeholders informed with regular, easy-to-understand quality reports._

## 👀 What You'll Get

### **Before: SonarQube Interface**

- Technical dashboard requiring SonarQube access
- Complex interface overwhelming for non-developers
- Difficult to share or present to stakeholders
- No offline access or archival capabilities

### **After: Professional Reports**

- 🎨 Clean, professional layout suitable for any audience
- 📱 Mobile-responsive design works on any device
- 🌙 Dark/light theme support for user preference
- 📧 Easy sharing via email, Slack, or presentations
- 💾 Offline access - no SonarQube login required
- 📊 Executive-friendly summaries and visualizations

## ✨ Key Benefits

- � **Stakeholder-Friendly Reports**: Transform technical data into executive-ready presentations
- 🎨 **Professional Design**: Beautiful, responsive layouts that work on any device
- ⚡ **Quick Setup**: Get your first report in under 2 minutes
- 🔧 **Flexible Configuration**: Works with any SonarQube setup (Cloud, Server, Enterprise)
- 📱 **Mobile-Responsive**: Perfect viewing experience on desktop, tablet, and mobile
- 🌙 **Theme Options**: Automatic dark/light mode based on user preference
- 🔒 **Secure & Private**: Your data stays in your environment
- 📈 **Progress Tracking**: Real-time feedback during report generation
- 🎯 **Smart Filtering**: Focus on what matters most (severity, type, status)
- 💾 **Offline Access**: Share reports without requiring SonarQube access

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- Access to a SonarQube server (version 7.9+)
- SonarQube user token with appropriate permissions

## ⚡ 2-Minute Quick Start

Get your first report in just 2 minutes:

```bash
# 1. Install globally
npm install -g sonarqube-issues-exporter

# 2. Generate your first report
sq-exporter export \
  --url "https://your-sonarqube.com" \
  --token "your-token" \
  --project "your-project-key"

# 3. Open the generated report
# Report saved to: ./reports/sonarqube-issues-report.html
```

**That's it!** 🎉 Your professional SonarQube report is ready to share.

> 💡 **Pro Tip**: Use `sq-exporter setup` for an interactive configuration wizard that saves your settings for future use.

## 🚀 Installation & Setup

## 🚀 Installation & Setup

### Installation Options

#### 🌟 Global Installation (Recommended)

```bash
# Install once, use anywhere
npm install -g sonarqube-issues-exporter
```

After installation, use from any directory:

```bash
sonarqube-exporter --help
# or use the short alias
sq-exporter --help
```

#### 📦 Project-Specific Installation

```bash
# Install in your project
npm install sonarqube-issues-exporter

# Use with npx (no global installation needed)
npx sonarqube-exporter --help
```

### ⚙️ Configuration

Choose the setup method that works best for you:

#### 🎯 Method 1: Interactive Setup (Easiest)

**Perfect for first-time users:**

```bash
sq-exporter setup
```

This wizard will:

- ✅ Guide you through all required settings
- ✅ Test your SonarQube connection
- ✅ Save configuration for future use
- ✅ Generate your first report immediately

#### ⚡ Method 2: Direct CLI (Fastest)

**Perfect for one-time exports:**

```bash
sq-exporter export \
  --url "https://sonarqube.company.com" \
  --token "your-sonarqube-token" \
  --project "your-project-key"
```

#### 📁 Method 3: Configuration File (Most Flexible)

**Perfect for team sharing and automation:**

Create `.sonarqube-exporter.json` in your project:

```json
{
  "sonarqube": {
    "url": "https://sonarqube.company.com",
    "token": "your-sonarqube-token",
    "projectKey": "your-project-key"
  },
  "export": {
    "outputPath": "./reports",
    "filename": "quality-report.html"
  }
}
```

Then simply run:

```bash
sq-exporter export
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

## 📖 Real-World Usage Examples

### 🚀 Getting Started Examples

#### First-Time Setup

```bash
# Let the wizard guide you through setup
sq-exporter setup
```

#### Quick One-Off Report

```bash
# Generate a report immediately
sq-exporter export --url "https://sonarqube.company.com" --token "your-token" --project "your-project"
```

#### Validate Your Setup

```bash
# Check if your configuration works
sq-exporter validate
```

### 📊 Team & Management Scenarios

#### Sprint Review Report

```bash
# Clean report for retrospectives
sq-exporter export --project "mobile-app" --filename "sprint-42-review.html"
```

#### Executive Dashboard

```bash
# Management-friendly weekly report
sq-exporter export \
  --project "main-product" \
  --filename "weekly-quality-$(date +%Y-W%V).html" \
  --exclude-statuses "CLOSED"
```

#### Client Presentation

```bash
# Professional report for client meetings
sq-exporter export \
  --project "client-portal" \
  --filename "quality-demo-$(date +%Y%m%d).html"
```

### 🔒 Security & Compliance Scenarios

#### Security Audit Report

```bash
# Focus on security vulnerabilities only
sq-exporter export \
  --project "banking-api" \
  --filename "security-audit-$(date +%Y%m%d).html" \
  --exclude-statuses "CLOSED,RESOLVED"
```

#### Compliance Documentation

```bash
# Comprehensive report for auditors
sq-exporter export \
  --project "healthcare-app" \
  --include-resolved \
  --filename "compliance-report.html"
```

### ⚙️ DevOps & Automation Scenarios

#### CI/CD Pipeline Integration

```bash
# Automated reports for every build
sq-exporter export \
  --project "$CI_PROJECT_NAME" \
  --output "$CI_ARTIFACTS_DIR" \
  --filename "quality-report-$CI_PIPELINE_ID.html"
```

#### Daily Quality Monitoring

```bash
# Automated daily reports
sq-exporter export \
  --project "microservice-api" \
  --filename "daily-quality-$(date +%Y%m%d).html" \
  --max-issues 5000
```

#### Multi-Project Dashboard

```bash
# Generate reports for multiple projects
for project in "frontend" "backend" "mobile"; do
  sq-exporter export --project "$project" --filename "${project}-quality.html"
done
```

### 🐳 Docker & Containerized Environments

#### Quick Docker Run

```bash
# One-command report generation
docker run --rm \
  -e SONARQUBE_URL="https://sonarqube.company.com" \
  -e SONARQUBE_TOKEN="your-token" \
  -e SONARQUBE_PROJECT_KEY="your-project" \
  -v $(pwd)/reports:/app/reports \
  sonarqube-issues-exporter
```

#### Docker with Configuration File

```bash
# Using saved configuration
docker run --rm \
  -v $(pwd)/.sonarqube-exporter.json:/app/.sonarqube-exporter.json \
  -v $(pwd)/reports:/app/reports \
  sonarqube-issues-exporter
```

#### Kubernetes Job Example

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: sonarqube-report
spec:
  template:
    spec:
      containers:
        - name: exporter
          image: sonarqube-issues-exporter
          env:
            - name: SONARQUBE_URL
              value: 'https://sonarqube.company.com'
            - name: SONARQUBE_TOKEN
              valueFrom:
                secretKeyRef:
                  name: sonarqube-secret
                  key: token
            - name: SONARQUBE_PROJECT_KEY
              value: 'my-project'
          volumeMounts:
            - name: reports
              mountPath: /app/reports
      restartPolicy: Never
      volumes:
        - name: reports
          persistentVolumeClaim:
            claimName: reports-pvc
```

---

## 📚 Advanced Configuration & Reference

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
