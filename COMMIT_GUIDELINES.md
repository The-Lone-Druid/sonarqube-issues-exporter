# Commit Message Guidelines

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification for clear and consistent commit messages.

## 🚀 Quick Start

### Interactive Commit Tool

Use the interactive commit tool for guided commit message creation:

```bash
npm run commit
```

This will prompt you through creating a properly formatted commit message.

### Manual Commit Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## 📋 Commit Types

| Type       | Description                                                | Example                                               |
| ---------- | ---------------------------------------------------------- | ----------------------------------------------------- |
| `feat`     | A new feature                                              | `feat(cli): add export validation command`            |
| `fix`      | A bug fix                                                  | `fix(config): resolve environment variable loading`   |
| `docs`     | Documentation changes                                      | `docs(readme): update installation instructions`      |
| `style`    | Code style changes (formatting, missing semi-colons, etc.) | `style(types): format type definitions`               |
| `refactor` | Code refactoring without adding features or fixing bugs    | `refactor(services): extract common validation logic` |
| `perf`     | Performance improvements                                   | `perf(exporter): optimize large report generation`    |
| `test`     | Adding or updating tests                                   | `test(config): add environment variable tests`        |
| `build`    | Build system or external dependency changes                | `build(deps): update typescript to 5.2.2`             |
| `ci`       | CI/CD configuration changes                                | `ci(github): add automated release workflow`          |
| `chore`    | Maintenance tasks                                          | `chore(deps): update dependencies`                    |
| `revert`   | Reverting a previous commit                                | `revert: feat(cli): add export validation`            |

## 🎯 Scopes

Use scopes to specify which part of the codebase is affected:

- `cli` - Command-line interface
- `config` - Configuration system
- `types` - TypeScript type definitions
- `services` - Service layer (SonarQube API, etc.)
- `exporters` - Export functionality (HTML, etc.)
- `templates` - Template files and rendering
- `utils` - Utility functions
- `tests` - Test files
- `docs` - Documentation
- `build` - Build system
- `deps` - Dependencies

## ✅ Good Examples

### Feature Addition

```bash
feat(cli): add support for custom output formats

- Add JSON and CSV export options
- Update CLI help text with new format options
- Add validation for supported formats

Closes #123
```

### Bug Fix

```bash
fix(config): resolve environment variable precedence

Environment variables were not overriding config file values
due to loading order. Fixed by restructuring config loading
to prioritize env vars.

Fixes #456
```

### Documentation

```bash
docs(api): add JSDoc comments to service methods

- Document all public methods in SonarQubeService
- Add parameter and return type descriptions
- Include usage examples for complex methods
```

### Refactoring

```bash
refactor(types): consolidate type definitions

- Move scattered types into dedicated modules
- Improve type organization and discoverability
- Add comprehensive JSDoc documentation

BREAKING CHANGE: Type imports now use new module structure
```

## ❌ What to Avoid

### Too Vague

```bash
# ❌ Bad
fix: bug fix
chore: updates
feat: new stuff
```

### Too Long/Unfocused

```bash
# ❌ Bad
feat: add new CLI command and fix config loading and update docs and refactor types
```

### Wrong Type

```bash
# ❌ Bad - Should be 'docs'
feat: update README

# ❌ Bad - Should be 'fix'
chore: resolve template loading issue
```

## 🏷️ Special Cases

### Breaking Changes

```bash
feat(api)!: change SonarQubeService constructor signature

BREAKING CHANGE: SonarQubeService now requires config object
instead of individual parameters. This improves maintainability
and enables future extensibility.

Before:
new SonarQubeService(url, token, projectKey)

After:
new SonarQubeService(config)
```

### Issue References

```bash
fix(auth): handle expired tokens gracefully

- Add token expiration detection
- Implement automatic token refresh
- Show user-friendly error messages

Fixes #789
Closes #790
Related to #791
```

### Co-authored Commits

```bash
feat(export): add progress indicators for large exports

- Show progress bar during issue fetching
- Display estimated time remaining
- Add cancellation support

Co-authored-by: Developer Name <dev@example.com>
```

## 🔧 Validation

This project uses automated commit message validation:

- **commitlint** validates format on commit
- **Husky** hooks prevent invalid commits
- **standard-version** generates changelogs from commits

### Bypass Validation (Emergency Only)

```bash
git commit --no-verify -m "emergency: critical hotfix"
```

## 📊 Release Workflow

### Automatic Versioning

```bash
# Let standard-version determine version bump
npm run release

# Force specific version bumps
npm run release:patch    # 2.0.0 → 2.0.1
npm run release:minor    # 2.0.0 → 2.1.0
npm run release:major    # 2.0.0 → 3.0.0

# Preview changes without committing
npm run release:dry
```

### Version Bump Rules

- `feat` → **minor** version bump
- `fix` → **patch** version bump
- `BREAKING CHANGE` → **major** version bump
- `docs`, `style`, `refactor`, `test`, `chore` → **patch** version bump

## 🎨 Emoji Guide (Optional)

You can enhance commit messages with emojis for better visual scanning:

```bash
feat: ✨ add export validation command
fix: 🐛 resolve environment variable loading
docs: 📚 update installation instructions
style: 💄 format type definitions
refactor: ♻️ extract common validation logic
perf: ⚡ optimize large report generation
test: 🧪 add environment variable tests
build: 🏗️ update typescript to 5.2.2
ci: 👷 add automated release workflow
chore: 🔧 update dependencies
```

## 🤝 Tips for Success

1. **Start with the type** - Think about what kind of change you're making
2. **Be specific with scope** - Help reviewers understand the impact area
3. **Write for humans** - Your future self will thank you
4. **Reference issues** - Link commits to project management
5. **Use the body** - Explain the "why" not just the "what"
6. **Test your changes** - Ensure commits represent working code
7. **Use interactive tool** - `npm run commit` guides you through the process

## 📚 Resources

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
- [Commitizen](https://github.com/commitizen/cz-cli)
- [commitlint](https://commitlint.js.org/)
- [standard-version](https://github.com/conventional-changelog/standard-version)
