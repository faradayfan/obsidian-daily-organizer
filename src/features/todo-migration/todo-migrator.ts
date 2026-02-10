import { App, TFile, Notice } from 'obsidian';
import type { DailyOrganizerSettings } from '../../settings';
import { TodoParser } from './todo-parser';
import {
	formatDate,
	extractDateFromFilename,
	getDailyNotePath,
} from '../../utils/date-utils';
import { insertAfterTag } from '../../utils/markdown-utils';

export class TodoMigrator {
	private app: App;
	private settings: DailyOrganizerSettings;
	private parser: TodoParser;

	constructor(app: App, settings: DailyOrganizerSettings) {
		this.app = app;
		this.settings = settings;
		this.parser = new TodoParser({
			enabled: settings.createdDateEnabled,
			fieldName: settings.createdDateField || 'created',
			useShorthand: settings.createdDateUseShorthand,
		});
	}

	updateSettings(settings: DailyOrganizerSettings): void {
		this.settings = settings;
		this.parser = new TodoParser({
			enabled: settings.createdDateEnabled,
			fieldName: settings.createdDateField || 'created',
			useShorthand: settings.createdDateUseShorthand,
		});
	}

	async migrateTodos(currentDayNote: TFile): Promise<void> {
		// Extract date from current note filename
		const currentDate = extractDateFromFilename(currentDayNote.basename);
		if (!currentDate) {
			console.debug('Daily Organizer: Could not parse date from filename:', currentDayNote.basename);
			return;
		}

		// Find the most recent previous daily note (handles weekends/gaps)
		const previousNote = await this.findPreviousDailyNote(currentDate);
		if (!previousNote) {
			console.debug('Daily Organizer: No previous daily note found');
			return;
		}

		const previousDate = extractDateFromFilename(previousNote.basename);
		if (!previousDate) {
			console.debug('Daily Organizer: Could not parse date from previous note:', previousNote.basename);
			return;
		}

		// Read previous note's content
		const previousContent = await this.app.vault.read(previousNote);

		// Parse uncompleted todos
		const uncompletedTodos = this.parser.parseUncompletedTodos(previousContent);

		if (uncompletedTodos.length === 0) {
			console.debug('Daily Organizer: No uncompleted todos to migrate');
			return;
		}

		// Format date for metadata (use the date from the previous note, not yesterday)
		const previousDateStr = formatDate(previousDate, 'YYYY-MM-DD');

		// Format todos for insertion
		const formattedTodos = this.parser.formatTodosForSection(uncompletedTodos, previousDateStr);

		// Read current note content
		const currentContent = await this.app.vault.read(currentDayNote);

		// Check if todos are already present (prevent duplicate migration)
		if (this.todosAlreadyPresent(currentContent, uncompletedTodos)) {
			console.debug('Daily Organizer: Todos appear to be already migrated');
			return;
		}

		// Insert todos after the tag section
		const newContent = insertAfterTag(
			currentContent,
			this.settings.todoSectionTag,
			formattedTodos
		);

		// Save updated content to current note
		await this.app.vault.modify(currentDayNote, newContent);

		// Remove migrated todos from the previous note
		const updatedPreviousContent = this.parser.removeTodosFromContent(previousContent, uncompletedTodos);
		await this.app.vault.modify(previousNote, updatedPreviousContent);

		new Notice(`Migrated ${uncompletedTodos.length} todo(s) from ${previousDateStr}`);
		console.debug(`Daily Organizer: Migrated ${uncompletedTodos.length} todos from ${previousDateStr}`);
	}

	private async findPreviousDailyNote(currentDate: Date): Promise<TFile | null> {
		const dailyNotesFolder = this.settings.dailyNotesFolder;
		const allFiles = this.app.vault.getMarkdownFiles();

		// Filter to daily notes and parse their dates
		const dailyNotes: { file: TFile; date: Date }[] = [];

		for (const file of allFiles) {
			// Check if file is in the daily notes folder
			const fileFolder = file.parent?.path ?? '';
			const expectedFolder = dailyNotesFolder || '';

			if (fileFolder !== expectedFolder && !(expectedFolder === '' && fileFolder === '/')) {
				continue;
			}

			// Try to parse date from filename
			const fileDate = extractDateFromFilename(file.basename);
			if (fileDate) {
				dailyNotes.push({ file, date: fileDate });
			}
		}

		// Filter to notes before current date and sort by date descending
		const previousNotes = dailyNotes
			.filter(({ date }) => date.getTime() < currentDate.getTime())
			.sort((a, b) => b.date.getTime() - a.date.getTime());

		// Return the most recent one
		const mostRecent = previousNotes[0];
		return mostRecent?.file ?? null;
	}

	async manualMigrate(): Promise<void> {
		// Get today's note
		const today = new Date();
		const todayPath = getDailyNotePath(today, this.settings.dailyNotesFolder);

		const todayNote = this.app.vault.getAbstractFileByPath(todayPath);
		if (!todayNote || !(todayNote instanceof TFile)) {
			new Notice('Today\'s daily note not found. Please create it first.');
			return;
		}

		await this.migrateTodos(todayNote);
	}

	private todosAlreadyPresent(content: string, todos: { content: string }[]): boolean {
		// Simple check: see if any of the todo content strings are already in the note
		// This helps prevent duplicate migration
		for (const todo of todos) {
			// Extract just the core task text (without metadata) for comparison
			const coreContent = this.parser.stripCreatedMetadata(todo.content);
			if (content.includes(coreContent)) {
				return true;
			}
		}
		return false;
	}
}
