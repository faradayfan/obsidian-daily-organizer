/**
 * Priority levels supported by Dataview
 */
export type PriorityLevel = 'highest' | 'high' | 'medium' | 'low' | 'lowest';

/**
 * Mapping of priority levels to their emoji representations
 */
export const PRIORITY_EMOJI: Record<PriorityLevel, string> = {
	highest: '⏫',
	high: '⏫',
	medium: '🔼',
	low: '🔽',
	lowest: '⏬',
};

export interface ParsedPriority {
	level: PriorityLevel;
	matchedText: string;
	startIndex: number;
	endIndex: number;
}

/**
 * Patterns for detecting priority in natural language
 */
const PRIORITY_PATTERNS: Array<{ regex: RegExp; level: PriorityLevel }> = [
	// Highest priority
	{ regex: /\b(highest\s+priority|critical|urgent|asap)\b/i, level: 'highest' },

	// High priority
	{ regex: /\b(high\s+priority|important|high\s+pri)\b/i, level: 'high' },

	// Medium priority
	{ regex: /\b(medium\s+priority|normal\s+priority|medium\s+pri|normal\s+pri)\b/i, level: 'medium' },

	// Low priority
	{ regex: /\b(low\s+priority|low\s+pri)\b/i, level: 'low' },

	// Lowest priority
	{ regex: /\b(lowest\s+priority|trivial|minor)\b/i, level: 'lowest' },
];

/**
 * Extract priority from task text using natural language patterns
 */
export function extractPriority(text: string): ParsedPriority | null {
	// Try each pattern in order of specificity
	for (const pattern of PRIORITY_PATTERNS) {
		const match = text.match(pattern.regex);
		if (match && match.index !== undefined) {
			return {
				level: pattern.level,
				matchedText: match[0],
				startIndex: match.index,
				endIndex: match.index + match[0].length,
			};
		}
	}

	return null;
}

/**
 * Remove priority expression from text
 */
export function removePriorityExpression(text: string, parsedPriority: ParsedPriority): string {
	const before = text.substring(0, parsedPriority.startIndex);
	const after = text.substring(parsedPriority.endIndex);

	// Clean up extra whitespace
	return (before + after).replace(/\s+/g, ' ').trim();
}
