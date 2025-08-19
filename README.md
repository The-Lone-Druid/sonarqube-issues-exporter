# SonarQube Issues Exporter

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub issues](https://img.shields.io/github/issues/The-Lone-Druid/sonarqube-issues-exporter)](https://github.com/The-Lone-Druid/sonarqube-issues-exporter/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

A Node.js tool to export SonarQube issues into an interactive HTML report with filtering and search capabilities. Transform your SonarQube analysis results into a beautiful, responsive, and feature-rich HTML report.

## Features

- Export SonarQube issues to an interactive HTML report
- **Comprehensive Metrics Dashboard** - Overview of issues with key statistics
- Filter issues by severity and type
- Search through issues with DataTables integration
- Copy file paths with a single click
- Responsive design with Bootstrap 5
- Pagination and sorting capabilities
- Beautiful badges for severity and issue types
- **Collapsible metrics section** for focused table viewing

## Prerequisites

- Node.js (v12 or higher)
- A running SonarQube instance
- SonarQube authentication token
- Project key from SonarQube

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/The-Lone-Druid/sonarqube-issues-exporter.git
   cd sonarqube-issues-exporter
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your SonarQube configuration:
     ```bash
     SONARQUBE_URL=http://your-sonarqube-url
     SONARQUBE_TOKEN=your-token-here
     SONARQUBE_PROJECT_KEY=your-project-key
     ```

## Usage

Run the script to generate the report:
```bash
node export_issues.js
```

This will create `sonarqube_issues.html` in your current directory. Open it in a web browser to view the interactive report.

## Metrics Dashboard

The generated HTML report includes a comprehensive metrics dashboard that provides:

### Quick Overview Cards
- **Total Issues**: Complete count of all issues in your project
- **Critical Issues**: Combined count of Blocker and Critical severity issues
- **Bugs**: Total number of bug-type issues
- **Vulnerabilities**: Security vulnerability count

### Detailed Metrics
- **Issues by Severity**: Visual breakdown with colored badges showing distribution across:
  - Blocker, Critical, Major, Minor, and Info severities
- **Issues by Type & Status**: Split view displaying:
  - Issue types (Bug, Vulnerability, Code Smell)
  - Current status (Open, Confirmed, Resolved, Reopened)

### User Experience
- **Collapsible Design**: Metrics section is collapsed by default, allowing teams to focus on the issues table
- **Easy Access**: Click the "Issues Metrics Overview" header to expand/collapse the metrics
- **Visual Feedback**: Smooth animations and rotating chevron indicate section state

## Report Features

- **Metrics Overview Dashboard**: 
  - Total issues count with quick summary cards
  - Critical issues count (Blocker + Critical severities)
  - Bug and vulnerability counts
  - Detailed breakdown by severity (Blocker, Critical, Major, Minor, Info)
  - Issue type distribution (Bug, Vulnerability, Code Smell)
  - Status overview (Open, Confirmed, Resolved, Reopened)
  - **Collapsible design** - metrics section collapsed by default for focused table viewing
- **Filtering**: Filter issues by severity (Blocker, Critical, Major, Minor, Info) and type (Bug, Vulnerability, Code Smell)
- **Searching**: Full-text search across all issues
- **Sorting**: Click column headers to sort issues
- **Copy File Paths**: Easily copy file paths with a single click
- **Responsive Design**: Works on all device sizes
- **Pagination**: Configure how many issues to show per page
- **Smart Filtering**: Automatically excludes closed issues from the report

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [SonarQube](https://www.sonarqube.org/) for their excellent code quality tool
- [DataTables](https://datatables.net/) for the interactive table features
- [Bootstrap](https://getbootstrap.com/) for the responsive design framework
