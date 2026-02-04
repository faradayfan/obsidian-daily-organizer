import type { DailyOrganizerSettings } from '../../settings';
import type { LLMResponse } from '../../types';
import type { LLMProvider } from './types';
import { ClaudeProvider } from './claude-provider';
import { OpenAIProvider } from './openai-provider';

export class LLMService {
	private provider: LLMProvider | null = null;
	private settings: DailyOrganizerSettings;

	constructor(settings: DailyOrganizerSettings) {
		this.settings = settings;
		this.initProvider();
	}

	private initProvider(): void {
		if (this.settings.llmProvider === 'claude') {
			this.provider = new ClaudeProvider({
				apiKey: this.settings.claudeApiKey,
				model: this.settings.claudeModel,
				maxTokens: 2048,
			});
		} else if (this.settings.llmProvider === 'openai') {
			this.provider = new OpenAIProvider({
				apiKey: this.settings.openaiApiKey,
				model: this.settings.openaiModel,
				maxTokens: 2048,
			});
		}
	}

	updateSettings(settings: DailyOrganizerSettings): void {
		this.settings = settings;
		this.initProvider();
	}

	isConfigured(): boolean {
		return this.provider?.isConfigured() ?? false;
	}

	getProviderName(): string {
		return this.provider?.name ?? 'none';
	}

	async complete(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
		if (!this.provider) {
			return {
				content: '',
				error: 'No LLM provider configured',
			};
		}

		if (!this.provider.isConfigured()) {
			return {
				content: '',
				error: `${this.provider.name} API key is not configured. Please add it in settings.`,
			};
		}

		return this.provider.complete(prompt, systemPrompt);
	}

	async summarize(content: string, context?: string): Promise<LLMResponse> {
		const systemPrompt = context
			? `You are a helpful assistant. ${context}`
			: 'You are a helpful assistant that provides concise summaries.';

		const prompt = `Please provide a brief summary of the following content:\n\n${content}`;

		return this.complete(prompt, systemPrompt);
	}

	async analyzeForProject(
		projectContext: string,
		dailyNotes: string,
		existingUpdates?: string
	): Promise<LLMResponse> {
		const systemPrompt = `You are an assistant helping to track project progress.
Based on the project context and daily notes provided, generate a brief progress update.
Focus on relevant accomplishments, tasks completed, and any blockers or notes.
Keep the update concise (2-4 bullet points).`;

		let prompt = `Project Context:\n${projectContext}\n\nToday's Notes:\n${dailyNotes}`;

		if (existingUpdates) {
			prompt += `\n\nPrevious Updates (for context):\n${existingUpdates}`;
		}

		prompt += '\n\nPlease generate a brief progress update for today:';

		return this.complete(prompt, systemPrompt);
	}

	async summarizeDailyChanges(
		fileList: string[],
		fileContents: Map<string, string>
	): Promise<LLMResponse> {
		const systemPrompt = `You are a helpful assistant that summarizes daily note-taking and work activity.
Provide a concise summary (2-4 sentences) of the main activities and themes based on the files modified today.
Focus on the substance of what was worked on, not the file names themselves.`;

		let prompt = `The following ${fileList.length} files were modified today:\n\n`;

		for (const filePath of fileList) {
			const content = fileContents.get(filePath);
			prompt += `## ${filePath}\n`;
			if (content) {
				// Truncate content to avoid token limits
				const truncated = content.length > 500 ? content.slice(0, 500) + '...' : content;
				prompt += truncated;
			} else {
				prompt += '(content not available)';
			}
			prompt += '\n\n';
		}

		prompt += 'Please provide a brief summary of the main activities and themes from these notes:';

		return this.complete(prompt, systemPrompt);
	}

	async summarizeFileChanges(_fileName: string, content: string, diff?: string): Promise<LLMResponse> {
		const systemPrompt = `You are a helpful assistant that identifies what work was done on a note.
Provide a very brief description (1 sentence, max 100 characters) of what was likely added, changed, or worked on.
Focus on the ACTIVITY or CHANGES, not a summary of the whole document.
Look for: new sections, recent dates, incomplete items, draft content, or recently added information.
Do not include the file name. Keep it concise for a table cell.`;

		// If we have a diff, use it; otherwise analyze the content
		if (diff && diff.trim().length > 0) {
			const truncatedDiff = diff.length > 1500 ? diff.slice(0, 1500) + '...' : diff;
			const prompt = `Based on this diff, what changes were made to the file?\n\nDiff:\n${truncatedDiff}`;
			return this.complete(prompt, systemPrompt);
		}

		// Truncate content to avoid token limits
		const truncated = content.length > 1500 ? content.slice(0, 1500) + '...' : content;

		const prompt = `This file was modified today. Based on its content, what work was likely done on it? Look for recent additions, dates, incomplete sections, or new content:\n\n${truncated}`;

		return this.complete(prompt, systemPrompt);
	}
}
