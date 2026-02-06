export interface ParsedDate {
	date: Date;
	matchedText: string;
	startIndex: number;
	endIndex: number;
}

interface DatePattern {
	regex: RegExp;
	parser: (match: RegExpMatchArray, referenceDate: Date) => Date | null;
}

/**
 * Parse ISO date format: YYYY-MM-DD
 */
function parseISODate(match: RegExpMatchArray): Date | null {
	const dateStr = match[1];
	if (!dateStr) return null;
	const date = new Date(dateStr);
	return isNaN(date.getTime()) ? null : date;
}

/**
 * Parse month and day: "Jan 15", "January 15th"
 */
function parseMonthDay(match: RegExpMatchArray, referenceDate: Date): Date | null {
	const monthStr = match[1]?.toLowerCase();
	const dayStr = match[2];
	if (!monthStr || !dayStr) return null;

	const monthMap: Record<string, number> = {
		jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
		jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
		january: 0, february: 1, march: 2, april: 3, june: 5,
		july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
	};

	const month = monthMap[monthStr];
	const day = parseInt(dayStr, 10);

	if (month === undefined || isNaN(day) || day < 1 || day > 31) return null;

	const year = referenceDate.getFullYear();
	const date = new Date(year, month, day);

	// If the date has passed this year, assume next year
	if (date < referenceDate) {
		date.setFullYear(year + 1);
	}

	return date;
}

/**
 * Parse relative dates: "tomorrow", "today"
 */
function parseRelativeSimple(match: RegExpMatchArray, referenceDate: Date): Date | null {
	const term = match[1]?.toLowerCase();
	if (!term) return null;

	const date = new Date(referenceDate);
	date.setHours(0, 0, 0, 0); // Normalize to start of day

	if (term === 'today') {
		return date;
	} else if (term === 'tomorrow') {
		date.setDate(date.getDate() + 1);
		return date;
	}

	return null;
}

/**
 * Parse time-of-day expressions that imply "today": "end of day", "eod", "lunch", "noon", etc.
 */
function parseTimeOfDay(match: RegExpMatchArray, referenceDate: Date): Date | null {
	// All time-of-day expressions resolve to today
	const date = new Date(referenceDate);
	date.setHours(0, 0, 0, 0); // Normalize to start of day
	return date;
}

/**
 * Parse relative offset: "in 3 days", "in 2 weeks"
 */
function parseRelativeOffset(match: RegExpMatchArray, referenceDate: Date): Date | null {
	const countStr = match[1];
	const unit = match[2]?.toLowerCase();
	if (!countStr || !unit) return null;

	const count = parseInt(countStr, 10);
	if (isNaN(count) || count < 0) return null;

	const date = new Date(referenceDate);
	date.setHours(0, 0, 0, 0);

	if (unit === 'day') {
		date.setDate(date.getDate() + count);
	} else if (unit === 'week') {
		date.setDate(date.getDate() + count * 7);
	} else if (unit === 'month') {
		date.setMonth(date.getMonth() + count);
	} else {
		return null;
	}

	return date;
}

/**
 * Parse next day of week: "next Friday", "this Monday"
 */
function parseNextDayOfWeek(match: RegExpMatchArray, referenceDate: Date): Date | null {
	const modifier = match[1]?.toLowerCase();
	const dayName = match[2]?.toLowerCase();
	if (!modifier || !dayName) return null;

	const dayMap: Record<string, number> = {
		sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
		thursday: 4, friday: 5, saturday: 6,
	};

	const targetDay = dayMap[dayName];
	if (targetDay === undefined) return null;

	const date = new Date(referenceDate);
	date.setHours(0, 0, 0, 0);

	const currentDay = date.getDay();
	let daysToAdd = targetDay - currentDay;

	if (modifier === 'this') {
		// "this Monday" means the upcoming Monday in the current week
		if (daysToAdd <= 0) {
			daysToAdd += 7;
		}
	} else if (modifier === 'next') {
		// "next Monday" means the Monday in the following week
		if (daysToAdd <= 0) {
			daysToAdd += 7;
		}
		daysToAdd += 7;
	}

	date.setDate(date.getDate() + daysToAdd);
	return date;
}

const DATE_PATTERNS: DatePattern[] = [
	// ISO format: 2025-01-15 (highest priority - most specific)
	{ regex: /\b(\d{4}-\d{2}-\d{2})\b/, parser: parseISODate },

	// Natural dates: "Jan 15", "January 15th"
	{ regex: /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i, parser: parseMonthDay },

	// Relative: "tomorrow", "today"
	{ regex: /\b(tomorrow|today)\b/i, parser: parseRelativeSimple },

	// Time-of-day expressions that imply "today": "end of day", "eod", "lunch", "noon", "midnight", etc.
	{ regex: /\b(end of (?:the )?day|eod|lunch(?:time)?|noon|midday|midnight|morning|afternoon|evening|tonight)\b/i, parser: parseTimeOfDay },

	// Relative offset: "in 3 days", "in 2 weeks"
	{ regex: /\bin\s+(\d+)\s+(day|week|month)s?\b/i, parser: parseRelativeOffset },

	// Day of week: "next Friday", "this Monday"
	{ regex: /\b(next|this)\s+(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i, parser: parseNextDayOfWeek },
];

const TRIGGER_KEYWORDS = ['due', 'by', 'on', 'before'];

/**
 * Extract a due date from task text.
 * Looks for trigger keywords followed by date expressions.
 * Returns the first valid match found.
 */
export function extractDueDate(text: string, referenceDate: Date = new Date()): ParsedDate | null {
	// Normalize reference date to start of day
	const normalizedRef = new Date(referenceDate);
	normalizedRef.setHours(0, 0, 0, 0);

	// Try each pattern in order of specificity
	for (const pattern of DATE_PATTERNS) {
		const matches = Array.from(text.matchAll(new RegExp(pattern.regex, 'gi')));

		for (const match of matches) {
			const matchIndex = match.index;
			if (matchIndex === undefined) continue;

			// Check if a trigger keyword appears within 3 words before the match
			const precedingText = text.substring(Math.max(0, matchIndex - 50), matchIndex);
			const hasTrigger = TRIGGER_KEYWORDS.some(keyword => {
				const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'i');
				return keywordRegex.test(precedingText);
			});

			if (!hasTrigger) continue;

			// Try to parse the date
			const parsedDate = pattern.parser(match, normalizedRef);
			if (!parsedDate) continue;

			return {
				date: parsedDate,
				matchedText: match[0] as string,
				startIndex: matchIndex,
				endIndex: matchIndex + (match[0] as string).length,
			};
		}
	}

	return null;
}

/**
 * Remove natural language due date expressions from text.
 * Removes the matched date text and optionally the trigger keyword if it's directly adjacent.
 */
export function removeDueDateExpression(text: string, parsedDate: ParsedDate): string {
	const { startIndex, endIndex } = parsedDate;

	// Check if trigger keyword is directly before the match
	const precedingText = text.substring(Math.max(0, startIndex - 20), startIndex);
	let finalStartIndex = startIndex;

	for (const keyword of TRIGGER_KEYWORDS) {
		const keywordRegex = new RegExp(`\\b${keyword}\\s*$`, 'i');
		const keywordMatch = precedingText.match(keywordRegex);
		if (keywordMatch && keywordMatch.index !== undefined) {
			finalStartIndex = startIndex - (precedingText.length - keywordMatch.index);
			break;
		}
	}

	// Remove the text and clean up extra whitespace
	let result = text.substring(0, finalStartIndex) + text.substring(endIndex);
	result = result.replace(/\s+/g, ' ').trim();

	return result;
}
