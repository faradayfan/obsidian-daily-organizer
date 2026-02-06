import { addDueDateField, removeDueDateField } from '../due-date';

describe('due-date', () => {
	describe('addDueDateField()', () => {
		describe('inline field format', () => {
			it('should add due field to simple task', () => {
				const result = addDueDateField('- [ ] Complete report', 'due', '2025-01-20', false);
				expect(result).toBe('- [ ] Complete report [due:: 2025-01-20]');
			});

			it('should add due field to indented task', () => {
				const result = addDueDateField('  - [ ] Subtask', 'due', '2025-01-20', false);
				expect(result).toBe('  - [ ] Subtask [due:: 2025-01-20]');
			});

			it('should return null if inline field already exists', () => {
				const result = addDueDateField('- [ ] Task [due:: 2025-01-20]', 'due', '2025-01-25', false);
				expect(result).toBeNull();
			});

			it('should return null if shorthand format already exists', () => {
				const result = addDueDateField('- [ ] Task 📅2025-01-20', 'due', '2025-01-25', false);
				expect(result).toBeNull();
			});

			it('should handle custom field names', () => {
				const result = addDueDateField('- [ ] Task', 'deadline', '2025-01-20', false);
				expect(result).toBe('- [ ] Task [deadline:: 2025-01-20]');
			});

			it('should add to task with existing metadata', () => {
				const result = addDueDateField('- [ ] Task ➕2025-01-15', 'due', '2025-01-20', false);
				expect(result).toBe('- [ ] Task ➕2025-01-15 [due:: 2025-01-20]');
			});
		});

		describe('shorthand format', () => {
			it('should add shorthand due emoji', () => {
				const result = addDueDateField('- [ ] Complete report', 'due', '2025-01-20', true);
				expect(result).toBe('- [ ] Complete report 📅2025-01-20');
			});

			it('should return null if inline field already exists', () => {
				const result = addDueDateField('- [ ] Task [due:: 2025-01-20]', 'due', '2025-01-25', true);
				expect(result).toBeNull();
			});

			it('should return null if shorthand format already exists', () => {
				const result = addDueDateField('- [ ] Task 📅2025-01-20', 'due', '2025-01-25', true);
				expect(result).toBeNull();
			});

			it('should add to task with other metadata', () => {
				const result = addDueDateField('- [ ] Task ➕2025-01-15 ✅2025-01-18', 'due', '2025-01-20', true);
				expect(result).toBe('- [ ] Task ➕2025-01-15 ✅2025-01-18 📅2025-01-20');
			});

			it('should handle indented tasks', () => {
				const result = addDueDateField('  - [ ] Subtask', 'due', '2025-01-20', true);
				expect(result).toBe('  - [ ] Subtask 📅2025-01-20');
			});
		});

		describe('edge cases', () => {
			it('should handle completed tasks', () => {
				const result = addDueDateField('- [x] Completed task', 'due', '2025-01-20', false);
				expect(result).toBe('- [x] Completed task [due:: 2025-01-20]');
			});

			it('should handle tasks with uppercase X', () => {
				const result = addDueDateField('- [X] Task', 'due', '2025-01-20', false);
				expect(result).toBe('- [X] Task [due:: 2025-01-20]');
			});

			it('should preserve natural language when adding due date', () => {
				const result = addDueDateField('- [ ] write tests by lunch', 'due', '2026-02-06', false);
				expect(result).toBe('- [ ] write tests by lunch [due:: 2026-02-06]');
			});

			it('should preserve natural language with shorthand format', () => {
				const result = addDueDateField('- [ ] complete by end of day', 'due', '2026-02-06', true);
				expect(result).toBe('- [ ] complete by end of day 📅2026-02-06');
			});

			it('should preserve multiple time expressions', () => {
				const result = addDueDateField('- [ ] finish report by tomorrow at noon', 'due', '2026-02-07', false);
				expect(result).toBe('- [ ] finish report by tomorrow at noon [due:: 2026-02-07]');
			});
		});
	});

	describe('removeDueDateField()', () => {
		it('should remove inline field format', () => {
			const result = removeDueDateField('- [ ] Task [due:: 2025-01-20]', 'due');
			expect(result).toBe('- [ ] Task');
		});

		it('should remove shorthand format', () => {
			const result = removeDueDateField('- [ ] Task 📅2025-01-20', 'due');
			expect(result).toBe('- [ ] Task');
		});

		it('should remove inline field with leading space', () => {
			const result = removeDueDateField('- [ ] Task  [due:: 2025-01-20]', 'due');
			expect(result).toBe('- [ ] Task');
		});

		it('should remove shorthand with leading space', () => {
			const result = removeDueDateField('- [ ] Task  📅2025-01-20', 'due');
			expect(result).toBe('- [ ] Task');
		});

		it('should return null if field not found', () => {
			const result = removeDueDateField('- [ ] Task', 'due');
			expect(result).toBeNull();
		});

		it('should handle custom field names', () => {
			const result = removeDueDateField('- [ ] Task [deadline:: 2025-01-20]', 'deadline');
			expect(result).toBe('- [ ] Task');
		});

		it('should preserve other metadata when removing inline field', () => {
			const result = removeDueDateField('- [ ] Task ➕2025-01-15 [due:: 2025-01-20]', 'due');
			expect(result).toBe('- [ ] Task ➕2025-01-15');
		});

		it('should preserve other metadata when removing shorthand', () => {
			const result = removeDueDateField('- [ ] Task ➕2025-01-15 📅2025-01-20', 'due');
			expect(result).toBe('- [ ] Task ➕2025-01-15');
		});

		it('should handle indented tasks', () => {
			const result = removeDueDateField('  - [ ] Subtask [due:: 2025-01-20]', 'due');
			expect(result).toBe('  - [ ] Subtask');
		});

		it('should remove both formats if both present', () => {
			const result = removeDueDateField('- [ ] Task [due:: 2025-01-20] 📅2025-01-20', 'due');
			expect(result).toBe('- [ ] Task');
		});
	});
});
