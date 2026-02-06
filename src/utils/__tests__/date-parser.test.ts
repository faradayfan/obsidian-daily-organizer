import { extractDueDate, removeDueDateExpression } from '../date-parser';

describe('date-parser', () => {
	// Use a fixed reference date for consistent testing
	const referenceDate = new Date('2025-01-15T12:00:00');

	describe('extractDueDate()', () => {
		describe('ISO format', () => {
			it('should extract ISO date with "due" keyword', () => {
				const result = extractDueDate('Fix bug due 2025-01-20', referenceDate);
				expect(result).not.toBeNull();
				expect(result!.date.toISOString().substring(0, 10)).toBe('2025-01-20');
				expect(result!.matchedText).toBe('2025-01-20');
			});

			it('should extract ISO date with "by" keyword', () => {
				const result = extractDueDate('Complete report by 2025-02-10', referenceDate);
				expect(result).not.toBeNull();
				expect(result!.date.toISOString().substring(0, 10)).toBe('2025-02-10');
			});

			it('should not extract without trigger keyword', () => {
				const result = extractDueDate('Version 2025-01-20 release', referenceDate);
				expect(result).toBeNull();
			});
		});

		describe('Month and day format', () => {
			it('should extract "Jan 15"', () => {
				const result = extractDueDate('Task due Jan 20', referenceDate);
				expect(result).not.toBeNull();
				expect(result!.date.toISOString().substring(0, 10)).toBe('2025-01-20');
			});

			it('should extract "January 15th"', () => {
				const result = extractDueDate('Deadline on February 5th', referenceDate);
				expect(result).not.toBeNull();
				expect(result!.date.toISOString().substring(0, 10)).toBe('2025-02-05');
			});

			it('should handle full month names', () => {
				const result = extractDueDate('Due December 25', referenceDate);
				expect(result).not.toBeNull();
				expect(result!.date.toISOString().substring(0, 10)).toBe('2025-12-25');
			});

			it('should assume next year if date has passed', () => {
				const result = extractDueDate('Due Jan 10', referenceDate); // Jan 10 is before Jan 15
				expect(result).not.toBeNull();
				expect(result!.date.toISOString().substring(0, 10)).toBe('2026-01-10');
			});
		});

		describe('Relative dates', () => {
			it('should extract "tomorrow"', () => {
				const result = extractDueDate('Task due tomorrow', referenceDate);
				expect(result).not.toBeNull();
				expect(result!.date.toISOString().substring(0, 10)).toBe('2025-01-16');
			});

			it('should extract "today"', () => {
				const result = extractDueDate('Task due today', referenceDate);
				expect(result).not.toBeNull();
				expect(result!.date.toISOString().substring(0, 10)).toBe('2025-01-15');
			});

			it('should extract "in 3 days"', () => {
				const result = extractDueDate('Due in 3 days', referenceDate);
				expect(result).not.toBeNull();
				expect(result!.date.toISOString().substring(0, 10)).toBe('2025-01-18');
			});

			it('should extract "in 2 weeks"', () => {
				const result = extractDueDate('Finish by in 2 weeks', referenceDate);
				expect(result).not.toBeNull();
				expect(result!.date.toISOString().substring(0, 10)).toBe('2025-01-29');
			});

			it('should extract "in 1 month"', () => {
				const result = extractDueDate('Due in 1 month', referenceDate);
				expect(result).not.toBeNull();
				expect(result!.date.toISOString().substring(0, 10)).toBe('2025-02-15');
			});
		});

		describe('Time-of-day expressions', () => {
			it('should extract "end of day" as today', () => {
				const result = extractDueDate('Schedule something by end of day', referenceDate);
				expect(result).not.toBeNull();
				expect(result!.date.toISOString().substring(0, 10)).toBe('2025-01-15');
				expect(result!.matchedText).toBe('end of day');
			});

			it('should extract "end of the day" as today', () => {
				const result = extractDueDate('Finish by end of the day', referenceDate);
				expect(result).not.toBeNull();
				expect(result!.date.toISOString().substring(0, 10)).toBe('2025-01-15');
			});

			it('should extract "eod" as today', () => {
				const result = extractDueDate('Complete by eod', referenceDate);
				expect(result).not.toBeNull();
				expect(result!.date.toISOString().substring(0, 10)).toBe('2025-01-15');
			});

			it('should extract "lunch" as today', () => {
				const result = extractDueDate('Meeting by lunch', referenceDate);
				expect(result).not.toBeNull();
				expect(result!.date.toISOString().substring(0, 10)).toBe('2025-01-15');
			});

			it('should extract "lunchtime" as today', () => {
				const result = extractDueDate('Submit by lunchtime', referenceDate);
				expect(result).not.toBeNull();
				expect(result!.date.toISOString().substring(0, 10)).toBe('2025-01-15');
			});

			it('should extract "noon" as today', () => {
				const result = extractDueDate('Deadline due noon', referenceDate);
				expect(result).not.toBeNull();
				expect(result!.date.toISOString().substring(0, 10)).toBe('2025-01-15');
			});

			it('should extract "midday" as today', () => {
				const result = extractDueDate('Ready by midday', referenceDate);
				expect(result).not.toBeNull();
				expect(result!.date.toISOString().substring(0, 10)).toBe('2025-01-15');
			});

			it('should extract "midnight" as today', () => {
				const result = extractDueDate('Due by midnight', referenceDate);
				expect(result).not.toBeNull();
				expect(result!.date.toISOString().substring(0, 10)).toBe('2025-01-15');
			});

			it('should extract "morning" as today', () => {
				const result = extractDueDate('Call by morning', referenceDate);
				expect(result).not.toBeNull();
				expect(result!.date.toISOString().substring(0, 10)).toBe('2025-01-15');
			});

			it('should extract "afternoon" as today', () => {
				const result = extractDueDate('Review due afternoon', referenceDate);
				expect(result).not.toBeNull();
				expect(result!.date.toISOString().substring(0, 10)).toBe('2025-01-15');
			});

			it('should extract "evening" as today', () => {
				const result = extractDueDate('Finish by evening', referenceDate);
				expect(result).not.toBeNull();
				expect(result!.date.toISOString().substring(0, 10)).toBe('2025-01-15');
			});

			it('should extract "tonight" as today', () => {
				const result = extractDueDate('Submit by tonight', referenceDate);
				expect(result).not.toBeNull();
				expect(result!.date.toISOString().substring(0, 10)).toBe('2025-01-15');
			});
		});

		describe('Day of week', () => {
			it('should extract "next Friday"', () => {
				// Jan 15, 2025 is a Wednesday, so next Friday is Jan 24 (in following week)
				const result = extractDueDate('Task due next Friday', referenceDate);
				expect(result).not.toBeNull();
				expect(result!.date.toISOString().substring(0, 10)).toBe('2025-01-24');
			});

			it('should extract "this Monday"', () => {
				// Jan 15, 2025 is a Wednesday, so this Monday is Jan 20
				const result = extractDueDate('Complete by this Monday', referenceDate);
				expect(result).not.toBeNull();
				expect(result!.date.toISOString().substring(0, 10)).toBe('2025-01-20');
			});

			it('should extract "next Monday"', () => {
				// Jan 15, 2025 is a Wednesday, so next Monday is Jan 27 (following week)
				const result = extractDueDate('Deadline due next Monday', referenceDate);
				expect(result).not.toBeNull();
				expect(result!.date.toISOString().substring(0, 10)).toBe('2025-01-27');
			});
		});

		describe('Trigger keywords', () => {
			it('should work with "due"', () => {
				const result = extractDueDate('Task due tomorrow', referenceDate);
				expect(result).not.toBeNull();
			});

			it('should work with "by"', () => {
				const result = extractDueDate('Finish by tomorrow', referenceDate);
				expect(result).not.toBeNull();
			});

			it('should work with "on"', () => {
				const result = extractDueDate('Meeting on tomorrow', referenceDate);
				expect(result).not.toBeNull();
			});

			it('should work with "before"', () => {
				const result = extractDueDate('Complete before tomorrow', referenceDate);
				expect(result).not.toBeNull();
			});

			it('should not extract without trigger keyword', () => {
				const result = extractDueDate('Task about tomorrow', referenceDate);
				expect(result).toBeNull();
			});
		});

		describe('Edge cases', () => {
			it('should return null for no match', () => {
				const result = extractDueDate('Just a regular task', referenceDate);
				expect(result).toBeNull();
			});

			it('should return first match when multiple dates present', () => {
				// ISO format has highest priority, so it matches first even if it appears later
				const result = extractDueDate('Task due tomorrow or by 2025-02-01', referenceDate);
				expect(result).not.toBeNull();
				expect(result!.matchedText).toBe('2025-02-01');
				expect(result!.date.toISOString().substring(0, 10)).toBe('2025-02-01');
			});

			it('should handle case-insensitive keywords', () => {
				const result = extractDueDate('Task DUE Tomorrow', referenceDate);
				expect(result).not.toBeNull();
			});
		});
	});

	describe('removeDueDateExpression()', () => {
		it('should remove matched date text', () => {
			const parsed = extractDueDate('Fix bug due tomorrow', referenceDate);
			expect(parsed).not.toBeNull();
			const result = removeDueDateExpression('Fix bug due tomorrow', parsed!);
			expect(result).toBe('Fix bug');
		});

		it('should remove trigger keyword when adjacent', () => {
			const parsed = extractDueDate('Task by 2025-01-20', referenceDate);
			expect(parsed).not.toBeNull();
			const result = removeDueDateExpression('Task by 2025-01-20', parsed!);
			expect(result).toBe('Task');
		});

		it('should preserve other text', () => {
			const parsed = extractDueDate('Important task due Jan 20 with notes', referenceDate);
			expect(parsed).not.toBeNull();
			const result = removeDueDateExpression('Important task due Jan 20 with notes', parsed!);
			expect(result).toBe('Important task with notes');
		});

		it('should clean up extra whitespace', () => {
			const parsed = extractDueDate('Task   due   tomorrow', referenceDate);
			expect(parsed).not.toBeNull();
			const result = removeDueDateExpression('Task   due   tomorrow', parsed!);
			expect(result).toBe('Task');
		});

		it('should handle date at end of string', () => {
			const parsed = extractDueDate('Complete report due tomorrow', referenceDate);
			expect(parsed).not.toBeNull();
			const result = removeDueDateExpression('Complete report due tomorrow', parsed!);
			expect(result).toBe('Complete report');
		});
	});
});
