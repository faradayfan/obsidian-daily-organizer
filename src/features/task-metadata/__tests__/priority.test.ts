import { addPriorityField, removePriorityField } from '../priority';

describe('priority', () => {
	describe('addPriorityField()', () => {
		describe('inline field format', () => {
			it('should add high priority inline field', () => {
				const result = addPriorityField('- [ ] Task', 'priority', 'high', false);
				expect(result).toBe('- [ ] Task [priority:: high]');
			});

			it('should add medium priority inline field', () => {
				const result = addPriorityField('- [ ] Task', 'priority', 'medium', false);
				expect(result).toBe('- [ ] Task [priority:: medium]');
			});

			it('should add low priority inline field', () => {
				const result = addPriorityField('- [ ] Task', 'priority', 'low', false);
				expect(result).toBe('- [ ] Task [priority:: low]');
			});

			it('should add lowest priority inline field', () => {
				const result = addPriorityField('- [ ] Task', 'priority', 'lowest', false);
				expect(result).toBe('- [ ] Task [priority:: lowest]');
			});

			it('should add highest priority inline field', () => {
				const result = addPriorityField('- [ ] Task', 'priority', 'highest', false);
				expect(result).toBe('- [ ] Task [priority:: highest]');
			});

			it('should use custom field name', () => {
				const result = addPriorityField('- [ ] Task', 'pri', 'high', false);
				expect(result).toBe('- [ ] Task [pri:: high]');
			});

			it('should return null if inline field already exists', () => {
				const result = addPriorityField('- [ ] Task [priority:: high]', 'priority', 'low', false);
				expect(result).toBeNull();
			});
		});

		describe('shorthand emoji format', () => {
			it('should add high priority emoji', () => {
				const result = addPriorityField('- [ ] Task', 'priority', 'high', true);
				expect(result).toBe('- [ ] Task ⏫');
			});

			it('should add medium priority emoji', () => {
				const result = addPriorityField('- [ ] Task', 'priority', 'medium', true);
				expect(result).toBe('- [ ] Task 🔼');
			});

			it('should add low priority emoji', () => {
				const result = addPriorityField('- [ ] Task', 'priority', 'low', true);
				expect(result).toBe('- [ ] Task 🔽');
			});

			it('should add lowest priority emoji', () => {
				const result = addPriorityField('- [ ] Task', 'priority', 'lowest', true);
				expect(result).toBe('- [ ] Task ⏬');
			});

			it('should return null if emoji already exists', () => {
				const result = addPriorityField('- [ ] Task ⏫', 'priority', 'low', true);
				expect(result).toBeNull();
			});
		});

		describe('duplicate detection', () => {
			it('should not add inline field if emoji exists', () => {
				const result = addPriorityField('- [ ] Task ⏫', 'priority', 'low', false);
				expect(result).toBeNull();
			});

			it('should not add emoji if inline field exists', () => {
				const result = addPriorityField('- [ ] Task [priority:: high]', 'priority', 'low', true);
				expect(result).toBeNull();
			});

			it('should detect any priority emoji', () => {
				expect(addPriorityField('- [ ] Task ⏫', 'priority', 'low', false)).toBeNull();
				expect(addPriorityField('- [ ] Task 🔼', 'priority', 'low', false)).toBeNull();
				expect(addPriorityField('- [ ] Task 🔽', 'priority', 'low', false)).toBeNull();
				expect(addPriorityField('- [ ] Task ⏬', 'priority', 'low', false)).toBeNull();
			});
		});

		describe('edge cases', () => {
			it('should work with indented tasks', () => {
				const result = addPriorityField('  - [ ] Subtask', 'priority', 'high', false);
				expect(result).toBe('  - [ ] Subtask [priority:: high]');
			});

			it('should work with complex task text', () => {
				const result = addPriorityField('- [ ] Task with [other:: field]', 'priority', 'high', false);
				expect(result).toBe('- [ ] Task with [other:: field] [priority:: high]');
			});

			it('should preserve natural language when adding priority', () => {
				const result = addPriorityField('- [ ] high priority write tests', 'priority', 'high', false);
				expect(result).toBe('- [ ] high priority write tests [priority:: high]');
			});

			it('should preserve natural language with shorthand format', () => {
				const result = addPriorityField('- [ ] urgent task to complete', 'priority', 'highest', true);
				expect(result).toBe('- [ ] urgent task to complete ⏫');
			});
		});
	});

	describe('removePriorityField()', () => {
		describe('inline field format removal', () => {
			it('should remove inline priority field', () => {
				const result = removePriorityField('- [ ] Task [priority:: high]', 'priority');
				expect(result).toBe('- [ ] Task');
			});

			it('should remove priority field with different levels', () => {
				expect(removePriorityField('- [ ] Task [priority:: high]', 'priority')).toBe('- [ ] Task');
				expect(removePriorityField('- [ ] Task [priority:: medium]', 'priority')).toBe('- [ ] Task');
				expect(removePriorityField('- [ ] Task [priority:: low]', 'priority')).toBe('- [ ] Task');
				expect(removePriorityField('- [ ] Task [priority:: lowest]', 'priority')).toBe('- [ ] Task');
			});

			it('should use custom field name', () => {
				const result = removePriorityField('- [ ] Task [pri:: high]', 'pri');
				expect(result).toBe('- [ ] Task');
			});

			it('should handle field with leading space', () => {
				const result = removePriorityField('- [ ] Task  [priority:: high]', 'priority');
				expect(result).toBe('- [ ] Task');
			});

			it('should handle field in middle of text', () => {
				const result = removePriorityField('- [ ] Task [priority:: high] with notes', 'priority');
				expect(result).toBe('- [ ] Task with notes');
			});
		});

		describe('shorthand emoji format removal', () => {
			it('should remove high priority emoji', () => {
				const result = removePriorityField('- [ ] Task ⏫', 'priority');
				expect(result).toBe('- [ ] Task');
			});

			it('should remove medium priority emoji', () => {
				const result = removePriorityField('- [ ] Task 🔼', 'priority');
				expect(result).toBe('- [ ] Task');
			});

			it('should remove low priority emoji', () => {
				const result = removePriorityField('- [ ] Task 🔽', 'priority');
				expect(result).toBe('- [ ] Task');
			});

			it('should remove lowest priority emoji', () => {
				const result = removePriorityField('- [ ] Task ⏬', 'priority');
				expect(result).toBe('- [ ] Task');
			});

			it('should handle emoji with leading space', () => {
				const result = removePriorityField('- [ ] Task  ⏫', 'priority');
				expect(result).toBe('- [ ] Task');
			});
		});

		describe('mixed format removal', () => {
			it('should remove both inline field and emoji if present', () => {
				const result = removePriorityField('- [ ] Task [priority:: high] ⏫', 'priority');
				expect(result).toBe('- [ ] Task');
			});

			it('should remove emoji from middle of text', () => {
				const result = removePriorityField('- [ ] Task ⏫ with notes', 'priority');
				expect(result).toBe('- [ ] Task with notes');
			});
		});

		describe('edge cases', () => {
			it('should return null if no priority field found', () => {
				const result = removePriorityField('- [ ] Task without priority', 'priority');
				expect(result).toBeNull();
			});

			it('should work with indented tasks', () => {
				const result = removePriorityField('  - [ ] Subtask [priority:: high]', 'priority');
				expect(result).toBe('  - [ ] Subtask');
			});

			it('should preserve other fields', () => {
				const result = removePriorityField('- [ ] Task [priority:: high] [due:: 2025-01-15]', 'priority');
				expect(result).toBe('- [ ] Task [due:: 2025-01-15]');
			});
		});
	});
});
