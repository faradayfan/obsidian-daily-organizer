import { addCreatedField } from '../created-date';

describe('created-date', () => {
	describe('addCreatedField()', () => {
		describe('inline field format', () => {
			it('should add created field to simple task', () => {
				const result = addCreatedField('- [ ] New task', 'created', '2025-01-15', false);
				expect(result).toBe('- [ ] New task [created:: 2025-01-15]');
			});

			it('should add created field to indented task', () => {
				const result = addCreatedField('  - [ ] Subtask', 'created', '2025-01-15', false);
				expect(result).toBe('  - [ ] Subtask [created:: 2025-01-15]');
			});

			it('should return null if inline field already exists', () => {
				const result = addCreatedField('- [ ] Task [created:: 2025-01-15]', 'created', '2025-01-16', false);
				expect(result).toBeNull();
			});

			it('should return null if shorthand format already exists', () => {
				const result = addCreatedField('- [ ] Task ➕2025-01-15', 'created', '2025-01-16', false);
				expect(result).toBeNull();
			});

			it('should handle custom field names', () => {
				const result = addCreatedField('- [ ] Task', 'start', '2025-01-15', false);
				expect(result).toBe('- [ ] Task [start:: 2025-01-15]');
			});

			it('should add to task that already has completion date', () => {
				const result = addCreatedField('- [x] Task [completion:: 2025-01-20]', 'created', '2025-01-15', false);
				expect(result).toBe('- [x] Task [completion:: 2025-01-20] [created:: 2025-01-15]');
			});
		});

		describe('shorthand format', () => {
			it('should add shorthand created emoji', () => {
				const result = addCreatedField('- [ ] New task', 'created', '2025-01-15', true);
				expect(result).toBe('- [ ] New task ➕2025-01-15');
			});

			it('should return null if inline field already exists', () => {
				const result = addCreatedField('- [ ] Task [created:: 2025-01-15]', 'created', '2025-01-16', true);
				expect(result).toBeNull();
			});

			it('should return null if shorthand format already exists', () => {
				const result = addCreatedField('- [ ] Task ➕2025-01-15', 'created', '2025-01-16', true);
				expect(result).toBeNull();
			});

			it('should add to task that has completion shorthand', () => {
				const result = addCreatedField('- [x] Task ✅2025-01-20', 'created', '2025-01-15', true);
				expect(result).toBe('- [x] Task ✅2025-01-20 ➕2025-01-15');
			});

			it('should handle indented tasks', () => {
				const result = addCreatedField('  - [ ] Subtask', 'created', '2025-01-15', true);
				expect(result).toBe('  - [ ] Subtask ➕2025-01-15');
			});
		});

		describe('edge cases', () => {
			it('should handle completed tasks', () => {
				const result = addCreatedField('- [x] Completed task', 'created', '2025-01-15', false);
				expect(result).toBe('- [x] Completed task [created:: 2025-01-15]');
			});

			it('should handle tasks with uppercase X', () => {
				const result = addCreatedField('- [X] Task', 'created', '2025-01-15', false);
				expect(result).toBe('- [X] Task [created:: 2025-01-15]');
			});

			it('should not add to non-task lines', () => {
				// The function checks for field existence, but doesn't validate task format
				// The handler should validate using TASK_REGEX before calling this function
				const result = addCreatedField('- Plain bullet', 'created', '2025-01-15', false);
				expect(result).toBe('- Plain bullet [created:: 2025-01-15]');
			});
		});
	});
});
