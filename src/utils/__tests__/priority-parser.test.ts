import { extractPriority, removePriorityExpression, PRIORITY_EMOJI } from '../priority-parser';

describe('priority-parser', () => {
	describe('extractPriority()', () => {
		describe('highest priority', () => {
			it('should extract "highest priority"', () => {
				const result = extractPriority('Task with highest priority');
				expect(result).not.toBeNull();
				expect(result?.level).toBe('highest');
				expect(result?.matchedText).toBe('highest priority');
			});

			it('should extract "critical"', () => {
				const result = extractPriority('Critical task that needs attention');
				expect(result).not.toBeNull();
				expect(result?.level).toBe('highest');
				expect(result?.matchedText).toBe('Critical');
			});

			it('should extract "urgent"', () => {
				const result = extractPriority('Urgent task');
				expect(result).not.toBeNull();
				expect(result?.level).toBe('highest');
				expect(result?.matchedText).toBe('Urgent');
			});

			it('should extract "asap"', () => {
				const result = extractPriority('Need this asap');
				expect(result).not.toBeNull();
				expect(result?.level).toBe('highest');
				expect(result?.matchedText).toBe('asap');
			});
		});

		describe('high priority', () => {
			it('should extract "high priority"', () => {
				const result = extractPriority('Task with high priority');
				expect(result).not.toBeNull();
				expect(result?.level).toBe('high');
				expect(result?.matchedText).toBe('high priority');
			});

			it('should extract "important"', () => {
				const result = extractPriority('Important task');
				expect(result).not.toBeNull();
				expect(result?.level).toBe('high');
				expect(result?.matchedText).toBe('Important');
			});

			it('should extract "high pri"', () => {
				const result = extractPriority('Task with high pri');
				expect(result).not.toBeNull();
				expect(result?.level).toBe('high');
				expect(result?.matchedText).toBe('high pri');
			});

			it('should extract "high priority" at start of text', () => {
				const result = extractPriority('high priority write tests by lunch');
				expect(result).not.toBeNull();
				expect(result?.level).toBe('high');
				expect(result?.matchedText).toBe('high priority');
			});
		});

		describe('medium priority', () => {
			it('should extract "medium priority"', () => {
				const result = extractPriority('Task with medium priority');
				expect(result).not.toBeNull();
				expect(result?.level).toBe('medium');
				expect(result?.matchedText).toBe('medium priority');
			});

			it('should extract "normal priority"', () => {
				const result = extractPriority('Task with normal priority');
				expect(result).not.toBeNull();
				expect(result?.level).toBe('medium');
				expect(result?.matchedText).toBe('normal priority');
			});

			it('should extract "medium pri"', () => {
				const result = extractPriority('Task with medium pri');
				expect(result).not.toBeNull();
				expect(result?.level).toBe('medium');
				expect(result?.matchedText).toBe('medium pri');
			});
		});

		describe('low priority', () => {
			it('should extract "low priority"', () => {
				const result = extractPriority('Task with low priority');
				expect(result).not.toBeNull();
				expect(result?.level).toBe('low');
				expect(result?.matchedText).toBe('low priority');
			});

			it('should extract "low pri"', () => {
				const result = extractPriority('Task with low pri');
				expect(result).not.toBeNull();
				expect(result?.level).toBe('low');
				expect(result?.matchedText).toBe('low pri');
			});
		});

		describe('lowest priority', () => {
			it('should extract "lowest priority"', () => {
				const result = extractPriority('Task with lowest priority');
				expect(result).not.toBeNull();
				expect(result?.level).toBe('lowest');
				expect(result?.matchedText).toBe('lowest priority');
			});

			it('should extract "trivial"', () => {
				const result = extractPriority('Trivial task');
				expect(result).not.toBeNull();
				expect(result?.level).toBe('lowest');
				expect(result?.matchedText).toBe('Trivial');
			});

			it('should extract "minor"', () => {
				const result = extractPriority('Minor fix needed');
				expect(result).not.toBeNull();
				expect(result?.level).toBe('lowest');
				expect(result?.matchedText).toBe('Minor');
			});
		});

		describe('case insensitivity', () => {
			it('should extract "HIGH PRIORITY"', () => {
				const result = extractPriority('Task with HIGH PRIORITY');
				expect(result).not.toBeNull();
				expect(result?.level).toBe('high');
			});

			it('should extract "LoW pRiOrItY"', () => {
				const result = extractPriority('Task with LoW pRiOrItY');
				expect(result).not.toBeNull();
				expect(result?.level).toBe('low');
			});
		});

		describe('edge cases', () => {
			it('should return null for no priority', () => {
				const result = extractPriority('Regular task without priority');
				expect(result).toBeNull();
			});

			it('should extract first match when multiple priorities present', () => {
				const result = extractPriority('Task with high priority and low priority');
				expect(result).not.toBeNull();
				expect(result?.level).toBe('high');
				expect(result?.matchedText).toBe('high priority');
			});

			it('should handle priority at the start of text', () => {
				const result = extractPriority('High priority task');
				expect(result).not.toBeNull();
				expect(result?.level).toBe('high');
			});

			it('should handle priority at the end of text', () => {
				const result = extractPriority('Task is high priority');
				expect(result).not.toBeNull();
				expect(result?.level).toBe('high');
			});

			it('should not match partial words', () => {
				const result = extractPriority('Task about importing data');
				expect(result).toBeNull();
			});
		});
	});

	describe('removePriorityExpression()', () => {
		it('should remove priority expression from middle of text', () => {
			const parsed = extractPriority('Task with high priority description');
			const result = removePriorityExpression('Task with high priority description', parsed!);
			expect(result).toBe('Task with description');
		});

		it('should remove priority expression from start of text', () => {
			const parsed = extractPriority('High priority task to complete');
			const result = removePriorityExpression('High priority task to complete', parsed!);
			expect(result).toBe('task to complete');
		});

		it('should remove priority expression from end of text', () => {
			const parsed = extractPriority('Complete this task - high priority');
			const result = removePriorityExpression('Complete this task - high priority', parsed!);
			expect(result).toBe('Complete this task -');
		});

		it('should clean up extra whitespace', () => {
			const parsed = extractPriority('Task   with   high priority   text');
			const result = removePriorityExpression('Task   with   high priority   text', parsed!);
			expect(result).toBe('Task with text');
		});
	});

	describe('PRIORITY_EMOJI', () => {
		it('should map highest to ⏫', () => {
			expect(PRIORITY_EMOJI.highest).toBe('⏫');
		});

		it('should map high to ⏫', () => {
			expect(PRIORITY_EMOJI.high).toBe('⏫');
		});

		it('should map medium to 🔼', () => {
			expect(PRIORITY_EMOJI.medium).toBe('🔼');
		});

		it('should map low to 🔽', () => {
			expect(PRIORITY_EMOJI.low).toBe('🔽');
		});

		it('should map lowest to ⏬', () => {
			expect(PRIORITY_EMOJI.lowest).toBe('⏬');
		});
	});
});
