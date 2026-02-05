import { App, Editor, MarkdownView } from 'obsidian';
import { DailyOrganizerSettings } from '../../settings';
import { formatDate } from '../../utils/date-utils';

interface LineState {
	isTask: boolean;
	isCompleted: boolean;
}

export class CompletionDateHandler {
	private app: App;
	private settings: DailyOrganizerSettings;
	private lastLineStates: Map<string, Map<number, LineState>> = new Map();

	// Regex to match task checkboxes
	private readonly TASK_REGEX = /^(\s*- \[)([ xX])(\] .*)$/;

	constructor(app: App, settings: DailyOrganizerSettings) {
		this.app = app;
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
			const match = lineContent.match(this.TASK_REGEX);
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
				lineContent = this.addCreatedDate(editor, i, lineContent);
				// Re-read the line state after modification
				const updatedMatch = lineContent.match(this.TASK_REGEX);
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
						this.addCompletionDate(editor, i, lineContent);
					} else {
						this.removeCompletionDate(editor, i, lineContent);
					}
					// Re-read line after modification to update state
					const updatedLine = editor.getLine(i);
					const updatedMatch = updatedLine.match(this.TASK_REGEX);
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
	 * Add created date to a task line
	 */
	private addCreatedDate(editor: Editor, lineNumber: number, lineContent: string): string {
		const fieldName = this.settings.createdDateField || 'created';
		const dateStr = formatDate(new Date(), 'YYYY-MM-DD');
		const createdField = `[${fieldName}:: ${dateStr}]`;

		// Check if created date already exists
		const existingFieldRegex = new RegExp(`\\[${this.escapeRegex(fieldName)}::\\s*\\d{4}-\\d{2}-\\d{2}\\]`);
		if (existingFieldRegex.test(lineContent)) {
			return lineContent; // Already has a created date
		}

		let cursor = editor.getCursor().ch;
		const newLine = `${lineContent} ${createdField}`;
		editor.setLine(lineNumber, newLine);
		editor.setCursor({ line: lineNumber, ch: cursor }); // Keep cursor position
		return newLine;
	}

	/**
	 * Add completion date to a task line
	 */
	private addCompletionDate(editor: Editor, lineNumber: number, lineContent: string): void {
		const fieldName = this.settings.completionDateField || 'completion';
		const dateStr = formatDate(new Date(), 'YYYY-MM-DD');
		const completionField = `[${fieldName}:: ${dateStr}]`;

		// Check if completion date already exists
		const existingFieldRegex = new RegExp(`\\[${this.escapeRegex(fieldName)}::\\s*\\d{4}-\\d{2}-\\d{2}\\]`);
		if (existingFieldRegex.test(lineContent)) {
			return; // Already has a completion date
		}

		// Add completion date at the end of the line
		const newLine = `${lineContent} ${completionField}`;
		editor.setLine(lineNumber, newLine);
	}

	/**
	 * Remove completion date from a task line
	 */
	private removeCompletionDate(editor: Editor, lineNumber: number, lineContent: string): void {
		const fieldName = this.settings.completionDateField || 'completion';

		// Remove the completion field (with optional surrounding spaces)
		const fieldRegex = new RegExp(`\\s*\\[${this.escapeRegex(fieldName)}::\\s*\\d{4}-\\d{2}-\\d{2}\\]`, 'g');
		const newLine = lineContent.replace(fieldRegex, '');

		if (newLine !== lineContent) {
			editor.setLine(lineNumber, newLine);
		}
	}

	/**
	 * Escape special regex characters in a string
	 */
	private escapeRegex(str: string): string {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
			const match = line.match(this.TASK_REGEX);
			const isTask = match !== null;
			const isCompleted = match ? match[2]?.toLowerCase() === 'x' : false;
			states.set(i, { isTask, isCompleted });
		}

		this.lastLineStates.set(filePath, states);
	}
}
