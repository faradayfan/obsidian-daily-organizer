export interface TodoItem {
	line: number;
	content: string;
	isCompleted: boolean;
	createdDate: string | null;
	rawLine: string;
	indentation: string;
	indentLevel: number;
	children: TodoItem[];
	parent: TodoItem | null;
	isCheckbox: boolean; // true for checkbox items, false for plain bullets
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
	update_focus?: string; // Optional: What to emphasize in updates (e.g., "technical progress, blockers")
	update_keywords?: string; // Optional: Additional keywords to watch for (comma-separated)
	update_style?: string; // Optional: Style guide for updates (e.g., "technical, detailed" or "high-level, business-focused")
	[key: string]: unknown;
}

export interface LLMResponse {
	content: string;
	tokensUsed?: number;
	error?: string;
}
