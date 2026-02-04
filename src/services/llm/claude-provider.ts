import { requestUrl } from 'obsidian';
import type { LLMResponse } from '../../types';
import type { LLMProvider, LLMProviderConfig } from './types';

interface ClaudeMessage {
	role: 'user' | 'assistant';
	content: string;
}

interface ClaudeRequest {
	model: string;
	max_tokens: number;
	system?: string;
	messages: ClaudeMessage[];
}

interface ClaudeResponseContent {
	type: string;
	text?: string;
}

interface ClaudeResponse {
	id: string;
	type: string;
	role: string;
	content: ClaudeResponseContent[];
	model: string;
	stop_reason: string;
	usage: {
		input_tokens: number;
		output_tokens: number;
	};
}

interface ClaudeErrorResponse {
	type: string;
	error: {
		type: string;
		message: string;
	};
}

export class ClaudeProvider implements LLMProvider {
	readonly name = 'claude';
	private config: LLMProviderConfig;

	constructor(config: LLMProviderConfig) {
		this.config = config;
	}

	isConfigured(): boolean {
		return Boolean(this.config.apiKey && this.config.apiKey.length > 0);
	}

	async complete(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
		if (!this.isConfigured()) {
			return {
				content: '',
				error: 'Claude API key is not configured',
			};
		}

		const requestBody: ClaudeRequest = {
			model: this.config.model,
			max_tokens: this.config.maxTokens ?? 1024,
			messages: [{ role: 'user', content: prompt }],
		};

		if (systemPrompt) {
			requestBody.system = systemPrompt;
		}

		try {
			const response = await requestUrl({
				url: 'https://api.anthropic.com/v1/messages',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': this.config.apiKey,
					'anthropic-version': '2023-06-01',
				},
				body: JSON.stringify(requestBody),
			});

			if (response.status !== 200) {
				const errorResponse = response.json as ClaudeErrorResponse;
				return {
					content: '',
					error: `Claude API error: ${errorResponse.error?.message ?? 'Unknown error'}`,
				};
			}

			const data = response.json as ClaudeResponse;
			const textContent = data.content.find(c => c.type === 'text');

			return {
				content: textContent?.text ?? '',
				tokensUsed: data.usage.input_tokens + data.usage.output_tokens,
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return {
				content: '',
				error: `Failed to call Claude API: ${errorMessage}`,
			};
		}
	}
}
