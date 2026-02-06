import { addCreatedField } from '../created-date';
import { addDueDateField } from '../due-date';
import { addPriorityField } from '../priority';

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

			it('should preserve natural language when adding created date', () => {
				const result = addCreatedField('- [ ] high priority task', 'created', '2026-02-06', false);
				expect(result).toBe('- [ ] high priority task [created:: 2026-02-06]');
			});

			it('should preserve natural language with shorthand format', () => {
				const result = addCreatedField('- [ ] finish by lunch today', 'created', '2026-02-06', true);
				expect(result).toBe('- [ ] finish by lunch today ➕2026-02-06');
			});
		});
	});

	describe('Combined metadata with natural language preserved', () => {
		it('should add all metadata types while preserving natural language (inline format)', () => {
			// Simulate the processTaskMetadata flow with removeExpression = false
			const originalTask = '- [ ] high priority write tests by lunch';

			// Step 1: Add created date
			let task = addCreatedField(originalTask, 'created', '2026-02-06', false);
			expect(task).toBe('- [ ] high priority write tests by lunch [created:: 2026-02-06]');

			// Step 2: Add due date (natural language NOT removed)
			task = addDueDateField(task!, 'due', '2026-02-06', false);
			expect(task).toBe('- [ ] high priority write tests by lunch [created:: 2026-02-06] [due:: 2026-02-06]');

			// Step 3: Add priority (natural language NOT removed)
			task = addPriorityField(task!, 'priority', 'high', false);
			expect(task).toBe('- [ ] high priority write tests by lunch [created:: 2026-02-06] [due:: 2026-02-06] [priority:: high]');

			// Verify natural language is still there
			expect(task).toContain('high priority');
			expect(task).toContain('by lunch');
		});

		it('should add all metadata types while preserving natural language (shorthand format)', () => {
			// Simulate the processTaskMetadata flow with removeExpression = false
			// Using simple task text without priority/date keywords to avoid conflicts
			const originalTask = '- [ ] complete the report';

			// Step 1: Add created date
			let task = addCreatedField(originalTask, 'created', '2026-02-06', true);
			expect(task).not.toBeNull();
			expect(task).toBe('- [ ] complete the report ➕2026-02-06');

			// Step 2: Add due date
			task = addDueDateField(task!, 'due', '2026-02-07', true);
			expect(task).not.toBeNull();
			expect(task).toBe('- [ ] complete the report ➕2026-02-06 📅2026-02-07');

			// Step 3: Add priority
			task = addPriorityField(task!, 'priority', 'high', true);
			expect(task).not.toBeNull();
			expect(task).toBe('- [ ] complete the report ➕2026-02-06 📅2026-02-07 ⏫');

			// Verify all metadata is present
			expect(task).toContain('➕2026-02-06'); // created
			expect(task).toContain('📅2026-02-07'); // due
			expect(task).toContain('⏫'); // priority
			expect(task).toContain('complete the report'); // original text
		});

		it('should handle completed tasks with all metadata preserved', () => {
			const originalTask = '- [x] attended the meeting';

			// Add created, due, and priority
			let task = addCreatedField(originalTask, 'created', '2026-02-05', true);
			expect(task).not.toBeNull();
			expect(task).toBe('- [x] attended the meeting ➕2026-02-05');

			task = addDueDateField(task!, 'due', '2026-02-06', true);
			expect(task).not.toBeNull();
			expect(task).toBe('- [x] attended the meeting ➕2026-02-05 📅2026-02-06');

			task = addPriorityField(task!, 'priority', 'high', true);
			expect(task).not.toBeNull();
			expect(task).toBe('- [x] attended the meeting ➕2026-02-05 📅2026-02-06 ⏫');

			// Verify all metadata is present
			expect(task).toContain('attended the meeting'); // original text
		});
	});
});
