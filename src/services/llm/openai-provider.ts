import { requestUrl } from 'obsidian';
import type { LLMResponse } from '../../types';
import type { LLMProvider, LLMProviderConfig, LLMMessage } from './types';

interface OpenAIMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
}

interface OpenAIRequest {
	model: string;
	max_tokens: number;
	messages: OpenAIMessage[];
	temperature?: number;
}

interface OpenAIChoice {
	index: number;
	message: {
		role: string;
		content: string;
	};
	finish_reason: string;
}

interface OpenAIResponse {
	id: string;
	object: string;
	created: number;
	model: string;
	choices: OpenAIChoice[];
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
}

interface OpenAIErrorResponse {
	error: {
		message: string;
		type: string;
		code: string;
	};
}

export class OpenAIProvider implements LLMProvider {
	readonly name = 'openai';
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
				error: 'OpenAI API key is not configured',
			};
		}

		const messages: LLMMessage[] = [];

		if (systemPrompt) {
			messages.push({ role: 'system', content: systemPrompt });
		}
		messages.push({ role: 'user', content: prompt });

		const requestBody: OpenAIRequest = {
			model: this.config.model,
			max_tokens: this.config.maxTokens ?? 1024,
			messages: messages,
			temperature: this.config.temperature ?? 0.7,
		};

		try {
			const response = await requestUrl({
				url: 'https://api.openai.com/v1/chat/completions',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.config.apiKey}`,
				},
				body: JSON.stringify(requestBody),
			});

			if (response.status !== 200) {
				const errorResponse = response.json as OpenAIErrorResponse;
				return {
					content: '',
					error: `OpenAI API error: ${errorResponse.error?.message ?? 'Unknown error'}`,
				};
			}

			const data = response.json as OpenAIResponse;
			const choice = data.choices[0];

			return {
				content: choice?.message?.content ?? '',
				tokensUsed: data.usage.total_tokens,
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return {
				content: '',
				error: `Failed to call OpenAI API: ${errorMessage}`,
			};
		}
	}
}
