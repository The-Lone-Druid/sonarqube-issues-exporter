# 🚀 Versioning & Release Automation Guide

This project uses automated semantic versioning based on conventional commits. Here's how it works and how to use it.

## 📋 How It Works

### Automatic Version Bumping

- **Patch** (2.0.0 → 2.0.1): `fix:` commits
- **Minor** (2.0.0 → 2.1.0): `feat:` commits
- **Major** (2.0.0 → 3.0.0): `BREAKING CHANGE:` in commit body or `feat!:`/`fix!:`

### Commit Types & Versioning Impact

| Commit Type        | Version Bump | Changelog Section           |
| ------------------ | ------------ | --------------------------- |
| `feat:`            | Minor        | 🚀 Features                 |
| `fix:`             | Patch        | 🐛 Bug Fixes                |
| `perf:`            | Patch        | ⚡ Performance Improvements |
| `refactor:`        | Patch        | ♻️ Code Refactoring         |
| `docs:`            | Patch        | 📚 Documentation            |
| `test:`            | Patch        | 🧪 Tests                    |
| `build:`           | Patch        | 🏗️ Build System             |
| `ci:`              | Patch        | 👷 CI/CD                    |
| `style:`           | Patch        | 💄 Styles                   |
| `chore:`           | Patch        | 🔧 Maintenance              |
| `BREAKING CHANGE:` | Major        | ⚠ BREAKING CHANGES         |

## 🎯 Release Commands

### Manual Release (Recommended)

```bash
# Let standard-version determine the version bump
npm run release

# Preview what would happen (dry run)
npm run release:dry

# Force specific version bumps
npm run release:patch    # 2.0.0 → 2.0.1
npm run release:minor    # 2.0.0 → 2.1.0
npm run release:major    # 2.0.0 → 3.0.0

# First release (for new projects)
npm run release:first
```

### After Release

```bash
# Push tags and publish to NPM
npm run postrelease
```

## 🤖 Automated Release (GitHub Actions)

### When It Triggers

The automated release workflow runs on:

- Push to `main` branch
- Excludes documentation-only changes (\*.md files)
- Skips if commit message contains "chore(release)"

### What It Does

1. **Analyze Commits**: Scans commit messages since last release
2. **Determine Version**: Calculates new version based on commit types
3. **Update Files**: Updates package.json, package-lock.json, CHANGELOG.md
4. **Create Git Tag**: Creates annotated git tag (e.g., v2.1.0)
5. **Generate Release**: Creates GitHub release with changelog
6. **Publish NPM**: Publishes package to NPM registry

### Required Secrets

Ensure these are set in GitHub repository settings:

- `GITHUB_TOKEN`: Automatically provided
- `NPM_TOKEN`: Your NPM access token for publishing

## 📝 Workflow Examples

### Example 1: Bug Fix Release

```bash
# Make a bug fix
git add .
git commit -m "fix: resolve memory leak in large report generation"

# Create release (manual)
npm run release:dry    # Preview changes
npm run release        # Create v2.0.1
npm run postrelease    # Push and publish

# Or push to main for automated release
git push origin main
```

### Example 2: Feature Release

```bash
# Add a new feature
git add .
git commit -m "feat(export): add support for PDF export format

- Implement PDF generation using Puppeteer
- Add PDF-specific configuration options
- Update CLI with --format=pdf option"

# Automatic release to v2.1.0 when pushed to main
git push origin main
```

### Example 3: Breaking Change Release

```bash
# Breaking change
git add .
git commit -m "feat!: restructure configuration format

- Simplify config object structure
- Remove deprecated legacy options
- Improve type safety and validation

BREAKING CHANGE: Configuration format has changed.
See MIGRATION.md for upgrade instructions."

# Automatic release to v3.0.0 when pushed to main
git push origin main
```

## 🔍 Understanding the Output

### Release Dry Run Example

```bash
$ npm run release:dry

√ bumping version in package.json from 2.0.0 to 2.1.0
√ bumping version in package-lock.json from 2.0.0 to 2.1.0
√ outputting changes to CHANGELOG.md

---
## [2.1.0](https://github.com/.../compare/v2.0.0...v2.1.0) (2025-08-19)

### 🚀 Features
* **export**: add CSV export format ([abc123](link))

### 🐛 Bug Fixes
* **cli**: handle missing config file gracefully ([def456](link))
---

√ committing package-lock.json and package.json and CHANGELOG.md
√ tagging release v2.1.0
i Run `git push --follow-tags origin main && npm publish` to publish
```

## 📊 Release Process Flow

```mermaid
graph TD
    A[Commit to main] --> B{Contains 'chore(release)'?}
    B -->|Yes| C[Skip Release]
    B -->|No| D[GitHub Actions Triggered]
    D --> E[Install Dependencies]
    E --> F[Run Tests]
    F --> G[Build Project]
    G --> H[Analyze Commits]
    H --> I{Changes Found?}
    I -->|No| J[Skip Release]
    I -->|Yes| K[Generate Version]
    K --> L[Update CHANGELOG.md]
    L --> M[Create Git Tag]
    M --> N[Create GitHub Release]
    N --> O[Publish to NPM]
```

## 🛠️ Troubleshooting

### Common Issues

1. **Release Not Triggered**
   - Check if commit contains "chore(release)"
   - Verify commit follows conventional format
   - Ensure push is to main branch

2. **NPM Publish Fails**
   - Check NPM_TOKEN is set correctly
   - Verify package name isn't taken
   - Ensure you're logged into NPM

3. **Version Not Bumped**
   - Check commit message format
   - Ensure commits since last release have conventional types
   - Use `npm run release:dry` to preview

### Manual Release Recovery

If automated release fails:

```bash
# Reset to before failed release
git reset --hard HEAD~1
git tag -d v2.1.0  # if tag was created

# Try manual release
npm run release:dry
npm run release
npm run postrelease
```

## 📋 Best Practices

1. **Use Conventional Commits**: Always follow the format `type(scope): description`
2. **Preview First**: Use `npm run release:dry` before manual releases
3. **Test Before Release**: Ensure tests pass before merging to main
4. **Write Good Descriptions**: Commit descriptions become changelog entries
5. **Document Breaking Changes**: Always explain breaking changes in commit body
6. **Use Scopes**: Add scopes to categorize changes (e.g., `feat(cli):`, `fix(api):`)

## 🔗 Related Tools

- **commitizen**: `npm run commit` for interactive commit creation
- **commitlint**: Validates commit message format on commit
- **husky**: Git hooks for automated checks
- **standard-version**: Automated versioning and changelog generation
- **lint-staged**: Code formatting before commits

## 📚 Documentation References

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Standard Version](https://github.com/conventional-changelog/standard-version)
- [GitHub Actions](https://docs.github.com/en/actions)
