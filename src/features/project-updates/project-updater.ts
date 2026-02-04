import { App, TFile, Notice } from 'obsidian';
import type { DailyOrganizerSettings } from '../../settings';
import type { ProjectMetadata } from '../../types';
import { LLMService } from '../../services/llm/llm-service';
import { ProjectFinder } from './project-finder';
import { formatDate, getDailyNotePath, extractDateFromFilename } from '../../utils/date-utils';
import { insertAfterSection, appendToSection, findSectionByHeader } from '../../utils/markdown-utils';

export class ProjectUpdater {
	private app: App;
	private settings: DailyOrganizerSettings;
	private llmService: LLMService;
	private projectFinder: ProjectFinder;

	constructor(
		app: App,
		settings: DailyOrganizerSettings,
		llmService: LLMService,
		projectFinder: ProjectFinder
	) {
		this.app = app;
		this.settings = settings;
		this.llmService = llmService;
		this.projectFinder = projectFinder;
	}

	updateSettings(settings: DailyOrganizerSettings): void {
		this.settings = settings;
	}

	async updateAllProjects(): Promise<void> {
		// Check if LLM is configured
		if (!this.llmService.isConfigured()) {
			new Notice('LLM API key not configured. Please add it in settings.');
			return;
		}

		// Find all projects
		const projects = await this.projectFinder.findProjects();

		if (projects.length === 0) {
			new Notice(`No projects found with ${this.settings.projectTag} tag.`);
			return;
		}

		new Notice(`Found ${projects.length} project(s). Analyzing...`);

		// Get today's notes content
		const todaysNotes = await this.getTodaysNotesContent();

		if (!todaysNotes) {
			new Notice('No daily note found for today. Nothing to update.');
			return;
		}

		// Update each project
		let updatedCount = 0;
		for (const project of projects) {
			const updated = await this.updateProject(project, todaysNotes);
			if (updated) {
				updatedCount++;
			}
		}

		new Notice(`Updated ${updatedCount} project(s) with daily progress.`);
	}

	async updateProjectsFromNote(noteFile: TFile): Promise<void> {
		// Check if LLM is configured
		if (!this.llmService.isConfigured()) {
			console.log('Daily Organizer: LLM not configured, skipping auto project update');
			return;
		}

		// Find all projects
		const projects = await this.projectFinder.findProjects();

		if (projects.length === 0) {
			console.log('Daily Organizer: No projects found for auto-update');
			return;
		}

		// Read the note content
		const noteContent = await this.app.vault.read(noteFile);

		if (!noteContent || noteContent.trim().length === 0) {
			console.log('Daily Organizer: Note is empty, skipping auto project update');
			return;
		}

		// Get the date from the note for the update header
		const noteDate = extractDateFromFilename(noteFile.basename);
		const dateStr = noteDate ? formatDate(noteDate, 'YYYY-MM-DD') : noteFile.basename;

		console.log(`Daily Organizer: Auto-updating projects from ${dateStr}`);

		// Update each project
		let updatedCount = 0;
		for (const project of projects) {
			const updated = await this.updateProjectWithDate(project, noteContent, dateStr);
			if (updated) {
				updatedCount++;
			}
		}

		if (updatedCount > 0) {
			new Notice(`Updated ${updatedCount} project(s) with progress from ${dateStr}`);
		}
		console.log(`Daily Organizer: Auto-updated ${updatedCount} project(s) from ${dateStr}`);
	}

	private async updateProject(
		project: ProjectMetadata,
		notesContent: string
	): Promise<boolean> {
		const today = formatDate(new Date(), 'YYYY-MM-DD');
		return this.updateProjectWithDate(project, notesContent, today);
	}

	private async updateProjectWithDate(
		project: ProjectMetadata,
		notesContent: string,
		dateStr: string
	): Promise<boolean> {
		// Build project context from metadata
		const projectContext = this.buildProjectContext(project);

		// Get existing updates section for context
		const projectContent = await this.projectFinder.getProjectContent(project);
		const existingUpdates = this.extractExistingUpdates(projectContent);

		// Check if we already have an update for this date
		if (existingUpdates && existingUpdates.includes(`### ${dateStr}`)) {
			console.log(`Daily Organizer: Project ${project.name} already has update for ${dateStr}`);
			return false;
		}

		// Generate update using LLM
		const response = await this.llmService.analyzeForProject(
			projectContext,
			notesContent,
			existingUpdates
		);

		if (response.error) {
			console.error(`Daily Organizer: Error updating project ${project.name}:`, response.error);
			return false;
		}

		if (!response.content || response.content.trim().length === 0) {
			console.log(`Daily Organizer: No relevant update generated for ${project.name}`);
			return false;
		}

		// Insert update into project page
		await this.insertUpdateWithDate(project, response.content, dateStr);
		return true;
	}

	private buildProjectContext(project: ProjectMetadata): string {
		const lines: string[] = [];

		lines.push(`Project: ${project.name}`);

		if (project.description) {
			lines.push(`Description: ${project.description}`);
		}

		if (project.goals) {
			lines.push(`Goals: ${project.goals}`);
		}

		if (project.status) {
			lines.push(`Status: ${project.status}`);
		}

		// Add any other relevant frontmatter fields
		const skipFields = ['path', 'name', 'description', 'goals', 'status', 'tags', 'position'];
		for (const [key, value] of Object.entries(project)) {
			if (!skipFields.includes(key) && value && typeof value === 'string') {
				lines.push(`${key}: ${value}`);
			}
		}

		return lines.join('\n');
	}

	private extractExistingUpdates(content: string): string | undefined {
		const section = findSectionByHeader(content, this.settings.projectUpdateSection);
		if (!section) {
			return undefined;
		}

		// Get the last few updates for context (to avoid repetition)
		const sectionContent = content.slice(section.contentStart, section.end);
		const lines = sectionContent.split('\n');

		// Take last 20 lines or so for context
		const recentLines = lines.slice(-20);
		return recentLines.join('\n').trim() || undefined;
	}

	private async getTodaysNotesContent(): Promise<string | null> {
		const today = new Date();
		const todayPath = getDailyNotePath(today, this.settings.dailyNotesFolder);

		const todayNote = this.app.vault.getAbstractFileByPath(todayPath);
		if (!todayNote || !(todayNote instanceof TFile)) {
			return null;
		}

		return this.app.vault.read(todayNote);
	}

	private async insertUpdateWithDate(project: ProjectMetadata, update: string, dateStr: string): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(project.path);
		if (!(file instanceof TFile)) {
			return;
		}

		const content = await this.app.vault.read(file);

		// Format the update entry
		const updateEntry = `### ${dateStr}\n${update}`;

		// Insert based on position setting
		const insertFn = this.settings.projectUpdatePosition === 'top'
			? insertAfterSection
			: appendToSection;

		const newContent = insertFn(
			content,
			this.settings.projectUpdateSection,
			updateEntry
		);

		await this.app.vault.modify(file, newContent);
	}
}
