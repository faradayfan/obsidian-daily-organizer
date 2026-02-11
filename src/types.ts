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
	tag: string;
	goals?: string;
	status?: string;
	description?: string;
	update_focus?: string | string[]; // Optional: What to emphasize in updates (array or comma-separated string)
	update_keywords?: string | string[]; // Optional: Additional keywords to watch for (array or comma-separated string)
	update_style?: string | string[]; // Optional: Style guide for updates (array or comma-separated string)
	[key: string]: unknown;
}

export interface LLMResponse {
	content: string;
	tokensUsed?: number;
	error?: string;
}
