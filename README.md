# Obsidian Daily Organizer

An Obsidian plugin that automatically manages your daily notes and project pages, including intelligent todo migration and AI-powered project updates.

## Features

### 1. Hierarchical Todo Migration

Automatically migrates uncompleted todos from the previous daily note to the current one, preserving the entire nested structure.

**Key Behaviors:**

- Migrates nested todos and plain bullets as complete subtrees
- Only skips migration if ALL child tasks in a subtree are completed
- If ANY task in a nested structure is incomplete, the ENTIRE structure moves
- Preserves indentation and nesting relationships
- Supports both checkboxes (`- [ ]`) and plain bullets (`-`)

**Example:**

```markdown
## Previous Day's Todos

- [ ] Write documentation
    - [x] Draft outline
    - [ ] Write examples ← incomplete
        - [ ] Example 1
    - [ ] Review

## Today's Todos (after migration)

- [ ] Write documentation
    - [x] Draft outline
    - [ ] Write examples
        - [ ] Example 1
    - [ ] Review
```

The entire "Write documentation" subtree moves because "Write examples" is incomplete, even though "Draft outline" is complete.

### 2. AI-Powered Project Updates

Uses LLM (Claude or OpenAI) to analyze your daily notes and intelligently update project pages with relevant progress.

**Key Behaviors:**

- Extracts only relevant updates for each project
- Matches the style and format of previous updates
- Respects project-specific frontmatter guidance
- Pre-filters content using keywords (manual or LLM-generated)
- Inserts updates with automatic date headers

### 3. LLM-Generated Project Keywords

Automatically generates relevant keywords for each project by analyzing project content (Goals, Status, Overview sections).

**Key Behaviors:**

- Analyzes project sections to identify key terms, technologies, and concepts
- Generates 5-15 relevant keywords per project
- Saves keywords to the project's `update_keywords` frontmatter field
- Keywords are used to pre-filter daily notes for relevance
- Can be run manually or automatically during project updates

## Installation

### Manual Installation

1. Download the latest release files: `main.js`, `manifest.json`, `styles.css`
2. Create a folder: `VaultFolder/.obsidian/plugins/obsidian-daily-organizer/`
3. Copy the downloaded files into this folder
4. Reload Obsidian
5. Enable "Daily Organizer" in Settings → Community plugins

### Development Installation

```bash
# Clone this repo into your vault's plugins folder
cd /path/to/vault/.obsidian/plugins/
git clone https://github.com/yourusername/obsidian-daily-organizer.git
cd obsidian-daily-organizer

# Install dependencies and build
npm install
npm run dev
```

## Configuration

### LLM Settings

Configure in Settings → Daily Organizer → LLM Configuration

| Setting            | Description                                    | Default                  |
| ------------------ | ---------------------------------------------- | ------------------------ |
| **LLM Provider**   | Choose between Claude (Anthropic) or OpenAI    | `claude`                 |
| **Claude API Key** | Your Anthropic API key (starts with `sk-ant-`) | -                        |
| **Claude Model**   | Claude model to use                            | `claude-opus-4-20250514` |
| **OpenAI API Key** | Your OpenAI API key (starts with `sk-`)        | -                        |
| **OpenAI Model**   | OpenAI model to use                            | `gpt-4`                  |

### Daily Notes Settings

| Setting                | Description                         | Default           |
| ---------------------- | ----------------------------------- | ----------------- |
| **Daily Notes Folder** | Folder where daily notes are stored | `""` (vault root) |

### Todo Migration Settings

| Setting                   | Description                                                | Default  |
| ------------------------- | ---------------------------------------------------------- | -------- |
| **Enable Auto Migration** | Automatically migrate todos when creating a new daily note | `true`   |
| **Todo Section Tag**      | Tag that identifies the todos section                      | `#todos` |

### Project Updates Settings

| Setting                        | Description                                                            | Default          |
| ------------------------------ | ---------------------------------------------------------------------- | ---------------- |
| **Project Tag**                | Tag that identifies project pages                                      | `#project`       |
| **Project Update Tag**         | Tag that marks where daily updates will be inserted                    | `#daily-updates` |
| **Update Insert Position**     | Where to insert new updates (`top` or `bottom`)                        | `top`            |
| **Auto-update Projects**       | Automatically update projects when creating a new daily note           | `false`          |
| **Auto-update Project Keywords** | Regenerate project keywords (using LLM) when updating project pages  | `false`          |

## Daily Note Structure

Daily notes should follow this structure for optimal functionality:

### Required Naming Convention

Files must be named in `YYYY-MM-DD` format (e.g., `2026-02-04.md`)

### Recommended Sections

```markdown
---
# No special frontmatter required for daily notes
---

## Notes

General notes, thoughts, and observations for the day.

## Project: Project Name

Notes specifically related to a project.

- Completed task related to this project
- [ ] Ongoing task for this project

## Project: Another Project

Notes for another project.

- Different project work here

## Todos #todos

- [ ] General task
    - [ ] Subtask 1
    - [x] Subtask 2
- [x] Completed task
    - [x] Completed subtask
- Plain bullet item
    - Nested plain bullet
```

### Section Details

#### Todos Section (`#todos`)

- Must include the configured todo section tag (default: `#todos`)
- Can be at any heading level (`#`, `##`, `###`, etc.)
- Supports nested checkboxes and plain bullets
- The plugin will automatically migrate uncompleted todos to the next day
- If the section already exists in the new daily note, todos are inserted there instead of creating a new section

#### Project Sections

- Use heading format: `## Project: Project Name`
- The project name should match a project page in your vault
- Include project-specific notes, completed tasks, and ongoing work
- These will be analyzed by the LLM for relevant project updates

## Project Page Structure

Project pages should include specific frontmatter and sections for optimal AI analysis.

### Frontmatter Properties

```yaml
---
tags:
    - project
name: Project Name
status: Active
goals: |
    - Primary objective
    - Secondary objective
description: Brief description of the project
update_focus: What aspects to emphasize in updates (optional)
update_keywords: Comma-separated keywords to watch for (optional)
update_style: Style guidance for updates (optional)
---
```

#### Required Properties

- `tags`: Must include the configured project tag (default: `project`)
- `name`: The project name

#### Optional Guidance Properties

These properties help the LLM generate better, more relevant updates:

| Property          | Description                                        | Example                                                        |
| ----------------- | -------------------------------------------------- | -------------------------------------------------------------- |
| `update_focus`    | What to emphasize in updates                       | `"Focus on API implementation progress and test coverage"`     |
| `update_keywords` | Keywords to watch for (can be LLM-generated)       | `"authentication, security, performance, bugs"`                |
| `update_style`    | Style and detail level guidance                    | `"Brief bullet points, technical details, include file paths"` |

### Recommended Sections

```markdown
---
tags:
    - project
name: Daily Organizer Plugin
status: Active
goals: |
    - Create automated todo migration
    - Implement AI-powered project updates
update_focus: Focus on feature implementation and bug fixes
update_keywords: migration, LLM, project updates, testing
update_style: Concise bullet points with technical details
---

## Overview

A brief description of what this project is about.

## Goals

- Primary objective 1
- Primary objective 2

## Status

Current state of the project, recent focus areas.

## Daily Updates #daily-updates

### 2026-02-04

- Implemented hierarchical todo migration with nested structure support
- Added plain bullet support to migration logic
- Fixed LLM duplicate date header bug in project updates

### 2026-02-03

- Created comprehensive test suite with 73 tests
- Enhanced project update context with metadata fields

## Tasks

- [ ] Future task 1
- [x] Completed task 1
```

### Section Details

#### Overview, Goals, Status

These sections are extracted and provided as context to the LLM when analyzing daily notes. They help the AI understand what's relevant to this project.

#### Daily Updates Tag

- Add the configured tag (default: `#daily-updates`) where you want updates inserted
- The tag can be on its own line or inline with the section header (e.g., `## Daily Updates #daily-updates`)
- Updates are automatically inserted after this tag when running the project update command
- Each update gets a date header (`### YYYY-MM-DD`)

## Commands

### Migrate Uncompleted Todos to Today

**Command ID:** `migrate-todos`

Manually triggers todo migration from the most recent previous daily note to today's note.

**Usage:**

1. Open command palette (Cmd/Ctrl + P)
2. Type "Migrate uncompleted todos to today"
3. Press Enter

**Behavior:**

- Finds the most recent daily note before today
- Parses all todos and builds a hierarchical tree
- Identifies subtrees with ANY uncompleted tasks
- Migrates entire subtrees to today's note
- Inserts into existing `#todos` section or creates a new one

### Update Project Pages with Daily Progress

**Command ID:** `update-projects`

Analyzes the current daily note and updates all relevant project pages with progress summaries.

**Usage:**

1. Open command palette (Cmd/Ctrl + P)
2. Type "Update project pages with daily progress"
3. Press Enter

**Behavior:**

1. Finds all project pages (files with the project tag)
2. If "Auto-update Project Keywords" is enabled, regenerates keywords for each project first
3. For each project:
    - Extracts project metadata and key sections (Goals, Status, Overview)
    - Extracts the last 5 updates to understand style and format
    - Pre-filters daily note content using project name and keywords
    - Sends context to LLM for analysis
    - If relevant updates are found, inserts them with a date header
    - If no relevant updates, skips the project
4. Shows a notice with results

### Update Project Keywords

**Command ID:** `update-project-keywords`

Uses LLM to analyze each project's content and generate relevant keywords for pre-filtering daily notes.

**Usage:**

1. Open command palette (Cmd/Ctrl + P)
2. Type "Update project keywords (using LLM)"
3. Press Enter

**Behavior:**

1. Finds all project pages (files with the project tag)
2. For each project:
    - Extracts key sections (Goals, Status, Overview, Description)
    - Sends content to LLM for keyword analysis
    - Generates 5-15 relevant keywords
    - Saves keywords to the project's `update_keywords` frontmatter field
3. Shows a notice with results

**Example Result:**

Before:

```yaml
---
tags:
    - project
name: Web API Migration
---
```

After:

```yaml
---
tags:
    - project
name: Web API Migration
update_keywords: api, migration, database, authentication, endpoints, rest, deployment, testing
---
```

## Automatic Features

### Auto-Migration on New Daily Note

When **Enable Auto Migration** is turned on, the plugin automatically migrates todos when you create a new daily note.

**Trigger:** Creating a new file that matches `YYYY-MM-DD` pattern in the configured daily notes folder

**Process:**

1. Wait 500ms for file creation and template application to complete
2. Find the most recent previous daily note
3. Parse and migrate uncompleted todos with their nested structures
4. Insert into the new daily note

### Auto-Update Projects on New Daily Note

When **Auto-update Projects** is turned on, the plugin automatically updates project pages when you create a new daily note.

**Trigger:** Creating a new file that matches `YYYY-MM-DD` pattern in the configured daily notes folder

**Process:**

1. Wait 500ms for file creation to complete
2. Find the most recent previous daily note (NOT today's note)
3. Analyze the previous note for project updates
4. Update all relevant project pages

**Note:** Auto-update analyzes the PREVIOUS day's note, not today's, because today's note is typically empty when created.

## How It Works

### Todo Migration Algorithm

1. **Parse Todos**
    - Scan for both checkboxes (`- [ ]`, `- [x]`) and plain bullets (`-`)
    - Calculate indentation level for each item
    - Track whether each item is a checkbox or plain bullet

2. **Build Hierarchical Tree**
    - Use a stack-based algorithm to build parent-child relationships
    - Each todo can have multiple children at deeper indentation levels
    - Plain bullets can be parents of checkboxes and vice versa

3. **Determine Subtree Completion**
    - For checkboxes: incomplete if unchecked OR any child is incomplete
    - For plain bullets: always considered "complete" themselves, but check children
    - Recursively check all descendants

4. **Migrate Incomplete Subtrees**
    - Identify root-level todos with ANY incomplete items in their subtree
    - Flatten the entire subtree (parent + all descendants) for migration
    - Preserve original formatting, indentation, and content

5. **Atomic Removal**
    - Remove the entire subtree from the source (parent + all descendants)
    - Prevents orphaned child items in the previous day's note

### Project Update Algorithm

1. **Find Projects**
    - Scan vault for files with the project tag in frontmatter
    - Parse frontmatter to extract metadata

2. **Generate Keywords** (optional, if enabled)
    - Analyze project's Goals, Status, Overview sections
    - Use LLM to generate 5-15 relevant keywords
    - Save keywords to `update_keywords` frontmatter field

3. **Build Context** (per project)
    - Extract project metadata (name, goals, status, description)
    - Extract update guidance (update_focus, update_keywords, update_style)
    - Extract key sections from project content (## Goals, ## Status, ## Overview)
    - Extract last 5 complete updates to learn style and format

4. **Pre-Filter Daily Content**
    - Search daily notes for project name and keywords
    - Include lines matching any keyword with surrounding context
    - Reduces token usage and improves relevance

5. **LLM Analysis**
    - Send project context + filtered daily content to LLM
    - LLM identifies relevant information based on:
        - Project goals and status
        - Update focus guidance
        - Keywords to watch
        - Style of previous updates
    - LLM generates 2-4 bullet points matching previous update style
    - Returns "NO_RELEVANT_UPDATES" if nothing is relevant

6. **Insert Update**
    - Add date header (`### YYYY-MM-DD`)
    - Insert after the `#daily-updates` tag
    - Maintain markdown formatting

## Examples

### Example 1: Nested Todo Migration

**Previous Day (2026-02-03.md):**

```markdown
## Todos #todos

- [ ] Implement user authentication
    - [x] Research OAuth libraries
    - [ ] Set up passport.js
        - [ ] Install dependencies
        - [ ] Configure strategies
    - [ ] Write tests

- [x] Fix navigation bug
    - [x] Identify root cause
    - [x] Apply fix
    - [x] Verify in production
```

**Result in Today's Note (2026-02-04.md):**

```markdown
## Todos #todos

- [ ] Implement user authentication
    - [x] Research OAuth libraries
    - [ ] Set up passport.js
        - [ ] Install dependencies
        - [ ] Configure strategies
    - [ ] Write tests
```

The "Fix navigation bug" subtree is NOT migrated because ALL its children are complete.

### Example 2: Mixed Bullets and Checkboxes

**Previous Day:**

```markdown
## Todos #todos

- [ ] Project Alpha
    - Meeting notes from standup
        - Discussed API design
    - [ ] Implement endpoint
    - [ ] Review PR

- Work summary
    - Completed 3 tickets
    - [x] Ticket #123
```

**Result in Today's Note:**

```markdown
## Todos #todos

- [ ] Project Alpha
    - Meeting notes from standup
        - Discussed API design
    - [ ] Implement endpoint
    - [ ] Review PR
```

The "Work summary" subtree is NOT migrated because it has no incomplete checkboxes (the [x] is complete, and plain bullets are always considered done).

### Example 3: Project Update with Frontmatter Guidance

**Project Page (projects/daily-organizer.md):**

```yaml
---
tags:
    - project
name: Daily Organizer Plugin
status: Active Development
update_focus: Focus on feature completion and test coverage
update_keywords: migration, LLM, testing, bugs
update_style: Technical bullet points with file references
---
## Goals
- Implement automated todo migration
- Add AI-powered project updates

## Daily Updates

#daily-updates

### 2026-02-03
- Created comprehensive test suite with 73 tests in todo-parser.test.ts
- Added support for plain bullet migration in todo-parser.ts
```

**Daily Note (2026-02-04.md):**

```markdown
## Notes

Worked on various tasks today. Had lunch with the team.

## Project: Daily Organizer Plugin

- Fixed bug in project-updater.ts where LLM was adding duplicate date headers
- Updated prompt in llm-service.ts to explicitly exclude date headers
- All 73 tests still passing after the fix

## Project: Website Redesign

- Reviewed design mockups
- Approved color scheme

## Personal

- Scheduled dentist appointment
```

**Result in Project Page:**

```markdown
## Daily Updates #daily-updates

### 2026-02-04

- Fixed duplicate date header bug in project-updater.ts by updating LLM prompt
- Modified llm-service.ts to explicitly instruct against including date headers
- Verified all 73 tests remain passing after bug fix

### 2026-02-03

- Created comprehensive test suite with 73 tests in todo-parser.test.ts
- Added support for plain bullet migration in todo-parser.ts
```

**Why it worked:**

- LLM identified "Daily Organizer Plugin" section as relevant
- Ignored personal notes and other projects
- Matched technical style with file references (update_style)
- Focused on bugs and testing (update_keywords)
- Kept format consistent with previous updates

## Development

### Building

```bash
npm run dev    # Development build with watch mode
npm run build  # Production build
```

### Testing

```bash
npm test              # Run tests once
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

### Linting

```bash
npm run lint   # Check for linting issues
```

## Requirements

- Obsidian v1.0.0 or higher
- Node.js v16 or higher (for development)
- API key for Claude or OpenAI (for project update features)

## Troubleshooting

### Todos Not Migrating

1. Verify the daily note filename matches `YYYY-MM-DD` format
2. Check that the daily notes folder setting matches your vault structure
3. Ensure the todo section includes the configured tag (default: `#todos`)
4. Check that there are actually uncompleted todos in the previous day

### Project Updates Not Working

1. Verify you have a valid API key configured
2. Check that project pages have the project tag in frontmatter
3. Ensure the project has the `#daily-updates` tag where updates should be inserted
4. Check the developer console (Cmd/Ctrl + Shift + I) for error messages
5. Verify the LLM found relevant content (if nothing is relevant, it won't update)
6. Try running "Update project keywords" first to generate keywords that match your daily notes
7. Check that your daily notes contain the project name or keywords from `update_keywords`

### Nested Todos Breaking

1. Ensure consistent indentation (tabs or spaces, not mixed)
2. Verify each level increases by exactly 2 spaces or 1 tab
3. Check that checkboxes follow markdown format: `- [ ]` or `- [x]`

## License

0-BSD License - Free to use, modify, and distribute.

## Credits

Built with [Obsidian Plugin API](https://docs.obsidian.md/)
