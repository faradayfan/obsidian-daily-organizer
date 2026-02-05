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
Your task is to extract ONLY the information from today's notes that is directly relevant to this specific project.

IMPORTANT RULES:
1. Only include updates that explicitly mention or relate to this project. If unsure, omit it.
2. Ignore unrelated work, personal notes, or other projects
3. If nothing in the daily notes is relevant to this project, respond with "NO_RELEVANT_UPDATES"
4. Use the project context (goals, current focus, status) to determine what is relevant
5. If "Update Focus" is specified, prioritize those aspects in your summary
6. If "Keywords to Watch" are provided, pay special attention to those topics
7. If "Update Style" is specified, match that tone and detail level
8. Match the format and style of previous updates for consistency
9. Keep the update concise (2-4 bullet points unless style guide says otherwise)
10. Focus on: accomplishments, tasks completed, blockers, decisions, or progress made`;

		let prompt = `${projectContext}\n\n`;

		if (existingUpdates) {
			prompt += `## Recent Updates (for style reference and avoiding repetition)\n${existingUpdates}\n\n`;
		}

		prompt += `## Today's Daily Notes (Relevant Sections)\n${dailyNotes}\n\n`;

		prompt += `---

INSTRUCTIONS:
1. Review the project context carefully - understand the project's goals, current focus, and status
2. If update guidance (Update Focus, Keywords, Style) is provided, follow it closely
3. Analyze today's daily notes and identify content relevant to THIS specific project
4. Look at previous updates to match their style, format, and level of detail
5. Extract ONLY information that relates to this project's goals and current work

If nothing in today's notes is relevant to this project, respond with exactly:
NO_RELEVANT_UPDATES

Otherwise, generate a progress update that:
- Matches the style and format of previous updates (bullet points, detail level, technical language)
- Focuses on the areas specified in "Update Focus" (if provided)
- Emphasizes the "Keywords to Watch" (if provided)
- Follows the "Update Style" guidance (if provided)
- Is concise but informative (typically 2-4 bullet points)
- DO NOT include a date header (### YYYY-MM-DD) - this will be added automatically
- Start directly with the bullet points, NOT with a date

IMPORTANT: Your response should be ONLY the bullet points, without any date header.
The date will be added automatically by the system.

Example of CORRECT format:
- Implemented feature X in file.ts
- Fixed bug in component Y
- Added tests achieving 95% coverage

Example of INCORRECT format (DO NOT DO THIS):
### 2026-02-04
- Implemented feature X

Progress update (bullet points only, no date header):`;

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

	async generateProjectKeywords(
		projectName: string,
		projectSections: string
	): Promise<LLMResponse> {
		const systemPrompt = `You are an assistant helping to identify relevant keywords for a project.
Your task is to analyze the project's content (goals, status, overview) and generate a list of keywords that would help identify relevant daily notes.

IMPORTANT RULES:
1. Focus on key terms, technologies, concepts, and action words from the project content
2. Include both specific terms (e.g., "authentication", "API") and general concepts (e.g., "testing", "deployment")
3. Return ONLY a comma-separated list of keywords, nothing else
4. Include 5-15 keywords, ordered by importance
5. Keep keywords lowercase and concise (1-2 words each)
6. Do not include generic words like "project", "work", "task", "update"`;

		const prompt = `Project: ${projectName}

${projectSections}

---

Generate a comma-separated list of keywords that would help identify daily notes relevant to this project.
Return ONLY the keywords, nothing else. Example format: keyword1, keyword2, keyword3`;

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
