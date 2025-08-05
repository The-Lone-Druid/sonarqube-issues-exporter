# SonarQube Issues Exporter

A Node.js tool to export SonarQube issues into an interactive HTML report with filtering and search capabilities.

## Features

- Export SonarQube issues to an interactive HTML report
- Filter issues by severity and type
- Search through issues with DataTables integration
- Copy file paths with a single click
- Responsive design with Bootstrap 5
- Pagination and sorting capabilities
- Beautiful badges for severity and issue types

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

## Report Features

- **Filtering**: Filter issues by severity (Blocker, Critical, Major, Minor, Info) and type (Bug, Vulnerability, Code Smell)
- **Searching**: Full-text search across all issues
- **Sorting**: Click column headers to sort issues
- **Copy File Paths**: Easily copy file paths with a single click
- **Responsive Design**: Works on all device sizes
- **Pagination**: Configure how many issues to show per page

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [SonarQube](https://www.sonarqube.org/) for their excellent code quality tool
- [DataTables](https://datatables.net/) for the interactive table features
- [Bootstrap](https://getbootstrap.com/) for the responsive design framework
