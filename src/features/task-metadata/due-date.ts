import { escapeRegex } from './completion-date';

/**
 * Add a due date field to a task line.
 * Returns the new line string, or null if the field already exists.
 * Supports both inline field format [due:: YYYY-MM-DD] and shorthand 📅YYYY-MM-DD.
 */
export function addDueDateField(lineContent: string, fieldName: string, dateStr: string, useShorthand = false): string | null {
	// Check for existing inline field format
	const existingFieldRegex = new RegExp(`\\[${escapeRegex(fieldName)}::\\s*\\d{4}-\\d{2}-\\d{2}\\]`);
	if (existingFieldRegex.test(lineContent)) {
		return null;
	}

	// Check for existing shorthand format 📅YYYY-MM-DD
	const existingShorthandRegex = /📅\d{4}-\d{2}-\d{2}/;
	if (existingShorthandRegex.test(lineContent)) {
		return null;
	}

	if (useShorthand) {
		return `${lineContent} 📅${dateStr}`;
	} else {
		const dueField = `[${fieldName}:: ${dateStr}]`;
		return `${lineContent} ${dueField}`;
	}
}

/**
 * Remove a due date field from a task line.
 * Returns the new line string, or null if the field was not found.
 * Removes both inline field format [due:: YYYY-MM-DD] and shorthand 📅YYYY-MM-DD.
 */
export function removeDueDateField(lineContent: string, fieldName: string): string | null {
	// Try removing inline field format
	const fieldRegex = new RegExp(`\\s*\\[${escapeRegex(fieldName)}::\\s*\\d{4}-\\d{2}-\\d{2}\\]`, 'g');
	let newLine = lineContent.replace(fieldRegex, '');

	// Try removing shorthand format 📅YYYY-MM-DD
	const shorthandRegex = /\s*📅\d{4}-\d{2}-\d{2}/g;
	newLine = newLine.replace(shorthandRegex, '');

	if (newLine === lineContent) {
		return null;
	}

	return newLine;
}
