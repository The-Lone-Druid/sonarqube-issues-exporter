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
5. **Test**: Ensure all tests pass: `pnpm test`
6. **Commit**: Use conventional commits: `git commit -m "type(scope): description"`
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
git commit -m "feat: add new export format"
git commit -m "fix: resolve memory leak in large reports"
git commit -m "docs: update installation guide"
```

## Setting Up Your Development Environment

### Prerequisites

- Node.js v20.0.0 or higher
- pnpm v9.0.0 or higher (`npm install -g pnpm` or `corepack enable`)
- Git

### Setup Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/The-Lone-Druid/sonarqube-issues-exporter.git
   cd sonarqube-issues-exporter
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up configuration**

   If you have a SonarQube instance available, set `SONARQUBE_URL` and `SONARQUBE_TOKEN` in a `.env` file for manual testing.

4. **Build the project**

   ```bash
   pnpm build
   ```

5. **Run development version**
   ```bash
   pnpm dev
   ```

### Development Commands

```bash
# Development with hot reload
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Lint code
pnpm lint

# Format code
pnpm format

# Create a release (maintainers only)
pnpm release
```

### CI gates

Before opening a pull request, ensure all of the following pass locally:

```bash
pnpm lint && pnpm exec knip && pnpm test:coverage && pnpm build
```

## Getting Help

If you need help, you can:

- Check the documentation
- Open an issue with your question
- Contact the maintainers

Thank you for contributing!
