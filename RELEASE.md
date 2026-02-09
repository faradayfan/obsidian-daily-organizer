# Release Process

This document describes how to create a new release of the Obsidian Daily Organizer plugin using **Release Please**.

## Overview

This project uses [Release Please](https://github.com/googleapis/release-please) to automate:
- Version bumping based on [Conventional Commits](https://www.conventionalcommits.org/)
- CHANGELOG.md generation
- GitHub release creation
- Asset uploads (main.js, manifest.json, styles.css)

## How It Works

1. **You commit with conventional commit messages** (e.g., `feat:`, `fix:`, `docs:`)
2. **Release Please creates a release PR** automatically when commits are pushed to main
3. **You merge the release PR** when ready
4. **Release is created automatically** with proper versioning and changelog

## Conventional Commit Format

### Commit Message Structure

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

| Type       | Description                           | Version Bump | Appears in CHANGELOG |
| ---------- | ------------------------------------- | ------------ | -------------------- |
| `feat:`    | New feature                           | Minor        | ✅ Features          |
| `fix:`     | Bug fix                               | Patch        | ✅ Bug Fixes         |
| `docs:`    | Documentation only                    | Patch        | ✅ Documentation     |
| `perf:`    | Performance improvement               | Patch        | ✅ Performance       |
| `refactor:`| Code refactoring                      | Patch        | ✅ Refactoring       |
| `test:`    | Adding/updating tests                 | Patch        | ❌ Hidden            |
| `chore:`   | Maintenance tasks                     | Patch        | ❌ Hidden            |
| `ci:`      | CI/CD changes                         | Patch        | ❌ Hidden            |
| `style:`   | Code style changes (formatting, etc.) | Patch        | ❌ Hidden            |
| `revert:`  | Revert a previous commit              | Patch        | ✅ Reverts           |

### Breaking Changes

To trigger a **major version** bump, add `BREAKING CHANGE:` in the commit footer:

```
feat: redesign settings interface

BREAKING CHANGE: Settings schema has changed. Users must reconfigure.
```

Or use `!` after the type:

```
feat!: redesign settings interface
```

### Examples

#### Feature (Minor Version Bump)

```bash
git commit -m "feat: add debounced auto-processing for task metadata

- Add debounce timer to delay processing until editing stops
- Add settings for configuring debounce delay
- Default delay is 5 seconds"
```

Result: `1.0.0` → `1.1.0`

#### Bug Fix (Patch Version Bump)

```bash
git commit -m "fix: prevent duplicate date headers in project updates

The LLM was including date headers even when explicitly told not to.
Updated prompt with clearer instructions and examples."
```

Result: `1.0.0` → `1.0.1`

#### Documentation

```bash
git commit -m "docs: update README with debounce feature"
```

Result: `1.0.0` → `1.0.1`

#### Breaking Change (Major Version Bump)

```bash
git commit -m "feat!: redesign settings interface

BREAKING CHANGE: Settings have been reorganized into categories.
Users will need to reconfigure their settings after upgrading."
```

Result: `1.0.0` → `2.0.0`

## Release Workflow

### 1. Normal Development

Work on features and bug fixes as usual:

```bash
# Create a feature branch
git checkout -b feat/new-feature

# Make changes and commit with conventional commits
git add .
git commit -m "feat: add calendar integration"

# Push to GitHub
git push origin feat/new-feature
```

### 2. Create Pull Request

Create a PR from your feature branch to `main`. The CI workflow will:
- Run linting
- Run tests
- Build the plugin

### 3. Merge to Main

Once the PR is approved and CI passes, merge it to `main`.

### 4. Release Please Creates Release PR

After merging to `main`, **Release Please** will:
1. Analyze all commits since the last release
2. Determine the version bump (major/minor/patch)
3. Generate CHANGELOG entries
4. Create a **Release PR** with these changes

The Release PR will:
- Update `package.json` version
- Update `manifest.json` version
- Update `versions.json`
- Update `CHANGELOG.md`
- Update `.release-please-manifest.json`

### 5. Review the Release PR

Check the auto-generated Release PR:
1. Go to [Pull Requests](https://github.com/faradayfan/obsidian-daily-organizer/pulls)
2. Look for a PR titled like `chore(main): release 1.1.0`
3. Review the version bump and changelog
4. **Update versions.json** (required manual step):

   ```bash
   # Checkout the release PR branch locally
   gh pr checkout <PR-NUMBER>

   # Run the update script
   node scripts/update-versions.mjs

   # Commit the change
   git add versions.json
   git commit -m "chore: update versions.json"
   git push
   ```

5. Verify all changes are correct

### 6. Merge the Release PR

When ready to release:
1. Merge the Release PR
2. Release Please will automatically:
   - Create a GitHub release
   - Generate release notes from CHANGELOG
   - Run the build workflow
   - Upload `main.js`, `manifest.json`, `styles.css`

### 7. Verify the Release

1. Go to [Releases](https://github.com/faradayfan/obsidian-daily-organizer/releases)
2. Verify the new release appears with all three files
3. Check the release notes are accurate

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes (use `BREAKING CHANGE:` or `!`)
- **MINOR** (1.0.0 → 1.1.0): New features (use `feat:`)
- **PATCH** (1.0.0 → 1.0.1): Bug fixes (use `fix:`, `docs:`, `perf:`, etc.)

### Automatic Determination

Release Please determines the version automatically:

| Commits Since Last Release       | Version Bump |
| -------------------------------- | ------------ |
| `feat: new feature`              | 1.0.0 → 1.1.0 (Minor) |
| `fix: bug fix`                   | 1.0.0 → 1.0.1 (Patch) |
| `feat!: breaking change`         | 1.0.0 → 2.0.0 (Major) |
| `feat:` + `fix:` + `docs:`       | 1.0.0 → 1.1.0 (Minor - highest wins) |

## Hotfix Process

For urgent bug fixes:

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b fix/urgent-bug

# Make the fix
# ... edit files ...

# Test thoroughly
npm run prepare-release

# Commit with conventional commit
git add .
git commit -m "fix: critical bug that breaks todo migration

The hierarchical parser was failing on deeply nested structures.
Added better error handling and validation."

# Push and create PR
git push origin fix/urgent-bug
```

After merging the hotfix PR:
1. Release Please will create a new release PR with a patch version bump
2. Merge the release PR to publish the hotfix

## Manual Release (Emergency)

If you need to create a release manually (Release Please is broken):

```bash
# Update version manually
npm version patch  # or minor/major

# Create tag
git push origin main --tags

# Manually create GitHub release and upload files
```

## Skipping Release Please

To prevent a commit from triggering a release:

```bash
git commit -m "chore: update dependencies

Release-As: 1.0.0"
```

Or use `[skip ci]` in the commit message:

```bash
git commit -m "docs: fix typo [skip ci]"
```

## Release Checklist

Before merging a Release PR:

- [ ] Version bump is correct (major/minor/patch)
- [ ] CHANGELOG entries are accurate
- [ ] All CI checks pass on the Release PR
- [ ] `manifest.json` version matches `package.json`
- [ ] `versions.json` has been updated (run `node scripts/update-versions.mjs`)
- [ ] No breaking changes without `BREAKING CHANGE:` in footer

After release is created:

- [ ] Release appears on GitHub with all files
- [ ] Release notes are clear and accurate
- [ ] Assets are uploaded (main.js, manifest.json, styles.css)

## Troubleshooting

### Release Please didn't create a PR

**Possible causes:**
- No commits with conventional commit format since last release
- All commits are `chore:`, `test:`, or `ci:` (hidden types)
- Workflow permissions issue

**Fix:**
- Check commits use conventional format
- Ensure commits include `feat:` or `fix:` for releases
- Verify GitHub Actions has write permissions

### Wrong version bump

**Cause:** Commit type doesn't match intended change

**Fix:**
- Close the Release PR
- Update commit messages with `git rebase -i`
- Force push to trigger new Release PR

### Release workflow failed

1. Check [Actions tab](https://github.com/faradayfan/obsidian-daily-organizer/actions)
2. Review error logs
3. Fix the issue
4. Re-run the workflow or manually create release

## Configuration Files

Release Please configuration is in:

- `.release-please-config.json` - Main configuration
- `.release-please-manifest.json` - Version tracking
- `.github/workflows/release-please.yml` - GitHub Actions workflow

## Resources

- [Release Please Documentation](https://github.com/googleapis/release-please)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)

## Questions?

If you have questions about the release process:

- Check the [Release Please docs](https://github.com/googleapis/release-please)
- Review existing Release PRs for examples
- Open an issue for discussion
