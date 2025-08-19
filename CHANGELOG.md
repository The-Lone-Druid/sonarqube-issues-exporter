# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.0.0](https://github.com/The-Lone-Druid/sonarqube-issues-exporter/releases/tag/v2.0.0) (2025-08-19)

### 🚀 Features

- **npm-package**: Convert solution to NPM package for global installation
- **cli**: Add binary commands `sonarqube-exporter` and `sq-exporter`
- **types**: Complete TypeScript type system reorganization into 8 specialized modules
- **templates**: Add GitHub repository links and enhanced dark mode support
- **build**: Add automated build and packaging system
- **docs**: Comprehensive installation and usage guides

### 🐛 Bug Fixes

- **config**: Fix environment variable loading in test environments
- **styling**: Resolve dark mode background and footer visibility issues
- **dev**: Fix npm run dev command and development workflow
- **templates**: Proper template and asset copying in build process

### 📚 Documentation

- **guides**: Add NPM installation and usage guide
- **publishing**: Add comprehensive publishing instructions
- **readme**: Update with NPM package installation methods
- **examples**: Add multiple configuration and usage examples

### 🏗️ Build System

- **npm**: Configure package.json for global CLI installation
- **types**: Reorganize TypeScript types into dedicated modules
- **build**: Add pre-publish automation and validation
- **ignore**: Configure .npmignore for clean package distribution

### 🔧 Maintenance

- **husky**: Set up Git hooks for code quality
- **eslint**: Configure linting rules and automation
- **prettier**: Set up code formatting standards
- **jest**: Configure comprehensive testing suite

### ⚡ Performance Improvements

- **types**: Optimize type loading and compilation
- **build**: Streamline build process and asset copying
- **cli**: Improve command-line interface responsiveness

---

**Installation:**

```bash
npm install -g sonarqube-issues-exporter
```

**Usage:**

```bash
sonarqube-exporter export --help
# or
sq-exporter export --help
```
