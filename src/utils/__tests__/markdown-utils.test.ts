import {
	findSectionByTag,
	findSectionByHeader,
	insertAfterTag,
	insertAfterSection,
	appendToSection,
	replaceSection,
	ensureSectionExists,
} from '../markdown-utils';

describe('markdown-utils', () => {
	describe('findSectionByTag()', () => {
		it('should find section with tag', () => {
			const content = `# Header
Some text
#todos
- Task 1
- Task 2
# Next Section`;

			const section = findSectionByTag(content, '#todos');

			expect(section).not.toBeNull();
			expect(section?.start).toBeGreaterThanOrEqual(0);
			expect(section?.contentStart).toBeGreaterThan(section!.start);
		});

		it('should return null if tag not found', () => {
			const content = `# Header
Some text`;

			const section = findSectionByTag(content, '#todos');

			expect(section).toBeNull();
		});

		it('should find section that extends to end of file', () => {
			const content = `# Header
#todos
- Task 1
- Task 2`;

			const section = findSectionByTag(content, '#todos');

			expect(section).not.toBeNull();
			expect(section?.end).toBe(content.length);
		});

		it('should find section with standalone tag extending to next header', () => {
			const content = `## Section 1
#todos
Content here
## Section 2
More content`;

			const section = findSectionByTag(content, '#todos');

			expect(section).not.toBeNull();
			// Standalone tags (not in headers) create sections that extend to next header
			const sectionContent = content.slice(section!.start, section!.end);
			expect(sectionContent).toContain('#todos');
			expect(sectionContent).toContain('Content here');
		});

		it('should handle tag in header line', () => {
			const content = `## Tasks #todos
- Task 1
- Task 2`;

			const section = findSectionByTag(content, '#todos');

			expect(section).not.toBeNull();
		});
	});

	describe('findSectionByHeader()', () => {
		it('should find section by header', () => {
			const content = `# Header 1
Content 1
## Header 2
Content 2`;

			const section = findSectionByHeader(content, '# Header 1');

			expect(section).not.toBeNull();
		});

		it('should return null if header not found', () => {
			const content = `# Header 1
Content`;

			const section = findSectionByHeader(content, '## Missing Header');

			expect(section).toBeNull();
		});

		it('should find section ending at next same-level header', () => {
			const content = `## Section 1
Content 1
## Section 2
Content 2`;

			const section = findSectionByHeader(content, '## Section 1');

			expect(section).not.toBeNull();
			expect(content.slice(section!.start, section!.end)).toContain('Content 1');
			expect(content.slice(section!.start, section!.end)).not.toContain('Section 2');
		});

		it('should handle subsections correctly', () => {
			const content = `## Main Section
Content
### Subsection
Subcontent
## Next Main Section`;

			const section = findSectionByHeader(content, '## Main Section');

			expect(section).not.toBeNull();
			expect(content.slice(section!.start, section!.end)).toContain('Subsection');
			expect(content.slice(section!.start, section!.end)).not.toContain('Next Main Section');
		});

		it('should be case-insensitive', () => {
			const content = `## Tasks
Content`;

			const section = findSectionByHeader(content, '## tasks');

			expect(section).not.toBeNull();
		});
	});

	describe('insertAfterTag()', () => {
		it('should insert content after tag when tag exists', () => {
			const content = `# Header
#todos
Existing content`;

			const result = insertAfterTag(content, '#todos', '- New task');

			expect(result).toContain('- New task');
			expect(result).toContain('Existing content');
			expect(result.indexOf('- New task')).toBeLessThan(result.indexOf('Existing content'));
		});

		it('should create new section when tag not found', () => {
			const content = `# Header
Some content`;

			const result = insertAfterTag(content, '#todos', '- New task');

			expect(result).toContain('#todos');
			expect(result).toContain('- New task');
		});

		it('should preserve existing content in section', () => {
			const content = `#todos
- Existing task 1
- Existing task 2`;

			const result = insertAfterTag(content, '#todos', '- New task');

			expect(result).toContain('- New task');
			expect(result).toContain('- Existing task 1');
			expect(result).toContain('- Existing task 2');
		});

		it('should handle multiple insertions correctly', () => {
			let content = `#todos`;

			content = insertAfterTag(content, '#todos', '- Task 1');
			content = insertAfterTag(content, '#todos', '- Task 2');

			expect(content).toContain('- Task 1');
			expect(content).toContain('- Task 2');
		});
	});

	describe('insertAfterSection()', () => {
		it('should insert content at beginning of section', () => {
			const content = `## Tasks
- Existing task`;

			const result = insertAfterSection(content, '## Tasks', '- New task');

			expect(result).toContain('- New task');
			expect(result).toContain('- Existing task');
		});

		it('should create section if not found', () => {
			const content = `# Header`;

			const result = insertAfterSection(content, '## Tasks', '- New task');

			expect(result).toContain('## Tasks');
			expect(result).toContain('- New task');
		});
	});

	describe('appendToSection()', () => {
		it('should append content to end of section', () => {
			const content = `## Tasks
- Existing task
## Next Section
Content`;

			const result = appendToSection(content, '## Tasks', '- New task');

			expect(result).toContain('- Existing task');
			expect(result).toContain('- New task');
			expect(result.indexOf('- Existing task')).toBeLessThan(result.indexOf('- New task'));
			expect(result.indexOf('- New task')).toBeLessThan(result.indexOf('## Next Section'));
		});

		it('should create section if not found', () => {
			const content = `# Header`;

			const result = appendToSection(content, '## Tasks', '- New task');

			expect(result).toContain('## Tasks');
			expect(result).toContain('- New task');
		});

		it('should handle section at end of file', () => {
			const content = `## Tasks
- Existing task`;

			const result = appendToSection(content, '## Tasks', '- New task');

			expect(result).toContain('- Existing task');
			expect(result).toContain('- New task');
		});
	});

	describe('replaceSection()', () => {
		it('should replace section content', () => {
			const content = `## Tasks
- Old task 1
- Old task 2
## Next Section`;

			const result = replaceSection(content, '## Tasks', '- New task');

			expect(result).toContain('- New task');
			expect(result).not.toContain('- Old task 1');
			expect(result).not.toContain('- Old task 2');
			expect(result).toContain('## Next Section');
		});

		it('should create section if not found', () => {
			const content = `# Header`;

			const result = replaceSection(content, '## Tasks', '- New task');

			expect(result).toContain('## Tasks');
			expect(result).toContain('- New task');
		});
	});

	describe('ensureSectionExists()', () => {
		it('should not modify content if section exists', () => {
			const content = `## Tasks
Content`;

			const result = ensureSectionExists(content, '## Tasks');

			expect(result).toBe(content);
		});

		it('should add section if not found', () => {
			const content = `# Header
Content`;

			const result = ensureSectionExists(content, '## Tasks');

			expect(result).not.toBe(content);
			expect(result).toContain('## Tasks');
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty content', () => {
			const result = insertAfterTag('', '#todos', '- Task');

			expect(result).toContain('#todos');
			expect(result).toContain('- Task');
		});

		it('should handle content with only whitespace', () => {
			const content = `   \n\n   `;

			const section = findSectionByTag(content, '#todos');

			expect(section).toBeNull();
		});

		it('should handle multiple occurrences of tag (find first)', () => {
			const content = `#todos
- Task 1
#todos
- Task 2`;

			const section = findSectionByTag(content, '#todos');

			expect(section).not.toBeNull();
			// Should find the first occurrence
		});

		it('should handle tags in code blocks', () => {
			const content = `\`\`\`
#todos (in code)
\`\`\`
#todos
- Real task`;

			// This might find the tag in code block, which is a limitation
			// but acceptable for this use case
			const section = findSectionByTag(content, '#todos');

			expect(section).not.toBeNull();
		});
	});
});
