# Contributing to Obsidian Daily Organizer

Thank you for your interest in contributing to the Obsidian Daily Organizer plugin! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [License](#license)

## Code of Conduct

This project follows a simple code of conduct:

- Be respectful and considerate
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/obsidian-daily-organizer.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes thoroughly
6. Submit a pull request

## Development Setup

### Prerequisites

- Node.js v16 or higher
- npm or yarn
- Obsidian app (for testing)
- Git

### Installation

```bash
# Clone the repository
cd /path/to/your/vault/.obsidian/plugins/
git clone https://github.com/YOUR_USERNAME/obsidian-daily-organizer.git
cd obsidian-daily-organizer

# Install dependencies
npm install

# Start development build (watches for changes)
npm run dev
```

### Project Structure

```
obsidian-daily-organizer/
├── src/
│   ├── main.ts                    # Plugin entry point
│   ├── settings.ts                # Settings interface and UI
│   ├── services/                  # Core services (LLM, etc.)
│   ├── features/                  # Feature implementations
│   │   ├── todo-migration/        # Todo migration logic
│   │   ├── project-updates/       # Project update logic
│   │   ├── task-metadata/         # Task metadata handling
│   │   └── task-tagging/          # Task tagging logic
│   └── utils/                     # Utility functions
├── tests/                         # Jest tests
├── manifest.json                  # Plugin manifest
└── package.json                   # NPM package config
```

## How to Contribute

### Reporting Bugs

When reporting bugs, please include:

- Obsidian version
- Plugin version
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Console errors (open with Cmd/Ctrl + Shift + I)

### Suggesting Features

Feature suggestions are welcome! Please:

- Check if the feature has already been requested
- Provide a clear use case
- Explain how it fits with existing features
- Consider backwards compatibility

### Code Contributions

We welcome:

- Bug fixes
- New features
- Performance improvements
- Documentation improvements
- Test coverage improvements

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Follow existing code style
- Use meaningful variable and function names
- Add type annotations where helpful
- Avoid `any` types when possible

### Code Style

- Use tabs for indentation
- Use single quotes for strings
- Add JSDoc comments for public methods
- Keep functions focused and small
- Use early returns to reduce nesting

### Example

```typescript
/**
 * Parses a daily note filename and extracts the date.
 * @param filename - The filename to parse (e.g., "2026-02-06.md")
 * @returns The parsed date or null if invalid
 */
export function extractDateFromFilename(filename: string): Date | null {
	const match = filename.match(/^(\d{4})-(\d{2})-(\d{2})/);
	if (!match) {
		return null;
	}

	const [, year, month, day] = match;
	return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Write tests for all new features
- Write tests for bug fixes
- Aim for >80% code coverage
- Use descriptive test names
- Follow the existing test structure

### Test Example

```typescript
describe('extractDateFromFilename', () => {
	it('should parse valid YYYY-MM-DD filenames', () => {
		const result = extractDateFromFilename('2026-02-06.md');
		expect(result).toEqual(new Date(2026, 1, 6));
	});

	it('should return null for invalid filenames', () => {
		const result = extractDateFromFilename('invalid.md');
		expect(result).toBeNull();
	});
});
```

## Pull Request Process

1. **Update Documentation**: Update README.md if you're adding features
2. **Add Tests**: Ensure new code has test coverage
3. **Run Linter**: `npm run lint` and fix any issues
4. **Run Tests**: `npm test` and ensure all tests pass
5. **Build**: `npm run build` and verify it succeeds
6. **Commit Messages**: Use clear, descriptive commit messages
7. **PR Description**: Describe what changes you made and why

### Commit Message Format

```
feat: add debounced auto-processing for task metadata

- Add debounce timer to delay processing until editing stops
- Add settings for configuring debounce delay
- Update documentation

Fixes #123
```

### PR Checklist

- [ ] Code follows the project's style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated (if needed)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Changes are backwards compatible (or breaking changes are documented)
- [ ] Commit messages are clear and descriptive

## Release Process

Releases are managed by the repository maintainers:

1. Version bump using `npm version [patch|minor|major]`
2. Update CHANGELOG.md
3. Create GitHub release with release notes
4. Upload `main.js`, `manifest.json`, and `styles.css` to the release

## License

By contributing to Obsidian Daily Organizer, you agree that your contributions will be licensed under the **0-BSD License** (Zero-Clause BSD).

### 0-BSD License

```
Copyright (C) 2025 by faradayfan

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### What This Means

The 0-BSD License is extremely permissive:

- ✅ Use for any purpose (commercial or personal)
- ✅ Modify and distribute freely
- ✅ No attribution required (though appreciated!)
- ✅ No warranty or liability
- ✅ Compatible with all other licenses

You retain copyright over your contributions, but grant everyone (including the project) the right to use them under these terms.

## Questions?

If you have questions about contributing:

- Open an issue for discussion
- Check existing issues and PRs
- Read the [README.md](README.md) for usage information

Thank you for contributing! 🎉
