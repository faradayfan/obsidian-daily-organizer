import { Plugin, TFile, MarkdownView } from 'obsidian';
import {
	DEFAULT_SETTINGS,
	DailyOrganizerSettings,
	DailyOrganizerSettingTab,
} from './settings';
import { LLMService } from './services/llm/llm-service';
import { TodoMigrator } from './features/todo-migration/todo-migrator';
import { ProjectFinder } from './features/project-updates/project-finder';
import { ProjectUpdater } from './features/project-updates/project-updater';
import { TaskMetadataHandler } from './features/task-metadata/task-metadata-handler';
import { TaskTagger } from './features/task-tagging/task-tagger';
import { extractDateFromFilename } from './utils/date-utils';

export default class DailyOrganizerPlugin extends Plugin {
	settings: DailyOrganizerSettings;

	// Services
	private llmService: LLMService;

	// Features
	private todoMigrator: TodoMigrator;
	private projectFinder: ProjectFinder;
	private projectUpdater: ProjectUpdater;
	private taskMetadataHandler: TaskMetadataHandler;
	private taskTagger: TaskTagger;

	async onload() {
		await this.loadSettings();
		this.initializeServices();
		this.registerCommands();
		this.registerEventHandlers();
		this.addSettingTab(new DailyOrganizerSettingTab(this.app, this));

		console.log('Daily Organizer plugin loaded');
	}

	onunload() {
		console.log('Daily Organizer plugin unloaded');
	}

	private initializeServices(): void {
		// Initialize LLM service
		this.llmService = new LLMService(this.settings);

		// Initialize todo migration
		this.todoMigrator = new TodoMigrator(this.app, this.settings);

		// Initialize project updates
		this.projectFinder = new ProjectFinder(this.app, this.settings);
		this.projectUpdater = new ProjectUpdater(
			this.app,
			this.settings,
			this.llmService,
			this.projectFinder
		);

		// Initialize task metadata handler
		this.taskMetadataHandler = new TaskMetadataHandler(this.settings);

		// Initialize task tagger
		this.taskTagger = new TaskTagger(this.app, this.settings, this.projectFinder);
	}

	private registerCommands(): void {
		// Todo migration command (manual trigger)
		this.addCommand({
			id: 'migrate-todos',
			name: 'Migrate uncompleted todos to today',
			callback: async () => {
				await this.todoMigrator.manualMigrate();
			},
		});

		// Project updates command
		this.addCommand({
			id: 'update-projects',
			name: 'Update project pages with daily progress',
			callback: async () => {
				await this.projectUpdater.updateAllProjects();
			},
		});

		// Update current project keywords command
		this.addCommand({
			id: 'update-current-project-keywords',
			name: 'Update keywords for current project (using LLM)',
			callback: async () => {
				await this.projectUpdater.updateCurrentProjectKeywords();
			},
		});

		// Update all project keywords command
		this.addCommand({
			id: 'update-project-keywords',
			name: 'Update keywords for all projects (using LLM)',
			callback: async () => {
				await this.projectUpdater.updateAllProjectKeywords();
			},
		});

		// Task tagging command
		this.addCommand({
			id: 'tag-tasks',
			name: 'Tag tasks and sections with project keywords',
			callback: async () => {
				await this.taskTagger.tagTasksInActiveFile();
			},
		});
	}

	private registerEventHandlers(): void {
		// Register for file creation events to auto-migrate todos and update projects
		this.registerEvent(
			this.app.vault.on('create', async (file) => {
				if (file instanceof TFile && this.isDailyNote(file)) {
					// Small delay to ensure file is fully created and any templates are applied
					setTimeout(async () => {
						console.log('Daily Organizer: New daily note created:', file.basename);
						console.log('Daily Organizer: projectAutoUpdateEnabled:', this.settings.projectAutoUpdateEnabled);
						console.log('Daily Organizer: todoMigrationEnabled:', this.settings.todoMigrationEnabled);

						// Auto-update projects BEFORE migrating todos
						// This ensures the LLM sees uncompleted tasks in the previous note
						if (this.settings.projectAutoUpdateEnabled) {
							const previousNote = await this.findPreviousDailyNote(file);
							console.log('Daily Organizer: Previous note found:', previousNote?.basename ?? 'none');
							if (previousNote) {
								await this.projectUpdater.updateProjectsFromNote(previousNote);
							}
						}

						// Auto-migrate todos after project updates
						// This removes completed todos from the previous note
						if (this.settings.todoMigrationEnabled) {
							await this.todoMigrator.migrateTodos(file);
						}
					}, 500);
				}
			})
		);

		// Register for editor changes to handle task metadata tracking
		this.registerEvent(
			this.app.workspace.on('editor-change', (editor, view) => {
				if (view instanceof MarkdownView) {
					this.taskMetadataHandler.handleEditorChange(editor, view);
				}
			})
		);

		// Initialize task metadata state when a file is opened
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				const view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (view && view.editor) {
					this.taskMetadataHandler.initializeEditorState(view.editor, view);
				}
			})
		);
	}

	private async findPreviousDailyNote(currentNote: TFile): Promise<TFile | null> {
		const currentDate = extractDateFromFilename(currentNote.basename);
		if (!currentDate) {
			return null;
		}

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

	private isDailyNote(file: TFile): boolean {
		// Check file extension
		if (file.extension !== 'md') {
			return false;
		}

		// Check if filename matches daily note pattern (YYYY-MM-DD)
		const date = extractDateFromFilename(file.basename);
		if (!date) {
			return false;
		}

		// Check if in the correct folder
		const expectedFolder = this.settings.dailyNotesFolder || '';
		const fileFolder = file.parent?.path ?? '';

		// Normalize for comparison (handle root folder case)
		const normalizedExpected = expectedFolder === '' ? '' : expectedFolder;
		const normalizedActual = fileFolder === '/' ? '' : fileFolder;

		return normalizedExpected === normalizedActual;
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<DailyOrganizerSettings>
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);

		// Update services with new settings
		if (this.llmService) {
			this.llmService.updateSettings(this.settings);
		}
		if (this.todoMigrator) {
			this.todoMigrator.updateSettings(this.settings);
		}
		if (this.projectFinder) {
			this.projectFinder.updateSettings(this.settings);
		}
		if (this.projectUpdater) {
			this.projectUpdater.updateSettings(this.settings);
		}
		if (this.taskMetadataHandler) {
			this.taskMetadataHandler.updateSettings(this.settings);
		}
		if (this.taskTagger) {
			this.taskTagger.updateSettings(this.settings);
		}
	}
}
