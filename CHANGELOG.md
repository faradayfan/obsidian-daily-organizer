# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
