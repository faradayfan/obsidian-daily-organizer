import { escapeRegex } from './completion-date';

/**
 * Add a created date field to a task line.
 * Returns the new line string, or null if the field already exists.
 */
export function addCreatedField(lineContent: string, fieldName: string, dateStr: string): string | null {
	const existingFieldRegex = new RegExp(`\\[${escapeRegex(fieldName)}::\\s*\\d{4}-\\d{2}-\\d{2}\\]`);
	if (existingFieldRegex.test(lineContent)) {
		return null;
	}

	const createdField = `[${fieldName}:: ${dateStr}]`;
	return `${lineContent} ${createdField}`;
}
