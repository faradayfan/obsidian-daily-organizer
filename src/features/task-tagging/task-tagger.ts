import { App, MarkdownView, Notice } from 'obsidian';
import type { DailyOrganizerSettings } from '../../settings';
import type { ProjectMetadata } from '../../types';
import { ProjectFinder } from '../project-updates/project-finder';

export interface ProjectKeywordMap {
	tag: string;
	projectName: string;
	keywords: string[];
}

const TASK_REGEX = /^(\s*- \[[ xX]\] )(.*)/;
const LIST_ITEM_REGEX = /^(\s*)- (?:\[[ xX]\] )?(.*)/;
const HEADER_REGEX = /^(#{1,6})\s+(.*)/;

export class TaskTagger {
	private app: App;
	private settings: DailyOrganizerSettings;
	private projectFinder: ProjectFinder;

	constructor(app: App, settings: DailyOrganizerSettings, projectFinder: ProjectFinder) {
		this.app = app;
		this.settings = settings;
		this.projectFinder = projectFinder;
	}

	updateSettings(settings: DailyOrganizerSettings): void {
		this.settings = settings;
	}

	async tagTasksInActiveFile(): Promise<void> {
		if (!this.settings.taskTaggingEnabled) {
			new Notice('Task tagging is disabled. Enable it in settings.');
			return;
		}

		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view || !view.file) {
			new Notice('No active markdown file.');
			return;
		}

		const projects = await this.projectFinder.findProjects();
		if (projects.length === 0) {
			new Notice(`No projects found with ${this.settings.projectTag} tag.`);
			return;
		}

		const projectMaps = TaskTagger.buildProjectKeywordMaps(projects);
		const content = await this.app.vault.read(view.file);
		const excludeTags = [this.settings.todoSectionTag, this.settings.ignoreProjectTaggingTag];
		const { newContent, taggedCount } = TaskTagger.processFileContent(content, projectMaps, excludeTags);

		if (taggedCount > 0) {
			await this.app.vault.modify(view.file, newContent);
			new Notice(`Tagged ${taggedCount} item(s) with project tags.`);
		} else {
			new Notice('No tasks or sections matched any project keywords.');
		}
	}

	static toKebabCaseTag(name: string): string {
		const kebab = name
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
		return `#${kebab}`;
	}

	static buildProjectKeywordMaps(projects: ProjectMetadata[]): ProjectKeywordMap[] {
		return projects.map(project => {
			const keywords: string[] = [project.name.toLowerCase()];

			if (project.update_keywords) {
				// Handle both array and comma-separated string formats
				const keywordList = Array.isArray(project.update_keywords)
					? project.update_keywords
					: String(project.update_keywords).split(',');

				const parsed = keywordList
					.map(k => k.trim().toLowerCase())
					.filter(k => k.length > 0);
				keywords.push(...parsed);
			}

			return {
				tag: TaskTagger.toKebabCaseTag(project.name),
				projectName: project.name,
				keywords,
			};
		});
	}

	static findMatchingTags(taskText: string, projectMaps: ProjectKeywordMap[]): string[] {
		const textLower = taskText.toLowerCase();
		const matchingTags: string[] = [];

		for (const map of projectMaps) {
			for (const keyword of map.keywords) {
				if (textLower.includes(keyword)) {
					matchingTags.push(map.tag);
					break;
				}
			}
		}

		return matchingTags;
	}

	static hasTag(content: string, tag: string): boolean {
		const idx = content.indexOf(tag);
		if (idx === -1) return false;
		const charAfter = content[idx + tag.length];
		return !charAfter || charAfter === ' ' || charAfter === '\t' || charAfter === '[';
	}

	static appendTagsToTaskLine(line: string, tags: string[]): string {
		const match = line.match(TASK_REGEX);
		if (!match) return line;

		const prefix = match[1] as string;
		let content = match[2] as string;

		const tagsToAdd = tags.filter(tag => !TaskTagger.hasTag(content, tag));
		if (tagsToAdd.length === 0) return line;

		const metadataMatch = content.match(/\[\w+::\s*[^\]]*\]/);

		if (metadataMatch && metadataMatch.index !== undefined) {
			const beforeMeta = content.slice(0, metadataMatch.index).trimEnd();
			const metaAndAfter = content.slice(metadataMatch.index);
			content = beforeMeta + ' ' + tagsToAdd.join(' ') + ' ' + metaAndAfter;
		} else {
			content = content.trimEnd() + ' ' + tagsToAdd.join(' ');
		}

		return prefix + content;
	}

	static appendTagsToHeaderLine(line: string, tags: string[]): string {
		const match = line.match(HEADER_REGEX);
		if (!match) return line;

		const tagsToAdd = tags.filter(tag => !TaskTagger.hasTag(line, tag));
		if (tagsToAdd.length === 0) return line;

		return line.trimEnd() + ' ' + tagsToAdd.join(' ');
	}

	static tagSectionHeaders(lines: string[], projectMaps: ProjectKeywordMap[], excludeTags: string[] = []): { newLines: string[]; taggedCount: number } {
		const newLines = [...lines];
		let taggedCount = 0;

		// Collect all headers with their line indices and levels
		const headers: { lineIndex: number; level: number }[] = [];
		for (let i = 0; i < lines.length; i++) {
			const match = lines[i]?.match(HEADER_REGEX);
			if (match) {
				headers.push({ lineIndex: i, level: (match[1] as string).length });
			}
		}

		for (let h = 0; h < headers.length; h++) {
			const header = headers[h] as { lineIndex: number; level: number };
			const contentStart = header.lineIndex + 1;

			// Find section end: next header of any level (direct content only)
			const nextHeader = headers[h + 1];
			const contentEnd = nextHeader ? nextHeader.lineIndex : lines.length;

			const headerLine = lines[header.lineIndex] as string;

			// Skip headers that contain any excluded tag
			if (excludeTags.some(tag => headerLine.includes(tag))) continue;

			// Combine header text + section body for keyword matching
			const headerMatch = headerLine.match(HEADER_REGEX);
			const headerText = headerMatch ? (headerMatch[2] as string) : '';
			const bodyText = lines.slice(contentStart, contentEnd).join(' ');
			const combinedText = headerText + ' ' + bodyText;

			const matchingTags = TaskTagger.findMatchingTags(combinedText, projectMaps);
			if (matchingTags.length > 0) {
				const currentLine = newLines[header.lineIndex] as string;
				const newLine = TaskTagger.appendTagsToHeaderLine(currentLine, matchingTags);
				if (newLine !== currentLine) {
					newLines[header.lineIndex] = newLine;
					taggedCount++;
				}
			}
		}

		return { newLines, taggedCount };
	}

	/**
	 * Collect the text from a root task and all its indented children
	 * (checkboxes and plain bullets). Returns the combined text and
	 * the index of the last child line.
	 */
	static collectSubtreeText(lines: string[], rootIndex: number): { combinedText: string; endIndex: number } {
		const line = lines[rootIndex];
		if (!line) return { combinedText: '', endIndex: rootIndex };
		const rootMatch = line.match(LIST_ITEM_REGEX);
		if (!rootMatch) return { combinedText: '', endIndex: rootIndex };

		const rootIndent = (rootMatch[1] as string).length;
		const textParts: string[] = [rootMatch[2] as string];
		let endIndex = rootIndex;

		for (let i = rootIndex + 1; i < lines.length; i++) {
			const childLine = lines[i];
			if (!childLine) break;
			const childMatch = childLine.match(LIST_ITEM_REGEX);
			if (!childMatch) break;
			if ((childMatch[1] as string).length <= rootIndent) break;
			textParts.push(childMatch[2] as string);
			endIndex = i;
		}

		return { combinedText: textParts.join(' '), endIndex };
	}

	static processFileContent(content: string, projectMaps: ProjectKeywordMap[], excludeTags: string[] = []): { newContent: string; taggedCount: number } {
		const lines = content.split('\n');
		let taggedCount = 0;
		const newLines = [...lines];

		let i = 0;
		while (i < lines.length) {
			const line = lines[i] as string;
			const taskMatch = line.match(TASK_REGEX);
			// Only process root-level checkbox tasks (no leading whitespace)
			if (!taskMatch || (taskMatch[1] as string).trimStart() !== taskMatch[1]) {
				i++;
				continue;
			}

			const { combinedText, endIndex } = TaskTagger.collectSubtreeText(lines, i);
			const matchingTags = TaskTagger.findMatchingTags(combinedText, projectMaps);

			if (matchingTags.length > 0) {
				const newLine = TaskTagger.appendTagsToTaskLine(line, matchingTags);
				if (newLine !== line) {
					newLines[i] = newLine;
					taggedCount++;
				}
			}

			i = endIndex + 1;
		}

		// Pass 2: Tag section headers
		const headerResult = TaskTagger.tagSectionHeaders(newLines, projectMaps, excludeTags);
		for (let j = 0; j < headerResult.newLines.length; j++) {
			newLines[j] = headerResult.newLines[j] as string;
		}
		taggedCount += headerResult.taggedCount;

		return {
			newContent: newLines.join('\n'),
			taggedCount,
		};
	}
}
