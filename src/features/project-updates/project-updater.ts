import { App, TFile, Notice } from 'obsidian';
import type { DailyOrganizerSettings } from '../../settings';
import type { ProjectMetadata } from '../../types';
import { LLMService } from '../../services/llm/llm-service';
import { ProjectFinder } from './project-finder';
import { formatDate, getDailyNotePath, extractDateFromFilename } from '../../utils/date-utils';
import { insertAfterTag, findSectionByTag, findSectionByHeader } from '../../utils/markdown-utils';

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

	async updateAllProjectKeywords(): Promise<void> {
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

		new Notice(`Generating keywords for ${projects.length} project(s)...`);

		let updatedCount = 0;
		for (const project of projects) {
			const updated = await this.updateProjectKeywords(project);
			if (updated) {
				updatedCount++;
			}
		}

		new Notice(`Updated keywords for ${updatedCount} project(s).`);
	}

	async updateProjectKeywords(project: ProjectMetadata): Promise<boolean> {
		console.log(`Daily Organizer: Generating keywords for project ${project.name}`);

		// Get project content
		const projectContent = await this.projectFinder.getProjectContent(project);

		// Extract key sections for analysis
		const projectSections = this.extractProjectSections(projectContent);

		if (!projectSections || projectSections.trim().length === 0) {
			console.log(`Daily Organizer: No project sections found for ${project.name}`);
			return false;
		}

		// Call LLM to generate keywords
		const response = await this.llmService.generateProjectKeywords(project.name, projectSections);

		if (response.error) {
			console.error(`Daily Organizer: Error generating keywords for ${project.name}:`, response.error);
			return false;
		}

		if (!response.content || response.content.trim().length === 0) {
			console.log(`Daily Organizer: No keywords generated for ${project.name}`);
			return false;
		}

		// Clean up the response - ensure it's just keywords
		const keywords = response.content.trim();
		console.log(`Daily Organizer: Generated keywords for ${project.name}: ${keywords}`);

		// Update the project frontmatter with the new keywords
		await this.updateProjectFrontmatter(project, 'update_keywords', keywords);

		return true;
	}

	private async updateProjectFrontmatter(project: ProjectMetadata, key: string, value: string): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(project.path);
		if (!(file instanceof TFile)) {
			return;
		}

		const content = await this.app.vault.read(file);

		// Parse frontmatter
		const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
		if (!frontmatterMatch) {
			console.log(`Daily Organizer: No frontmatter found in ${project.path}`);
			return;
		}

		const frontmatter = frontmatterMatch[1];
		const afterFrontmatter = content.slice(frontmatterMatch[0].length);

		// Check if key already exists in frontmatter
		const keyRegex = new RegExp(`^${key}:.*$`, 'm');
		let newFrontmatter: string;

		if (keyRegex.test(frontmatter ?? '')) {
			// Replace existing key
			newFrontmatter = (frontmatter ?? '').replace(keyRegex, `${key}: ${value}`);
		} else {
			// Add new key at the end of frontmatter
			newFrontmatter = `${frontmatter}\n${key}: ${value}`;
		}

		const newContent = `---\n${newFrontmatter}\n---${afterFrontmatter}`;
		await this.app.vault.modify(file, newContent);

		console.log(`Daily Organizer: Updated ${key} in ${project.path}`);
	}

	async updateAllProjects(): Promise<void> {
		// Check if LLM is configured
		if (!this.llmService.isConfigured()) {
			new Notice('LLM API key not configured. Please add it in settings.');
			return;
		}

		// Find all projects
		let projects = await this.projectFinder.findProjects();

		if (projects.length === 0) {
			new Notice(`No projects found with ${this.settings.projectTag} tag.`);
			return;
		}

		// Optionally update keywords first
		if (this.settings.autoUpdateProjectKeywords) {
			new Notice(`Updating keywords for ${projects.length} project(s)...`);
			for (const project of projects) {
				await this.updateProjectKeywords(project);
			}
			// Re-fetch projects to get updated keywords
			projects = await this.projectFinder.findProjects();
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
		let projects = await this.projectFinder.findProjects();

		if (projects.length === 0) {
			console.log('Daily Organizer: No projects found for auto-update');
			return;
		}

		// Optionally update keywords first
		if (this.settings.autoUpdateProjectKeywords) {
			console.log(`Daily Organizer: Auto-updating keywords for ${projects.length} project(s)`);
			for (const project of projects) {
				await this.updateProjectKeywords(project);
			}
			// Re-fetch projects to get updated keywords
			projects = await this.projectFinder.findProjects();
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
		console.log(`Daily Organizer: Updating project ${project.name} for ${dateStr}`);

		// Get project content first (needed for both context and updates)
		const projectContent = await this.projectFinder.getProjectContent(project);
		console.log(`Daily Organizer: Project content length: ${projectContent.length} chars`);

		// Build enhanced project context from metadata and content
		const projectContext = this.buildProjectContext(project, projectContent);

		// Get existing updates section for context
		const existingUpdates = this.extractExistingUpdates(projectContent);

		// Check if we already have an update for this date
		if (existingUpdates && existingUpdates.includes(`### ${dateStr}`)) {
			console.log(`Daily Organizer: Project ${project.name} already has update for ${dateStr}`);
			return false;
		}

		// Pre-filter notes to only potentially relevant sections
		const relevantContent = this.extractRelevantContent(notesContent, project);
		console.log(`Daily Organizer: Relevant content length: ${relevantContent?.length ?? 0} chars`);

		if (!relevantContent || relevantContent.trim().length === 0) {
			console.log(`Daily Organizer: No content mentioning ${project.name} found in daily notes`);
			return false;
		}

		// Generate update using LLM
		console.log(`Daily Organizer: Calling LLM for project ${project.name}...`);
		const response = await this.llmService.analyzeForProject(
			projectContext,
			relevantContent,
			existingUpdates
		);
		console.log(`Daily Organizer: LLM response - error: ${response.error ?? 'none'}, content length: ${response.content?.length ?? 0}`);

		if (response.error) {
			console.error(`Daily Organizer: Error updating project ${project.name}:`, response.error);
			return false;
		}

		if (!response.content || response.content.trim().length === 0) {
			console.log(`Daily Organizer: No relevant update generated for ${project.name}`);
			return false;
		}

		// Check if LLM indicated no relevant updates
		if (response.content.includes('NO_RELEVANT_UPDATES')) {
			console.log(`Daily Organizer: No relevant updates for ${project.name}`);
			return false;
		}

		console.log(`Daily Organizer: LLM response content:\n${response.content}`);
		console.log(`Daily Organizer: Inserting update into project page...`);

		// Insert update into project page
		await this.insertUpdateWithDate(project, response.content, dateStr);
		console.log(`Daily Organizer: Successfully inserted update for ${project.name}`);
		return true;
	}

	private buildProjectContext(project: ProjectMetadata, projectContent: string): string {
		const sections: string[] = [];

		// Basic project info
		sections.push(`# Project: ${project.name}\n`);

		// Frontmatter metadata
		const metadata: string[] = [];
		if (project.description) {
			metadata.push(`Description: ${project.description}`);
		}
		if (project.goals) {
			metadata.push(`Goals: ${project.goals}`);
		}
		if (project.status) {
			metadata.push(`Status: ${project.status}`);
		}

		// Add update guidance fields if present
		if (project.update_focus) {
			metadata.push(`Update Focus: ${project.update_focus}`);
		}
		if (project.update_keywords) {
			metadata.push(`Keywords to Watch: ${project.update_keywords}`);
		}
		if (project.update_style) {
			metadata.push(`Update Style: ${project.update_style}`);
		}

		// Add any other relevant frontmatter fields
		const skipFields = ['path', 'name', 'description', 'goals', 'status', 'tags', 'position', 'update_focus', 'update_keywords', 'update_style'];
		for (const [key, value] of Object.entries(project)) {
			if (!skipFields.includes(key) && value && typeof value === 'string') {
				metadata.push(`${key}: ${value}`);
			}
		}

		if (metadata.length > 0) {
			sections.push(`## Metadata\n${metadata.join('\n')}`);
		}

		// Extract key sections from project page
		const projectSections = this.extractProjectSections(projectContent);
		if (projectSections) {
			sections.push(`## Project Content\n${projectSections}`);
		}

		return sections.join('\n\n');
	}

	private extractExistingUpdates(content: string): string | undefined {
		const section = findSectionByTag(content, this.settings.projectUpdateTag);
		if (!section) {
			return undefined;
		}

		// Get the last 5 complete updates for context (to understand style and avoid repetition)
		const sectionContent = content.slice(section.contentStart, section.end);
		const updates: string[] = [];
		const lines = sectionContent.split('\n');

		let currentUpdate = '';
		let foundUpdates = 0;

		// Parse updates from bottom to top (most recent first)
		for (let i = lines.length - 1; i >= 0 && foundUpdates < 5; i--) {
			const line = lines[i];
			if (!line) continue;

			// Check if this is a date header (### YYYY-MM-DD)
			if (line.match(/^###\s+\d{4}-\d{2}-\d{2}/)) {
				if (currentUpdate.trim()) {
					updates.unshift(line + '\n' + currentUpdate.trim());
					foundUpdates++;
					currentUpdate = '';
				}
			} else if (foundUpdates < 5) {
				currentUpdate = line + '\n' + currentUpdate;
			}
		}

		return updates.length > 0 ? updates.join('\n\n') : undefined;
	}

	private extractProjectSections(content: string): string {
		const sections: string[] = [];

		// Try to find and extract key sections
		const sectionNames = ['## Overview', '## Goals', '## Objectives', '## Status', '## Current Focus', '## Description'];

		for (const sectionName of sectionNames) {
			const section = findSectionByHeader(content, sectionName);
			if (section) {
				const sectionContent = content.slice(section.contentStart, section.end).trim();
				// Limit to first 300 characters to avoid token bloat
				const truncated = sectionContent.length > 300
					? sectionContent.slice(0, 300) + '...'
					: sectionContent;
				if (truncated) {
					sections.push(`${sectionName}\n${truncated}`);
				}
			}
		}

		return sections.join('\n\n');
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

	private extractRelevantContent(dailyNotes: string, project: ProjectMetadata): string {
		const lines = dailyNotes.split('\n');
		const relevantSections: string[] = [];
		const projectName = project.name.toLowerCase();

		// Parse keywords from frontmatter (comma-separated)
		const keywords: string[] = [];
		if (project.update_keywords) {
			const keywordStr = String(project.update_keywords);
			keywords.push(...keywordStr.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0));
		}
		console.log(`Daily Organizer: Searching for project name "${projectName}" and keywords:`, keywords);

		// Look for lines that mention the project name or have project-related keywords
		let currentSection: string[] = [];
		let inRelevantSection = false;
		let contextLinesAfter = 0;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (!line) continue;

			const lineLower = line.toLowerCase();

			// Check if line mentions the project name, tag, or any keywords
			const mentionsProject = lineLower.includes(projectName) ||
			                        line.includes(this.settings.projectTag) ||
			                        keywords.some(kw => lineLower.includes(kw));

			if (mentionsProject) {
				// Start a new relevant section
				inRelevantSection = true;
				contextLinesAfter = 5; // Include 5 lines after mention for context

				// Include a few lines before for context (if available)
				const contextBefore = Math.max(0, i - 3);
				for (let j = contextBefore; j < i; j++) {
					const prevLine = lines[j];
					if (prevLine && !currentSection.includes(prevLine)) {
						currentSection.push(prevLine);
					}
				}
				currentSection.push(line);
			} else if (inRelevantSection) {
				// We're in a relevant section, include the line
				currentSection.push(line);
				contextLinesAfter--;

				// Check if we've reached the end of the section
				if (contextLinesAfter <= 0 || line.trim().length === 0) {
					// End of this relevant section
					if (currentSection.length > 0) {
						relevantSections.push(currentSection.join('\n'));
						currentSection = [];
					}
					inRelevantSection = false;
				}
			}
		}

		// Add any remaining section
		if (currentSection.length > 0) {
			relevantSections.push(currentSection.join('\n'));
		}

		// If no specific mentions found, return empty string (let LLM handle full content)
		if (relevantSections.length === 0) {
			return '';
		}

		// Join all relevant sections with separators
		return relevantSections.join('\n\n---\n\n');
	}

	private async insertUpdateWithDate(project: ProjectMetadata, update: string, dateStr: string): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(project.path);
		if (!(file instanceof TFile)) {
			return;
		}

		const content = await this.app.vault.read(file);

		// Format the update entry
		const updateEntry = `### ${dateStr}\n${update}`;

		// Insert after the tag (user controls positioning by where they place the tag)
		const newContent = insertAfterTag(
			content,
			this.settings.projectUpdateTag,
			updateEntry
		);

		await this.app.vault.modify(file, newContent);
	}
}
