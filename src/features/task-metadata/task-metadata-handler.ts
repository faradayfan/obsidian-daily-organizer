import { Editor, MarkdownView } from 'obsidian';
import { DailyOrganizerSettings } from '../../settings';
import { formatDate } from '../../utils/date-utils';
import { TASK_REGEX } from './completion-date';
import { addCompletionField, removeCompletionField } from './completion-date';
import { addCreatedField } from './created-date';

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
	 * Handle editor changes to detect checkbox state changes and task creation.
	 * Scans all lines to detect changes regardless of cursor position.
	 */
	handleEditorChange(editor: Editor, view: MarkdownView): void {
		if (!this.settings.completionDateEnabled && !this.settings.createdDateEnabled) {
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
			let lineContent = editor.getLine(i);
			const match = lineContent.match(TASK_REGEX);
			const isTask = match !== null;
			const isCompleted = match ? match[2]?.toLowerCase() === 'x' : false;

			newStates.set(i, { isTask, isCompleted });

			const previousState = previousStates.get(i);

			// Detect task creation:
			// - Line was previously not a task and is now a task (manual typing)
			// - Line was never tracked and is now a task (auto-created via Enter key)
			//   initializeEditorState pre-populates all existing lines on file open,
			//   so an untracked line during editing is genuinely new.
			const isNewTask = isTask && (previousState === undefined || !previousState.isTask);
			if (this.settings.createdDateEnabled && isNewTask) {
				const fieldName = this.settings.createdDateField || 'created';
				const dateStr = formatDate(new Date(), 'YYYY-MM-DD');
				const useShorthand = this.settings.createdDateUseShorthand;
				const newLine = addCreatedField(lineContent, fieldName, dateStr, useShorthand);
				if (newLine !== null) {
					const cursor = editor.getCursor().ch;
					editor.setLine(i, newLine);
					editor.setCursor({ line: i, ch: cursor });
					lineContent = newLine;
				}
				// Re-read the line state after modification
				const updatedMatch = lineContent.match(TASK_REGEX);
				newStates.set(i, {
					isTask: updatedMatch !== null,
					isCompleted: updatedMatch ? updatedMatch[2]?.toLowerCase() === 'x' : false,
				});
			}

			// Skip completion detection if this is the first time seeing this line
			if (previousState === undefined) {
				continue;
			}

			// Detect completion state change (only if line was and still is a task)
			if (this.settings.completionDateEnabled && previousState.isTask && isTask) {
				if (previousState.isCompleted !== isCompleted) {
					if (isCompleted) {
						const fieldName = this.settings.completionDateField || 'completion';
						const dateStr = formatDate(new Date(), 'YYYY-MM-DD');
						const useShorthand = this.settings.completionDateUseShorthand;
						const newLine = addCompletionField(lineContent, fieldName, dateStr, useShorthand);
						if (newLine !== null) {
							editor.setLine(i, newLine);
						}
					} else {
						const fieldName = this.settings.completionDateField || 'completion';
						const newLine = removeCompletionField(lineContent, fieldName);
						if (newLine !== null) {
							editor.setLine(i, newLine);
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
	 * Clear tracked states for a file (call when file is closed)
	 */
	clearFileState(filePath: string): void {
		this.lastLineStates.delete(filePath);
	}

	/**
	 * Initialize state tracking for current editor content
	 */
	initializeEditorState(editor: Editor, view: MarkdownView): void {
		if (!this.settings.completionDateEnabled && !this.settings.createdDateEnabled) {
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
