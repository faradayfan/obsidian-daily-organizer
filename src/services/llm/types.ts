import type { LLMResponse } from '../../types';

export interface LLMProviderConfig {
	apiKey: string;
	model: string;
	maxTokens?: number;
	temperature?: number;
}

export interface LLMProvider {
	readonly name: string;
	isConfigured(): boolean;
	complete(prompt: string, systemPrompt?: string): Promise<LLMResponse>;
}

export interface LLMMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
}
