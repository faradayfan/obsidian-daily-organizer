import { App, TFile, CachedMetadata } from 'obsidian';
import type { DailyOrganizerSettings } from '../../settings';
import type { ProjectMetadata } from '../../types';

export class ProjectFinder {
	private app: App;
	private settings: DailyOrganizerSettings;

	constructor(app: App, settings: DailyOrganizerSettings) {
		this.app = app;
		this.settings = settings;
	}

	updateSettings(settings: DailyOrganizerSettings): void {
		this.settings = settings;
	}

	async findProjects(): Promise<ProjectMetadata[]> {
		const projects: ProjectMetadata[] = [];
		const files = this.app.vault.getMarkdownFiles();

		for (const file of files) {
			const cache = this.app.metadataCache.getFileCache(file);

			if (this.hasProjectTag(cache)) {
				const metadata = await this.extractMetadata(file, cache);
				projects.push(metadata);
			}
		}

		return projects;
	}

	private hasProjectTag(cache: CachedMetadata | null): boolean {
		if (!cache) {
			return false;
		}

		const targetTag = this.settings.projectTag.replace(/^#/, '');

		// Check frontmatter tags
		if (cache.frontmatter?.tags) {
			const tags = Array.isArray(cache.frontmatter.tags)
				? cache.frontmatter.tags
				: [cache.frontmatter.tags];

			if (tags.some(t => this.normalizeTag(t) === targetTag)) {
				return true;
			}
		}

		// Check inline tags
		if (cache.tags) {
			if (cache.tags.some(t => this.normalizeTag(t.tag) === targetTag)) {
				return true;
			}
		}

		return false;
	}

	private normalizeTag(tag: string): string {
		return tag.replace(/^#/, '').toLowerCase();
	}

	private async extractMetadata(
		file: TFile,
		cache: CachedMetadata | null
	): Promise<ProjectMetadata> {
		const frontmatter = cache?.frontmatter ?? {};

		return {
			path: file.path,
			name: file.basename,
			goals: this.extractStringField(frontmatter, 'goals'),
			status: this.extractStringField(frontmatter, 'status'),
			description: this.extractStringField(frontmatter, 'description'),
			...frontmatter,
		};
	}

	private extractStringField(
		frontmatter: Record<string, unknown>,
		field: string
	): string | undefined {
		const value = frontmatter[field];

		if (typeof value === 'string') {
			return value;
		}

		if (Array.isArray(value)) {
			return value.join(', ');
		}

		return undefined;
	}

	async getProjectContent(project: ProjectMetadata): Promise<string> {
		const file = this.app.vault.getAbstractFileByPath(project.path);
		if (file instanceof TFile) {
			return this.app.vault.read(file);
		}
		return '';
	}
}
