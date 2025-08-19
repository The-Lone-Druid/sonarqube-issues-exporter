# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [3.1.0](https://github.com/The-Lone-Druid/sonarqube-issues-exporter/compare/v3.0.0...v3.1.0) (2025-08-19)


### 🔧 Maintenance

* package identification ([fec602c](https://github.com/The-Lone-Druid/sonarqube-issues-exporter/commit/fec602c4bc91e057447884f76addd6ea85f878eb))


### 🐛 Bug Fixes

* cli ([631d414](https://github.com/The-Lone-Druid/sonarqube-issues-exporter/commit/631d4149f76e3c67ee73f717e6dcc4fad04acc69))
* github ci ([55d86a3](https://github.com/The-Lone-Druid/sonarqube-issues-exporter/commit/55d86a3f2008722bc487b862614b696bb657eb8a))
* set environment variables before imports in test files to fix ci validation errors ([9994d92](https://github.com/The-Lone-Druid/sonarqube-issues-exporter/commit/9994d92e477d651bf2c624a498948c7b5ee8b556))


### 🚀 Features

* improve auto-deployment workflow with better error handling and permissions ([a014ab4](https://github.com/The-Lone-Druid/sonarqube-issues-exporter/commit/a014ab46a0ad7aa4a08cb0b3ac496f7e4f11053f))


### 📚 Documentation

* **.md:** updated all .md files to reflect proper changes and concise documentation ([206c6eb](https://github.com/The-Lone-Druid/sonarqube-issues-exporter/commit/206c6eb1157887d86dc1b6e4336827660cbb38f6))
* enhance package description to highlight dark theme feature ([887fecc](https://github.com/The-Lone-Druid/sonarqube-issues-exporter/commit/887fecc10e2f12e5edb57700d091072a6b293a3b))

## 3.0.0 (2025-08-19)

### ⚠ BREAKING CHANGES

- Complete project restructure - use npm installation instead of direct script

### 🚀 Features

- added dark theme ([e09812f](https://github.com/The-Lone-Druid/sonarqube-issues-exporter/commit/e09812f8cf729fe84b640dae5291932ce52beed1))
- added metrics for sonarqube issues ([337ef57](https://github.com/The-Lone-Druid/sonarqube-issues-exporter/commit/337ef57f10697d466f112a6e810a90925a3353ff))
- github repository configuration files ([c54e515](https://github.com/The-Lone-Druid/sonarqube-issues-exporter/commit/c54e5156519b64a9914dd40b60a604de7a96b1cc))
- implemented and tested sonarqube issues exporter ([819970b](https://github.com/The-Lone-Druid/sonarqube-issues-exporter/commit/819970bb19f24451d29a330a6b827aceb4ccd045))
- transform to enterprise npm package with automated workflows ([2b5f13c](https://github.com/The-Lone-Druid/sonarqube-issues-exporter/commit/2b5f13ce1313171466c4e7fbe6f46d94106696f7))
- updated docs ([95b948c](https://github.com/The-Lone-Druid/sonarqube-issues-exporter/commit/95b948cf125e33f1e58cb5989b5d6e19ef55c416))

### 🐛 Bug Fixes

- configure line endings and resolve crlf issues ([5528ebc](https://github.com/The-Lone-Druid/sonarqube-issues-exporter/commit/5528ebca7a1e69c18ba6d144861d5f884fe2c8b1))
- filtering out closed issues, removing unwanted code ([65d8015](https://github.com/The-Lone-Druid/sonarqube-issues-exporter/commit/65d80154a324c9446902afe6b078609a25e25c71))
- git ignored generated .html report ([99cb72f](https://github.com/The-Lone-Druid/sonarqube-issues-exporter/commit/99cb72f2450191b8316b9371f29687b5b41e128d))
- removed html report ifle ([fbac673](https://github.com/The-Lone-Druid/sonarqube-issues-exporter/commit/fbac6730a1c43a02c566685c8f2aed0b6d2082d2))
- removed workflow files ([e345ffe](https://github.com/The-Lone-Druid/sonarqube-issues-exporter/commit/e345ffe457d328ed821834cc5c54ca3dfe87603b))

### 📚 Documentation

- add comprehensive versioning automation guide ([1f112ea](https://github.com/The-Lone-Druid/sonarqube-issues-exporter/commit/1f112ea86795a468b10a626edbe6f258cd28ddfe))
- added setup documentation and contribution help ([6a46e8c](https://github.com/The-Lone-Druid/sonarqube-issues-exporter/commit/6a46e8cb53e0593303ce2ed48b1e30eef1c40a03))

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
