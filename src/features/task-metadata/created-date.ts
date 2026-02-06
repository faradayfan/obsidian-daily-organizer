import { escapeRegex } from './completion-date';

/**
 * Add a created date field to a task line.
 * Returns the new line string, or null if the field already exists.
 * Supports both inline field format [created:: YYYY-MM-DD] and shorthand ➕YYYY-MM-DD.
 */
export function addCreatedField(lineContent: string, fieldName: string, dateStr: string, useShorthand = false): string | null {
	// Check for existing inline field format
	const existingFieldRegex = new RegExp(`\\[${escapeRegex(fieldName)}::\\s*\\d{4}-\\d{2}-\\d{2}\\]`);
	if (existingFieldRegex.test(lineContent)) {
		return null;
	}

	// Check for existing shorthand format ➕YYYY-MM-DD
	const existingShorthandRegex = /➕\d{4}-\d{2}-\d{2}/;
	if (existingShorthandRegex.test(lineContent)) {
		return null;
	}

	if (useShorthand) {
		return `${lineContent} ➕${dateStr}`;
	} else {
		const createdField = `[${fieldName}:: ${dateStr}]`;
		return `${lineContent} ${createdField}`;
	}
}
