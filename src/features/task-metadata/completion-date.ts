export const TASK_REGEX = /^(\s*- \[)([ xX])(\] .*)$/;

export function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Add a completion date field to a task line.
 * Returns the new line string, or null if the field already exists.
 */
export function addCompletionField(lineContent: string, fieldName: string, dateStr: string): string | null {
	const existingFieldRegex = new RegExp(`\\[${escapeRegex(fieldName)}::\\s*\\d{4}-\\d{2}-\\d{2}\\]`);
	if (existingFieldRegex.test(lineContent)) {
		return null;
	}

	const completionField = `[${fieldName}:: ${dateStr}]`;
	return `${lineContent} ${completionField}`;
}

/**
 * Remove a completion date field from a task line.
 * Returns the new line string, or null if the field was not found.
 */
export function removeCompletionField(lineContent: string, fieldName: string): string | null {
	const fieldRegex = new RegExp(`\\s*\\[${escapeRegex(fieldName)}::\\s*\\d{4}-\\d{2}-\\d{2}\\]`, 'g');
	const newLine = lineContent.replace(fieldRegex, '');

	if (newLine === lineContent) {
		return null;
	}

	return newLine;
}
