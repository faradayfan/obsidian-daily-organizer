# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0](https://github.com/faradayfan/obsidian-daily-organizer/compare/v1.1.1...v1.2.0) (2026-02-11)


### Features

* changed the project tag convention, support for project archival ([654dbfd](https://github.com/faradayfan/obsidian-daily-organizer/commit/654dbfd74c936f5b4042cac96466d1697409c952))

## [1.1.1](https://github.com/faradayfan/obsidian-daily-organizer/compare/v1.1.0...v1.1.1) (2026-02-10)


### Bug Fixes

* fixing bug with tagging being done for all pages ([4aed2b2](https://github.com/faradayfan/obsidian-daily-organizer/commit/4aed2b281f67e95a2df4493e3c4f8f1c2d08cfef))

## [1.1.0](https://github.com/faradayfan/obsidian-daily-organizer/compare/v1.0.0...v1.1.0) (2026-02-10)


### Features

* adding notice on daily note creation and related actions ([cad42ed](https://github.com/faradayfan/obsidian-daily-organizer/commit/cad42ed7e5b7fdf96b42a8efb2dda8bd7ee3071e))


### Bug Fixes

* bumping dependencies ([9e9c0c1](https://github.com/faradayfan/obsidian-daily-organizer/commit/9e9c0c1c84112d7a011d93170e82762bf80510f5))
* fixing duplicate created metadata on task migration ([418fc53](https://github.com/faradayfan/obsidian-daily-organizer/commit/418fc536dcc7c871030e23ed5806d49d0dadccc9))
* linting ([99bf8ee](https://github.com/faradayfan/obsidian-daily-organizer/commit/99bf8eebb0617b43ceb29687eb6497910ddc8565))
* typescript upgrade 5.8.3 to 5.9.3 ([fba6acc](https://github.com/faradayfan/obsidian-daily-organizer/commit/fba6accd2e79cee88c694948b56857806b34ab60))

## 1.0.0 (2026-02-09)


### Features

* adding debounce ([c7289be](https://github.com/faradayfan/obsidian-daily-organizer/commit/c7289be3d545b04f2909660a4b08b88ac55b3bad))
* due date metadata ([9e0a135](https://github.com/faradayfan/obsidian-daily-organizer/commit/9e0a13569087fe1057c171eabd4544d7bc4419f3))
* generate keyword as array ([5f0c7ac](https://github.com/faradayfan/obsidian-daily-organizer/commit/5f0c7ac0a2962ab211f9141092ddd00de7fe7795))
* initial feature set ([b75d068](https://github.com/faradayfan/obsidian-daily-organizer/commit/b75d0681e2c96c5aa994726b64f8d023c97f7426))
* project keyword updated ([4c35949](https://github.com/faradayfan/obsidian-daily-organizer/commit/4c35949f99647903203255a424c9c1b7465f939c))
* shorthand support ([dc7f5ef](https://github.com/faradayfan/obsidian-daily-organizer/commit/dc7f5ef07b7c462cb302ad913eb7c6fcd01e334e))
* support for arrays ([0b79068](https://github.com/faradayfan/obsidian-daily-organizer/commit/0b79068d40ef9cf9e7e681b770ea9f25db7666f8))
* updated claude models ([d06bac5](https://github.com/faradayfan/obsidian-daily-organizer/commit/d06bac50930631c966ac2c15dd7f370c7a61fc24))


### Bug Fixes

* addessing linting issues ([5c5e120](https://github.com/faradayfan/obsidian-daily-organizer/commit/5c5e1203a1a5600c8d00c2e9bb01328647cb7042))
* automated release version handling ([bcb9ac6](https://github.com/faradayfan/obsidian-daily-organizer/commit/bcb9ac6a9a39753c080ad2399b5a1bf70a164394))
* fix bug with todo migration, added tests ([56b97be](https://github.com/faradayfan/obsidian-daily-organizer/commit/56b97be247dfbcfd4c7af4038d7e4fca21e79100))
* fixed bug on startup ([902e205](https://github.com/faradayfan/obsidian-daily-organizer/commit/902e205ea3a56d42103fe0494694005a2a173c4b))
* fixing bugs with project updater ([ddf82e6](https://github.com/faradayfan/obsidian-daily-organizer/commit/ddf82e6f1e4a343a2656b9efb5e76bd8f1d30c20))
* fixing order ([7f47b84](https://github.com/faradayfan/obsidian-daily-organizer/commit/7f47b84344fd0ff09fe82f379c6484798ca7e8a9))
* fixing release tooling ([c01c8b6](https://github.com/faradayfan/obsidian-daily-organizer/commit/c01c8b6af2ff88668e398e6d2df4ac536da1c0dd))
* fixing update project ([705c214](https://github.com/faradayfan/obsidian-daily-organizer/commit/705c214733b50949ca13a9d002feee22cdf1324f))
* fixing workflows ([59ea81b](https://github.com/faradayfan/obsidian-daily-organizer/commit/59ea81bc375927fd0082037ffcb2cbe13159bcdf))
* more fixing ([e50dcb0](https://github.com/faradayfan/obsidian-daily-organizer/commit/e50dcb065f7b3ea022e2def5d68bf8935eb46661))
* more updates ([17cc485](https://github.com/faradayfan/obsidian-daily-organizer/commit/17cc485d5026e17e230d34ea1dc5f8d9db781ac8))

## [Unreleased]

### Added

- Debounced auto-processing for task metadata (waits for editing to stop before processing)
- Debounced auto-tagging for project tags (waits for editing to stop before tagging)
- Configurable debounce delays for both features (default: 5 seconds)
- Settings for enabling/disabling debounced auto-processing on edit

## [1.0.0] - 2025-02-09

### Added

- Hierarchical todo migration with nested structure support
- AI-powered project updates using Claude or OpenAI
- LLM-generated project keywords for better relevance filtering
- Task metadata auto-detection (created date, due date, priority, completion date)
- Natural language parsing for due dates and priorities
- Task tagging based on project keywords
- Real-time completion date tracking
- Auto-migration on new daily note creation
- Auto-update projects on new daily note creation
- Comprehensive settings for all features
- Support for both inline field format and emoji shorthand format
- Manual commands for all features
- 73 Jest tests with >80% code coverage

### Features

#### Todo Migration

- Migrates nested todos and plain bullets as complete subtrees
- Only skips migration if ALL child tasks in a subtree are completed
- Preserves indentation and nesting relationships
- Supports both checkboxes and plain bullets

#### Project Updates

- Extracts only relevant updates for each project
- Matches the style and format of previous updates
- Respects project-specific frontmatter guidance
- Pre-filters content using keywords (manual or LLM-generated)
- Inserts updates with automatic date headers

#### Task Metadata

- Created date: Added when task is created or processed
- Due date: Parsed from natural language expressions (e.g., "by tomorrow", "end of day")
- Priority: Parsed from natural language (e.g., "high priority", "urgent")
- Completion date: Added/removed automatically when checking/unchecking tasks
- Supports both inline field format and emoji shorthand

#### Task Tagging

- Automatically tags tasks with project tags based on keyword matching
- Runs before metadata processing for better context
- Excludes sections marked with `#ignore-project-tagging`
- Tags inserted before metadata fields

### Documentation

- Comprehensive README with examples and troubleshooting
- Detailed configuration guide
- Development setup instructions
- Contributing guidelines
- 0-BSD License

### Technical

- TypeScript codebase with ESLint configuration
- Jest test suite with watch mode and coverage reporting
- ESBuild for fast compilation
- Obsidian Plugin API integration
- Support for Claude (Anthropic) and OpenAI LLM providers

[Unreleased]: https://github.com/faradayfan/obsidian-daily-organizer/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/faradayfan/obsidian-daily-organizer/releases/tag/v1.0.0
