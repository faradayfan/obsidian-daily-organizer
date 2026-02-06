import { Editor, MarkdownView } from 'obsidian';
import { DailyOrganizerSettings } from '../../settings';
import { formatDate } from '../../utils/date-utils';
import { extractDueDate, removeDueDateExpression } from '../../utils/date-parser';
import { extractPriority, removePriorityExpression } from '../../utils/priority-parser';
import { TASK_REGEX } from './completion-date';
import { addCompletionField, removeCompletionField } from './completion-date';
import { addCreatedField } from './created-date';
import { addDueDateField } from './due-date';
import { addPriorityField } from './priority';

interface LineState {
	isTask: boolean;
	isCompleted: boolean;
}

export class TaskMetadataHandler {
	private settings: DailyOrganizerSettings;
	private lastLineStates: Map<string, Map<number, LineState>> = new Map();

	constructor(settings: DailyOrganizerSettings) {
		this.settings = settings;
	}

	updateSettings(settings: DailyOrganizerSettings): void {
		this.settings = settings;
	}

	/**
	 * Handle editor changes to detect checkbox state changes for completion dates.
	 * Only processes completion date changes now - other metadata is added via batch processing.
	 */
	handleEditorChange(editor: Editor, view: MarkdownView): void {
		if (!this.settings.completionDateEnabled) {
			return;
		}

		const file = view.file;
		if (!file) {
			return;
		}

		const filePath = file.path;
		const previousStates = this.lastLineStates.get(filePath) ?? new Map<number, LineState>();
		const newStates = new Map<number, LineState>();
		const lineCount = editor.lineCount();

		for (let i = 0; i < lineCount; i++) {
			const lineContent = editor.getLine(i);
			const match = lineContent.match(TASK_REGEX);
			const isTask = match !== null;
			const isCompleted = match ? match[2]?.toLowerCase() === 'x' : false;

			newStates.set(i, { isTask, isCompleted });

			const previousState = previousStates.get(i);

			// Skip completion detection if this is the first time seeing this line
			if (previousState === undefined) {
				continue;
			}

			// Detect completion state change (only if line was and still is a task)
			if (this.settings.completionDateEnabled && previousState.isTask && isTask) {
				if (previousState.isCompleted !== isCompleted) {
					// Save cursor position before making changes
					const cursorPos = editor.getCursor();
					const cursorWasOnThisLine = cursorPos.line === i;
					const cursorCh = cursorPos.ch;

					if (isCompleted) {
						const fieldName = this.settings.completionDateField || 'completion';
						const dateStr = formatDate(new Date(), 'YYYY-MM-DD');
						const useShorthand = this.settings.completionDateUseShorthand;
						const newLine = addCompletionField(lineContent, fieldName, dateStr, useShorthand);
						if (newLine !== null) {
							editor.setLine(i, newLine);
							// Restore cursor position on the same line if it was there
							if (cursorWasOnThisLine) {
								editor.setCursor({ line: i, ch: cursorCh });
							}
						}
					} else {
						const fieldName = this.settings.completionDateField || 'completion';
						const newLine = removeCompletionField(lineContent, fieldName);
						if (newLine !== null) {
							const lengthDiff = lineContent.length - newLine.length;
							editor.setLine(i, newLine);
							// Restore cursor position, adjusting for removed text
							if (cursorWasOnThisLine) {
								editor.setCursor({ line: i, ch: Math.max(0, cursorCh - lengthDiff) });
							}
						}
					}
					// Re-read line after modification to update state
					const updatedLine = editor.getLine(i);
					const updatedMatch = updatedLine.match(TASK_REGEX);
					newStates.set(i, {
						isTask: updatedMatch !== null,
						isCompleted: updatedMatch ? updatedMatch[2]?.toLowerCase() === 'x' : false,
					});
				}
			}
		}

		this.lastLineStates.set(filePath, newStates);
	}

	/**
	 * Process all tasks in a file to add metadata (created date, due date, priority).
	 * This is run manually or automatically before todo migration.
	 * Only processes uncompleted tasks.
	 */
	async processTaskMetadata(editor: Editor): Promise<number> {
		let processedCount = 0;
		const lineCount = editor.lineCount();
		const today = formatDate(new Date(), 'YYYY-MM-DD');

		for (let i = 0; i < lineCount; i++) {
			let lineContent = editor.getLine(i);
			const match = lineContent.match(TASK_REGEX);
			const isTask = match !== null;

			if (!isTask) {
				continue;
			}

			let modified = false;
			const originalLine = lineContent;

			// Add created date if enabled and not already present
			if (this.settings.createdDateEnabled) {
				const fieldName = this.settings.createdDateField || 'created';
				const useShorthand = this.settings.createdDateUseShorthand;
				const newLine = addCreatedField(lineContent, fieldName, today, useShorthand);
				if (newLine !== null) {
					lineContent = newLine;
					modified = true;
				}
			}

			// Auto-detect and add due date if enabled
			// Strip existing metadata before parsing to avoid false matches
			if (this.settings.dueDateEnabled && this.settings.dueDateAutoDetect) {
				// Remove all existing metadata emojis and inline fields before parsing
				const cleanedForParsing = originalLine
					.replace(/\s*\[[\w-]+::\s*[^\]]+\]/g, '') // Remove inline fields
					.replace(/\s*[⏫🔼🔽⏬✅➕📅]\s*\d{4}-\d{2}-\d{2}/g, ''); // Remove shorthand metadata

				const parsedDate = extractDueDate(cleanedForParsing);
				if (parsedDate) {
					const fieldName = this.settings.dueDateField || 'due';
					const dateStr = formatDate(parsedDate.date, 'YYYY-MM-DD');
					const useShorthand = this.settings.dueDateUseShorthand;

					// Remove the natural language text from the ORIGINAL line (before metadata was added)
					if (this.settings.dueDateRemoveExpression) {
						// Find the expression in the original line to remove it
						const originalParsed = extractDueDate(originalLine.replace(/\s*\[[\w-]+::\s*[^\]]+\]/g, '').replace(/\s*[⏫🔼🔽⏬✅➕📅]\s*\d{4}-\d{2}-\d{2}/g, ''));
						if (originalParsed) {
							// Remove from original, then re-add any metadata we added
							const lineWithoutExpression = removeDueDateExpression(originalLine, originalParsed);
							// If we added created date, add it to the cleaned line
							if (modified && this.settings.createdDateEnabled) {
								const fieldName = this.settings.createdDateField || 'created';
								const useShorthand = this.settings.createdDateUseShorthand;
								lineContent = addCreatedField(lineWithoutExpression, fieldName, today, useShorthand) || lineWithoutExpression;
							} else {
								lineContent = lineWithoutExpression;
							}
						}
					}

					const newLine = addDueDateField(lineContent, fieldName, dateStr, useShorthand);
					if (newLine !== null) {
						lineContent = newLine;
						modified = true;
					}
				}
			}

			// Auto-detect and add priority if enabled
			// Strip existing metadata before parsing to avoid false matches
			if (this.settings.priorityEnabled && this.settings.priorityAutoDetect) {
				// Remove all existing metadata before parsing
				const cleanedForParsing = originalLine
					.replace(/\s*\[[\w-]+::\s*[^\]]+\]/g, '')
					.replace(/\s*[⏫🔼🔽⏬✅➕📅]\s*\d{4}-\d{2}-\d{2}/g, '');

				const parsedPriority = extractPriority(cleanedForParsing);
				if (parsedPriority) {
					const fieldName = this.settings.priorityField || 'priority';
					const useShorthand = this.settings.priorityUseShorthand;

					// Remove the natural language text from the line
					if (this.settings.priorityRemoveExpression) {
						// Extract priority from the CURRENT lineContent (with metadata stripped) to get correct indices
						// This is important because lineContent may have been modified by due date expression removal
						const currentLineCleaned = lineContent
							.replace(/\s*\[[\w-]+::\s*[^\]]+\]/g, '')
							.replace(/\s*[⏫🔼🔽⏬✅➕📅]\s*\d{4}-\d{2}-\d{2}/g, '');
						const currentParsed = extractPriority(currentLineCleaned);
						if (currentParsed) {
							lineContent = removePriorityExpression(lineContent, currentParsed);
						}
					}

					const newLine = addPriorityField(lineContent, fieldName, parsedPriority.level, useShorthand);
					if (newLine !== null) {
						lineContent = newLine;
						modified = true;
					}
				}
			}

			// Update the line if any metadata was added
			if (modified) {
				editor.setLine(i, lineContent);
				processedCount++;
			}
		}

		return processedCount;
	}

	/**
	 * Clear tracked states for a file (call when file is closed)
	 */
	clearFileState(filePath: string): void {
		this.lastLineStates.delete(filePath);
	}

	/**
	 * Initialize state tracking for current editor content
	 */
	initializeEditorState(editor: Editor, view: MarkdownView): void {
		if (!this.settings.completionDateEnabled) {
			return;
		}

		const file = view.file;
		if (!file) {
			return;
		}

		const filePath = file.path;
		const lineCount = editor.lineCount();
		const states = new Map<number, LineState>();

		for (let i = 0; i < lineCount; i++) {
			const line = editor.getLine(i);
			const match = line.match(TASK_REGEX);
			const isTask = match !== null;
			const isCompleted = match ? match[2]?.toLowerCase() === 'x' : false;
			states.set(i, { isTask, isCompleted });
		}

		this.lastLineStates.set(filePath, states);
	}
}
