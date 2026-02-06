import { escapeRegex } from './completion-date';
import { PRIORITY_EMOJI, PriorityLevel } from '../../utils/priority-parser';

/**
 * Add priority field to a task line
 * Returns null if priority already exists
 */
export function addPriorityField(
	lineContent: string,
	fieldName: string,
	priority: PriorityLevel,
	useShorthand = false
): string | null {
	// Check for existing inline field format [priority:: high]
	const existingFieldRegex = new RegExp(`\\[${escapeRegex(fieldName)}::\\s*\\w+\\]`);
	if (existingFieldRegex.test(lineContent)) {
		return null;
	}

	// Check for existing shorthand emoji formats (⏫, 🔼, 🔽, ⏬)
	// Use 'u' flag for proper Unicode support (avoids matching surrogate pairs)
	const existingShorthandRegex = /[⏫🔼🔽⏬]/u;
	if (existingShorthandRegex.test(lineContent)) {
		return null;
	}

	if (useShorthand) {
		const emoji = PRIORITY_EMOJI[priority];
		return `${lineContent} ${emoji}`;
	} else {
		const priorityField = `[${fieldName}:: ${priority}]`;
		return `${lineContent} ${priorityField}`;
	}
}

/**
 * Remove priority field from a task line
 * Removes both inline field format and shorthand emoji formats
 * Returns null if no priority field was found
 */
export function removePriorityField(lineContent: string, fieldName: string): string | null {
	let modified = false;
	let newLine = lineContent;

	// Remove inline field format [priority:: level]
	const fieldRegex = new RegExp(`\\s*\\[${escapeRegex(fieldName)}::\\s*\\w+\\]`, 'g');
	const afterFieldRemoval = newLine.replace(fieldRegex, '');
	if (afterFieldRemoval !== newLine) {
		modified = true;
		newLine = afterFieldRemoval;
	}

	// Remove shorthand emoji formats
	// Use 'u' flag for proper Unicode support (avoids matching surrogate pairs)
	const shorthandRegex = /\s*[⏫🔼🔽⏬]/gu;
	const afterShorthandRemoval = newLine.replace(shorthandRegex, '');
	if (afterShorthandRemoval !== newLine) {
		modified = true;
		newLine = afterShorthandRemoval;
	}

	return modified ? newLine : null;
}
