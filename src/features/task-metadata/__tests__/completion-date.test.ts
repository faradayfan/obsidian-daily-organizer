import { addCompletionField, removeCompletionField, escapeRegex, TASK_REGEX } from '../completion-date';

describe('completion-date', () => {
	describe('TASK_REGEX', () => {
		it('should match unchecked task', () => {
			const match = '- [ ] Task'.match(TASK_REGEX);
			expect(match).not.toBeNull();
			expect(match![2]).toBe(' ');
		});

		it('should match completed task with x', () => {
			const match = '- [x] Task'.match(TASK_REGEX);
			expect(match).not.toBeNull();
			expect(match![2]).toBe('x');
		});

		it('should match completed task with X', () => {
			const match = '- [X] Task'.match(TASK_REGEX);
			expect(match).not.toBeNull();
			expect(match![2]).toBe('X');
		});

		it('should match indented task', () => {
			const match = '  - [ ] Subtask'.match(TASK_REGEX);
			expect(match).not.toBeNull();
		});

		it('should not match plain bullet', () => {
			const match = '- Plain bullet'.match(TASK_REGEX);
			expect(match).toBeNull();
		});
	});

	describe('escapeRegex()', () => {
		it('should escape special regex characters', () => {
			expect(escapeRegex('.')).toBe('\\.');
			expect(escapeRegex('*')).toBe('\\*');
			expect(escapeRegex('+')).toBe('\\+');
			expect(escapeRegex('?')).toBe('\\?');
			expect(escapeRegex('^')).toBe('\\^');
			expect(escapeRegex('$')).toBe('\\$');
			expect(escapeRegex('()')).toBe('\\(\\)');
			expect(escapeRegex('[]')).toBe('\\[\\]');
		});

		it('should not escape regular characters', () => {
			expect(escapeRegex('completion')).toBe('completion');
			expect(escapeRegex('test-field')).toBe('test-field');
		});
	});

	describe('addCompletionField()', () => {
		describe('inline field format', () => {
			it('should add completion field to simple task', () => {
				const result = addCompletionField('- [x] Fix bug', 'completion', '2025-01-15', false);
				expect(result).toBe('- [x] Fix bug [completion:: 2025-01-15]');
			});

			it('should add completion field to indented task', () => {
				const result = addCompletionField('  - [x] Subtask', 'completion', '2025-01-15', false);
				expect(result).toBe('  - [x] Subtask [completion:: 2025-01-15]');
			});

			it('should return null if inline field already exists', () => {
				const result = addCompletionField('- [x] Task [completion:: 2025-01-15]', 'completion', '2025-01-16', false);
				expect(result).toBeNull();
			});

			it('should return null if shorthand format already exists', () => {
				const result = addCompletionField('- [x] Task ✅2025-01-15', 'completion', '2025-01-16', false);
				expect(result).toBeNull();
			});

			it('should handle custom field names', () => {
				const result = addCompletionField('- [x] Task', 'done', '2025-01-15', false);
				expect(result).toBe('- [x] Task [done:: 2025-01-15]');
			});

			it('should handle task with existing metadata', () => {
				const result = addCompletionField('- [x] Task [created:: 2025-01-10]', 'completion', '2025-01-15', false);
				expect(result).toBe('- [x] Task [created:: 2025-01-10] [completion:: 2025-01-15]');
			});
		});

		describe('shorthand format', () => {
			it('should add shorthand completion emoji', () => {
				const result = addCompletionField('- [x] Fix bug', 'completion', '2025-01-15', true);
				expect(result).toBe('- [x] Fix bug ✅2025-01-15');
			});

			it('should return null if inline field already exists', () => {
				const result = addCompletionField('- [x] Task [completion:: 2025-01-15]', 'completion', '2025-01-16', true);
				expect(result).toBeNull();
			});

			it('should return null if shorthand format already exists', () => {
				const result = addCompletionField('- [x] Task ✅2025-01-15', 'completion', '2025-01-16', true);
				expect(result).toBeNull();
			});

			it('should handle task with existing metadata', () => {
				const result = addCompletionField('- [x] Task ➕2025-01-10', 'completion', '2025-01-15', true);
				expect(result).toBe('- [x] Task ➕2025-01-10 ✅2025-01-15');
			});
		});
	});

	describe('removeCompletionField()', () => {
		it('should remove inline field format', () => {
			const result = removeCompletionField('- [ ] Task [completion:: 2025-01-15]', 'completion');
			expect(result).toBe('- [ ] Task');
		});

		it('should remove shorthand format', () => {
			const result = removeCompletionField('- [ ] Task ✅2025-01-15', 'completion');
			expect(result).toBe('- [ ] Task');
		});

		it('should remove inline field with leading space', () => {
			const result = removeCompletionField('- [ ] Task  [completion:: 2025-01-15]', 'completion');
			expect(result).toBe('- [ ] Task');
		});

		it('should remove shorthand with leading space', () => {
			const result = removeCompletionField('- [ ] Task  ✅2025-01-15', 'completion');
			expect(result).toBe('- [ ] Task');
		});

		it('should return null if field not found', () => {
			const result = removeCompletionField('- [ ] Task', 'completion');
			expect(result).toBeNull();
		});

		it('should handle custom field names', () => {
			const result = removeCompletionField('- [ ] Task [done:: 2025-01-15]', 'done');
			expect(result).toBe('- [ ] Task');
		});

		it('should preserve other metadata when removing inline field', () => {
			const result = removeCompletionField('- [ ] Task [created:: 2025-01-10] [completion:: 2025-01-15]', 'completion');
			expect(result).toBe('- [ ] Task [created:: 2025-01-10]');
		});

		it('should preserve other metadata when removing shorthand', () => {
			const result = removeCompletionField('- [ ] Task ➕2025-01-10 ✅2025-01-15', 'completion');
			expect(result).toBe('- [ ] Task ➕2025-01-10');
		});

		it('should handle indented tasks', () => {
			const result = removeCompletionField('  - [ ] Subtask [completion:: 2025-01-15]', 'completion');
			expect(result).toBe('  - [ ] Subtask');
		});

		it('should remove both formats if both present', () => {
			const result = removeCompletionField('- [ ] Task [completion:: 2025-01-15] ✅2025-01-15', 'completion');
			expect(result).toBe('- [ ] Task');
		});
	});
});
