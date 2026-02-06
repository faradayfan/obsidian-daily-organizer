import { TaskTagger, ProjectKeywordMap } from '../task-tagger';
import type { ProjectMetadata } from '../../../types';

describe('TaskTagger', () => {
	describe('toKebabCaseTag()', () => {
		it('should convert a multi-word name to kebab-case tag', () => {
			expect(TaskTagger.toKebabCaseTag('Daily Organizer Plugin')).toBe('#daily-organizer-plugin');
		});

		it('should handle single word', () => {
			expect(TaskTagger.toKebabCaseTag('Project')).toBe('#project');
		});

		it('should handle extra spaces', () => {
			expect(TaskTagger.toKebabCaseTag('  Spaces Around  ')).toBe('#spaces-around');
		});

		it('should handle uppercase', () => {
			expect(TaskTagger.toKebabCaseTag('UPPERCASE')).toBe('#uppercase');
		});

		it('should handle special characters', () => {
			expect(TaskTagger.toKebabCaseTag('Project (v2.0)')).toBe('#project-v2-0');
		});

		it('should collapse multiple dashes', () => {
			expect(TaskTagger.toKebabCaseTag('Project--With---Dashes')).toBe('#project-with-dashes');
		});

		it('should handle alphanumeric names', () => {
			expect(TaskTagger.toKebabCaseTag('project123')).toBe('#project123');
		});
	});

	describe('buildProjectKeywordMaps()', () => {
		it('should include project name as a keyword', () => {
			const projects: ProjectMetadata[] = [{
				path: 'test.md',
				name: 'My Project',
			}];

			const maps = TaskTagger.buildProjectKeywordMaps(projects);

			expect(maps).toHaveLength(1);
			expect(maps[0].tag).toBe('#my-project');
			expect(maps[0].keywords).toContain('my project');
		});

		it('should parse update_keywords as comma-separated string', () => {
			const projects: ProjectMetadata[] = [{
				path: 'test.md',
				name: 'My Project',
				update_keywords: 'migration, LLM, testing',
			}];

			const maps = TaskTagger.buildProjectKeywordMaps(projects);

			expect(maps[0].keywords).toEqual(['my project', 'migration', 'llm', 'testing']);
		});

		it('should parse update_keywords as array', () => {
			const projects: ProjectMetadata[] = [{
				path: 'test.md',
				name: 'My Project',
				update_keywords: ['migration', 'LLM', 'testing'],
			}];

			const maps = TaskTagger.buildProjectKeywordMaps(projects);

			expect(maps[0].keywords).toEqual(['my project', 'migration', 'llm', 'testing']);
		});

		it('should handle project with no keywords', () => {
			const projects: ProjectMetadata[] = [{
				path: 'test.md',
				name: 'Solo',
			}];

			const maps = TaskTagger.buildProjectKeywordMaps(projects);

			expect(maps[0].keywords).toEqual(['solo']);
			expect(maps[0].tag).toBe('#solo');
		});

		it('should handle empty keywords string', () => {
			const projects: ProjectMetadata[] = [{
				path: 'test.md',
				name: 'Test',
				update_keywords: '',
			}];

			const maps = TaskTagger.buildProjectKeywordMaps(projects);

			expect(maps[0].keywords).toEqual(['test']);
		});

		it('should handle empty keywords array', () => {
			const projects: ProjectMetadata[] = [{
				path: 'test.md',
				name: 'Test',
				update_keywords: [],
			}];

			const maps = TaskTagger.buildProjectKeywordMaps(projects);

			expect(maps[0].keywords).toEqual(['test']);
		});

		it('should handle multiple projects', () => {
			const projects: ProjectMetadata[] = [
				{ path: 'a.md', name: 'Alpha', update_keywords: 'foo' },
				{ path: 'b.md', name: 'Beta', update_keywords: 'bar' },
			];

			const maps = TaskTagger.buildProjectKeywordMaps(projects);

			expect(maps).toHaveLength(2);
			expect(maps[0].tag).toBe('#alpha');
			expect(maps[1].tag).toBe('#beta');
		});
	});

	describe('findMatchingTags()', () => {
		const projectMaps: ProjectKeywordMap[] = [
			{ tag: '#daily-organizer', projectName: 'Daily Organizer', keywords: ['daily organizer', 'migration', 'llm'] },
			{ tag: '#website', projectName: 'Website', keywords: ['website', 'frontend', 'css'] },
		];

		it('should match on keyword', () => {
			const tags = TaskTagger.findMatchingTags('Fix the migration bug', projectMaps);
			expect(tags).toEqual(['#daily-organizer']);
		});

		it('should match on project name', () => {
			const tags = TaskTagger.findMatchingTags('Work on Daily Organizer feature', projectMaps);
			expect(tags).toEqual(['#daily-organizer']);
		});

		it('should be case-insensitive', () => {
			const tags = TaskTagger.findMatchingTags('Update the FRONTEND layout', projectMaps);
			expect(tags).toEqual(['#website']);
		});

		it('should match multiple projects', () => {
			const tags = TaskTagger.findMatchingTags('Fix migration CSS issues', projectMaps);
			expect(tags).toEqual(['#daily-organizer', '#website']);
		});

		it('should return empty for no matches', () => {
			const tags = TaskTagger.findMatchingTags('Go grocery shopping', projectMaps);
			expect(tags).toEqual([]);
		});

		it('should match substring keywords', () => {
			const tags = TaskTagger.findMatchingTags('Testing LLM integration', projectMaps);
			expect(tags).toEqual(['#daily-organizer']);
		});
	});

	describe('hasTag()', () => {
		it('should detect tag present', () => {
			expect(TaskTagger.hasTag('Fix bug #my-project', '#my-project')).toBe(true);
		});

		it('should not match tag as substring of longer tag', () => {
			expect(TaskTagger.hasTag('Fix bug #my-project-v2', '#my-project')).toBe(false);
		});

		it('should match tag at end of line', () => {
			expect(TaskTagger.hasTag('Fix bug #my-project', '#my-project')).toBe(true);
		});

		it('should match tag followed by space', () => {
			expect(TaskTagger.hasTag('Fix #my-project bug', '#my-project')).toBe(true);
		});

		it('should match tag followed by metadata', () => {
			expect(TaskTagger.hasTag('Fix #my-project [created:: 2025-01-01]', '#my-project')).toBe(true);
		});

		it('should return false when tag is absent', () => {
			expect(TaskTagger.hasTag('Fix bug', '#my-project')).toBe(false);
		});
	});

	describe('appendTagsToTaskLine()', () => {
		it('should append tag to simple task', () => {
			const result = TaskTagger.appendTagsToTaskLine('- [ ] Fix the bug', ['#my-project']);
			expect(result).toBe('- [ ] Fix the bug #my-project');
		});

		it('should append tag before metadata fields', () => {
			const result = TaskTagger.appendTagsToTaskLine(
				'- [ ] Fix the bug [created:: 2025-01-01]',
				['#my-project']
			);
			expect(result).toBe('- [ ] Fix the bug #my-project [created:: 2025-01-01]');
		});

		it('should append tag before multiple metadata fields', () => {
			const result = TaskTagger.appendTagsToTaskLine(
				'- [x] Fix bug [created:: 2025-01-01] [completion:: 2025-01-02]',
				['#my-project']
			);
			expect(result).toBe('- [x] Fix bug #my-project [created:: 2025-01-01] [completion:: 2025-01-02]');
		});

		it('should not duplicate existing tag', () => {
			const result = TaskTagger.appendTagsToTaskLine(
				'- [ ] Fix the bug #my-project',
				['#my-project']
			);
			expect(result).toBe('- [ ] Fix the bug #my-project');
		});

		it('should handle indented tasks', () => {
			const result = TaskTagger.appendTagsToTaskLine('  - [ ] Subtask', ['#my-project']);
			expect(result).toBe('  - [ ] Subtask #my-project');
		});

		it('should append multiple tags', () => {
			const result = TaskTagger.appendTagsToTaskLine('- [ ] Fix CSS migration', ['#alpha', '#beta']);
			expect(result).toBe('- [ ] Fix CSS migration #alpha #beta');
		});

		it('should skip already-present tags when adding multiple', () => {
			const result = TaskTagger.appendTagsToTaskLine(
				'- [ ] Fix CSS migration #alpha',
				['#alpha', '#beta']
			);
			expect(result).toBe('- [ ] Fix CSS migration #alpha #beta');
		});

		it('should handle completed tasks', () => {
			const result = TaskTagger.appendTagsToTaskLine('- [x] Done task', ['#my-project']);
			expect(result).toBe('- [x] Done task #my-project');
		});

		it('should not modify non-checkbox lines', () => {
			const result = TaskTagger.appendTagsToTaskLine('- Plain bullet', ['#my-project']);
			expect(result).toBe('- Plain bullet');
		});

		it('should handle task with existing tags and metadata', () => {
			const result = TaskTagger.appendTagsToTaskLine(
				'- [ ] Fix bug #existing [created:: 2025-01-01]',
				['#new-tag']
			);
			expect(result).toBe('- [ ] Fix bug #existing #new-tag [created:: 2025-01-01]');
		});
	});

	describe('collectSubtreeText()', () => {
		it('should collect text from root and children', () => {
			const lines = [
				'- [ ] Parent task',
				'  - [ ] Child checkbox',
				'  - Plain bullet note',
				'- [ ] Next root',
			];
			const { combinedText, endIndex } = TaskTagger.collectSubtreeText(lines, 0);

			expect(combinedText).toBe('Parent task Child checkbox Plain bullet note');
			expect(endIndex).toBe(2);
		});

		it('should stop at next root-level item', () => {
			const lines = [
				'- [ ] First root',
				'- [ ] Second root',
			];
			const { combinedText, endIndex } = TaskTagger.collectSubtreeText(lines, 0);

			expect(combinedText).toBe('First root');
			expect(endIndex).toBe(0);
		});

		it('should handle deeply nested children', () => {
			const lines = [
				'- [ ] Root',
				'  - Level 1',
				'    - Level 2',
				'      - [ ] Level 3',
			];
			const { combinedText, endIndex } = TaskTagger.collectSubtreeText(lines, 0);

			expect(combinedText).toBe('Root Level 1 Level 2 Level 3');
			expect(endIndex).toBe(3);
		});

		it('should stop at non-list content', () => {
			const lines = [
				'- [ ] Root task',
				'  - Child',
				'Some paragraph text',
				'  - [ ] Not a child',
			];
			const { combinedText, endIndex } = TaskTagger.collectSubtreeText(lines, 0);

			expect(combinedText).toBe('Root task Child');
			expect(endIndex).toBe(1);
		});
	});

	describe('processFileContent()', () => {
		const projectMaps: ProjectKeywordMap[] = [
			{ tag: '#my-project', projectName: 'My Project', keywords: ['my project', 'migration'] },
			{ tag: '#website', projectName: 'Website', keywords: ['website', 'frontend'] },
		];

		it('should tag root task when root text matches keyword', () => {
			const content = '- [ ] Fix the migration bug\n- [ ] Go shopping';
			const { newContent, taggedCount } = TaskTagger.processFileContent(content, projectMaps);

			expect(taggedCount).toBe(1);
			expect(newContent).toContain('- [ ] Fix the migration bug #my-project');
			expect(newContent).toContain('- [ ] Go shopping');
		});

		it('should tag root task when child text matches keyword', () => {
			const content = '- [ ] Fix some bugs\n  - [ ] Handle migration edge case\n  - Look at error logs';
			const { newContent, taggedCount } = TaskTagger.processFileContent(content, projectMaps);

			expect(taggedCount).toBe(1);
			expect(newContent).toContain('- [ ] Fix some bugs #my-project');
			// Children should not be modified
			expect(newContent).toContain('  - [ ] Handle migration edge case');
			expect(newContent).toContain('  - Look at error logs');
		});

		it('should tag root task when plain bullet child matches', () => {
			const content = '- [ ] Work on stuff\n  - Update frontend styles';
			const { newContent, taggedCount } = TaskTagger.processFileContent(content, projectMaps);

			expect(taggedCount).toBe(1);
			expect(newContent).toContain('- [ ] Work on stuff #website');
			expect(newContent).toContain('  - Update frontend styles');
		});

		it('should not tag indented checkbox tasks', () => {
			const content = '- [ ] Parent task\n  - [ ] migration subtask';
			const { newContent } = TaskTagger.processFileContent(content, projectMaps);

			// Only root gets tagged, not the child
			expect(newContent).toContain('- [ ] Parent task #my-project');
			expect(newContent).toContain('  - [ ] migration subtask');
			expect(newContent).not.toContain('  - [ ] migration subtask #');
		});

		it('should not tag plain bullets at root level', () => {
			const content = '- Fix the migration bug\n- [ ] Also migration';
			const { newContent, taggedCount } = TaskTagger.processFileContent(content, projectMaps);

			expect(taggedCount).toBe(1);
			expect(newContent).toBe('- Fix the migration bug\n- [ ] Also migration #my-project');
		});

		it('should preserve non-task content', () => {
			const content = '# Header\nSome text\n- [ ] Fix migration\nMore text';
			const { newContent, taggedCount } = TaskTagger.processFileContent(content, projectMaps);

			// 2 items: the header (section contains "migration") and the task
			expect(taggedCount).toBe(2);
			expect(newContent).toContain('# Header #my-project');
			expect(newContent).toContain('Some text');
			expect(newContent).toContain('More text');
		});

		it('should be idempotent', () => {
			const content = '- [ ] Fix the migration bug';
			const first = TaskTagger.processFileContent(content, projectMaps);
			const second = TaskTagger.processFileContent(first.newContent, projectMaps);

			expect(second.taggedCount).toBe(0);
			expect(second.newContent).toBe(first.newContent);
		});

		it('should tag root task matching multiple projects via children', () => {
			const content = '- [ ] Fix issues\n  - [ ] migration bug\n  - [ ] frontend layout';
			const { newContent, taggedCount } = TaskTagger.processFileContent(content, projectMaps);

			expect(taggedCount).toBe(1);
			expect(newContent).toContain('#my-project');
			expect(newContent).toContain('#website');
		});

		it('should handle empty content', () => {
			const { newContent, taggedCount } = TaskTagger.processFileContent('', projectMaps);

			expect(taggedCount).toBe(0);
			expect(newContent).toBe('');
		});

		it('should handle content with no matching tasks', () => {
			const content = '- [ ] Unrelated task\n- [ ] Another unrelated task';
			const { newContent, taggedCount } = TaskTagger.processFileContent(content, projectMaps);

			expect(taggedCount).toBe(0);
			expect(newContent).toBe(content);
		});

		it('should handle multiple root tasks with different children', () => {
			const content = [
				'- [ ] Task A',
				'  - work on migration',
				'- [ ] Task B',
				'  - update frontend',
				'- [ ] Task C',
				'  - go to store',
			].join('\n');
			const { newContent, taggedCount } = TaskTagger.processFileContent(content, projectMaps);

			expect(taggedCount).toBe(2);
			expect(newContent).toContain('- [ ] Task A #my-project');
			expect(newContent).toContain('- [ ] Task B #website');
			expect(newContent).toContain('- [ ] Task C\n');
		});

		it('should tag both tasks and section headers in one pass', () => {
			const content = '## Sprint Work\n- [ ] Fix migration bug\n## Personal\n- [ ] Buy groceries';
			const { newContent, taggedCount } = TaskTagger.processFileContent(content, projectMaps);

			expect(taggedCount).toBe(2);
			expect(newContent).toContain('## Sprint Work #my-project');
			expect(newContent).toContain('- [ ] Fix migration bug #my-project');
			expect(newContent).not.toContain('## Personal #');
		});

		it('should be idempotent with both tasks and headers', () => {
			const content = '## Migration\n- [ ] Fix migration bug';
			const first = TaskTagger.processFileContent(content, projectMaps);
			const second = TaskTagger.processFileContent(first.newContent, projectMaps);

			expect(second.taggedCount).toBe(0);
			expect(second.newContent).toBe(first.newContent);
		});

		it('should tag section header even when no tasks match', () => {
			const content = '## Migration Notes\nSome paragraph about migration progress.';
			const { newContent, taggedCount } = TaskTagger.processFileContent(content, projectMaps);

			expect(taggedCount).toBe(1);
			expect(newContent).toContain('## Migration Notes #my-project');
		});
	});

	describe('appendTagsToHeaderLine()', () => {
		it('should append tag to header', () => {
			const result = TaskTagger.appendTagsToHeaderLine('## Meeting Notes', ['#my-project']);
			expect(result).toBe('## Meeting Notes #my-project');
		});

		it('should not duplicate existing tag', () => {
			const result = TaskTagger.appendTagsToHeaderLine('## Meeting Notes #my-project', ['#my-project']);
			expect(result).toBe('## Meeting Notes #my-project');
		});

		it('should append multiple tags', () => {
			const result = TaskTagger.appendTagsToHeaderLine('## Sprint Review', ['#alpha', '#beta']);
			expect(result).toBe('## Sprint Review #alpha #beta');
		});

		it('should skip already-present tags when adding multiple', () => {
			const result = TaskTagger.appendTagsToHeaderLine('## Sprint Review #alpha', ['#alpha', '#beta']);
			expect(result).toBe('## Sprint Review #alpha #beta');
		});

		it('should handle different header levels', () => {
			expect(TaskTagger.appendTagsToHeaderLine('### Subtopic', ['#my-project'])).toBe('### Subtopic #my-project');
			expect(TaskTagger.appendTagsToHeaderLine('# Top Level', ['#my-project'])).toBe('# Top Level #my-project');
		});

		it('should not modify non-header lines', () => {
			expect(TaskTagger.appendTagsToHeaderLine('Plain text', ['#my-project'])).toBe('Plain text');
			expect(TaskTagger.appendTagsToHeaderLine('- [ ] A task', ['#my-project'])).toBe('- [ ] A task');
		});
	});

	describe('tagSectionHeaders()', () => {
		const projectMaps: ProjectKeywordMap[] = [
			{ tag: '#my-project', projectName: 'My Project', keywords: ['my project', 'migration'] },
			{ tag: '#website', projectName: 'Website', keywords: ['website', 'frontend'] },
		];

		it('should tag header when section body matches keyword', () => {
			const lines = ['## Meeting Notes', '- Discussed migration plan', '## Other'];
			const { newLines, taggedCount } = TaskTagger.tagSectionHeaders(lines, projectMaps);

			expect(taggedCount).toBe(1);
			expect(newLines[0]).toBe('## Meeting Notes #my-project');
			expect(newLines[2]).toBe('## Other');
		});

		it('should tag header when header text itself matches keyword', () => {
			const lines = ['## Migration Plan', 'Some unrelated content'];
			const { newLines, taggedCount } = TaskTagger.tagSectionHeaders(lines, projectMaps);

			expect(taggedCount).toBe(1);
			expect(newLines[0]).toBe('## Migration Plan #my-project');
		});

		it('should not tag header when no keywords match', () => {
			const lines = ['## Groceries', '- Buy milk', '- Buy eggs'];
			const { newLines, taggedCount } = TaskTagger.tagSectionHeaders(lines, projectMaps);

			expect(taggedCount).toBe(0);
			expect(newLines[0]).toBe('## Groceries');
		});

		it('should handle multiple headers with different matches', () => {
			const lines = ['## Migration', 'content', '## Frontend Work', 'css stuff', '## Personal', 'unrelated'];
			const { newLines, taggedCount } = TaskTagger.tagSectionHeaders(lines, projectMaps);

			expect(taggedCount).toBe(2);
			expect(newLines[0]).toBe('## Migration #my-project');
			expect(newLines[2]).toBe('## Frontend Work #website');
			expect(newLines[4]).toBe('## Personal');
		});

		it('should only tag the closest header to matching content', () => {
			const lines = [
				'## Meeting Notes',
				'### Agenda',
				'- Unrelated topic',
				'### Action Items',
				'- Fix migration',
				'## Other',
			];
			const { newLines, taggedCount } = TaskTagger.tagSectionHeaders(lines, projectMaps);

			// ## Meeting Notes has no direct content (only subsection headers follow)
			expect(newLines[0]).toBe('## Meeting Notes');
			// ### Agenda only has "Unrelated topic" — no match
			expect(newLines[1]).toBe('### Agenda');
			// ### Action Items has "Fix migration" — matches
			expect(newLines[3]).toBe('### Action Items #my-project');
			expect(taggedCount).toBe(1);
		});

		it('should be idempotent', () => {
			const lines = ['## Migration Notes', 'migration content'];
			const first = TaskTagger.tagSectionHeaders(lines, projectMaps);
			const second = TaskTagger.tagSectionHeaders(first.newLines, projectMaps);

			expect(second.taggedCount).toBe(0);
			expect(second.newLines).toEqual(first.newLines);
		});

		it('should handle section at end of file', () => {
			const lines = ['## Tasks', '- Work on migration'];
			const { newLines, taggedCount } = TaskTagger.tagSectionHeaders(lines, projectMaps);

			expect(taggedCount).toBe(1);
			expect(newLines[0]).toBe('## Tasks #my-project');
		});

		it('should handle empty section', () => {
			const lines = ['## Empty Section', '## Migration Section', 'migration content'];
			const { newLines, taggedCount } = TaskTagger.tagSectionHeaders(lines, projectMaps);

			expect(taggedCount).toBe(1);
			expect(newLines[0]).toBe('## Empty Section');
			expect(newLines[1]).toBe('## Migration Section #my-project');
		});

		it('should tag with multiple project tags', () => {
			const lines = ['## Sprint Review', 'migration and frontend topics'];
			const { newLines, taggedCount } = TaskTagger.tagSectionHeaders(lines, projectMaps);

			expect(taggedCount).toBe(1);
			expect(newLines[0]).toBe('## Sprint Review #my-project #website');
		});

		it('should skip headers containing excluded tags', () => {
			const lines = [
				'## Todos #todos',
				'- [ ] Fix migration bug',
				'## Notes',
				'- Discussed migration plan',
			];
			const { newLines, taggedCount } = TaskTagger.tagSectionHeaders(lines, projectMaps, ['#todos']);

			expect(taggedCount).toBe(1);
			expect(newLines[0]).toBe('## Todos #todos');
			expect(newLines[2]).toBe('## Notes #my-project');
		});

		it('should skip headers containing #ignore-project-tagging', () => {
			const lines = [
				'## Personal Notes #ignore-project-tagging',
				'- Work on migration stuff',
				'## Sprint',
				'- Migration tasks',
			];
			const { newLines, taggedCount } = TaskTagger.tagSectionHeaders(lines, projectMaps, ['#ignore-project-tagging']);

			expect(taggedCount).toBe(1);
			expect(newLines[0]).toBe('## Personal Notes #ignore-project-tagging');
			expect(newLines[2]).toBe('## Sprint #my-project');
		});

		it('should skip headers matching any of multiple excluded tags', () => {
			const lines = [
				'## Todos #todos',
				'- migration work',
				'## Private #ignore-project-tagging',
				'- frontend changes',
				'## Sprint',
				'- migration tasks',
			];
			const { newLines, taggedCount } = TaskTagger.tagSectionHeaders(lines, projectMaps, ['#todos', '#ignore-project-tagging']);

			expect(taggedCount).toBe(1);
			expect(newLines[0]).toBe('## Todos #todos');
			expect(newLines[2]).toBe('## Private #ignore-project-tagging');
			expect(newLines[4]).toBe('## Sprint #my-project');
		});
	});
});
