# Contributing to SonarQube Issues Exporter

First off, thank you for considering contributing to SonarQube Issues Exporter! It's people like you that make this tool better for everyone.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- Use a clear and descriptive title
- Describe the exact steps to reproduce the problem
- Provide specific examples to demonstrate the steps
- Describe the behavior you observed after following the steps
- Explain which behavior you expected to see instead and why
- Include screenshots if possible

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- A clear and descriptive title
- A detailed description of the proposed functionality
- An explanation of why this enhancement would be useful
- Possible implementation details if you have them

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes
4. Make sure your code follows the existing style
5. Update the documentation if needed

### Development Process

1. **Fork and Clone**: Fork the repository and clone your fork
2. **Install**: Follow the development installation guide
3. **Branch**: Create a feature branch: `git checkout -b feature/my-feature`
4. **Develop**: Make your changes following our coding standards
5. **Test**: Ensure all tests pass: `npm test`
6. **Commit**: Use conventional commits: `npm run commit`
7. **Push**: Push to your fork and submit a pull request

### Code Quality Standards

- **TypeScript**: All code must be written in TypeScript
- **ESLint**: Code must pass ESLint validation
- **Prettier**: Code must be formatted with Prettier
- **Tests**: New features must include tests
- **Documentation**: Update relevant documentation

### Conventional Commits

We use conventional commits for automated versioning:

```bash
# Use the interactive commit tool
npm run commit

# Or follow the format manually
git commit -m "feat: add new export format"
git commit -m "fix: resolve memory leak in large reports"
git commit -m "docs: update installation guide"
```

## Setting Up Your Development Environment

### Prerequisites

- Node.js v18.0.0 or higher
- npm v8.0.0 or higher
- Git

### Setup Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/The-Lone-Druid/sonarqube-issues-exporter.git
   cd sonarqube-issues-exporter
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up configuration**

   ```bash
   cp .env.example .env
   # Edit .env with your SonarQube settings
   ```

4. **Build the project**

   ```bash
   npm run build
   ```

5. **Run development version**
   ```bash
   npm run dev
   ```

### Development Commands

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Interactive commit (recommended)
npm run commit

# Create a release (maintainers only)
npm run release
```

## Getting Help

If you need help, you can:

- Check the documentation
- Open an issue with your question
- Contact the maintainers

Thank you for contributing!
