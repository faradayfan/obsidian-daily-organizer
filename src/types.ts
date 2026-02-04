export interface TodoItem {
	line: number;
	content: string;
	isCompleted: boolean;
	createdDate: string | null;
	rawLine: string;
	indentation: string;
}

export interface FileChange {
	path: string;
	mtime: number;
	basename: string;
}

export interface ProjectMetadata {
	path: string;
	name: string;
	goals?: string;
	status?: string;
	description?: string;
	[key: string]: unknown;
}

export interface LLMResponse {
	content: string;
	tokensUsed?: number;
	error?: string;
}
