import type { TodoItem } from '../../types';
import { escapeRegex } from '../task-metadata/completion-date';

export interface CreatedDateConfig {
	enabled: boolean;
	fieldName: string;
	useShorthand: boolean;
}

export class TodoParser {
	private static readonly TODO_REGEX = /^(\s*)- \[([ xX])\] (.*)$/;
	private static readonly BULLET_REGEX = /^(\s*)- (.*)$/;
	private static readonly SHORTHAND_CREATED_REGEX = /➕(\d{4}-\d{2}-\d{2})/;

	private createdDateConfig: CreatedDateConfig;
	private createdInlineRegex: RegExp;

	constructor(createdDateConfig?: CreatedDateConfig) {
		this.createdDateConfig = createdDateConfig ?? {
			enabled: true,
			fieldName: 'created',
			useShorthand: false,
		};
		this.createdInlineRegex = new RegExp(
			`\\[${escapeRegex(this.createdDateConfig.fieldName)}::\\s*(\\d{4}-\\d{2}-\\d{2})\\]`
		);
	}

	private buildTaskTree(todos: TodoItem[]): TodoItem[] {
		const roots: TodoItem[] = [];
		const stack: TodoItem[] = [];

		for (const todo of todos) {
			// Pop stack while current level is <= top level
			while (stack.length > 0) {
				const top = stack[stack.length - 1];
				if (top && todo.indentLevel <= top.indentLevel) {
					stack.pop();
				} else {
					break;
				}
			}

			if (stack.length === 0) {
				// Root level task
				roots.push(todo);
			} else {
				// Child task
				const parent = stack[stack.length - 1];
				if (parent) {
					todo.parent = parent;
					parent.children.push(todo);
				}
			}

			stack.push(todo);
		}

		return roots;
	}

	private isSubtreeComplete(todo: TodoItem): boolean {
		// Plain bullets (non-checkbox items) are always considered complete
		// They're just notes/details and don't affect the subtree completion status
		if (!todo.isCheckbox) {
			// Still check children recursively in case there are nested checkboxes
			return todo.children.every(child => this.isSubtreeComplete(child));
		}

		// For checkbox items, check completion status
		// If this checkbox is incomplete, entire subtree is incomplete
		if (!todo.isCompleted) {
			return false;
		}

		// If this checkbox is complete, check if all checkbox children are also complete
		// (plain bullet children are skipped as they're always considered complete)
		return todo.children.every(child => this.isSubtreeComplete(child));
	}

	private flattenTree(todo: TodoItem): TodoItem[] {
		const result: TodoItem[] = [todo];
		for (const child of todo.children) {
			result.push(...this.flattenTree(child));
		}
		return result;
	}

	parseTodos(content: string): TodoItem[] {
		const lines = content.split('\n');
		const todos: TodoItem[] = [];
		let detectedIndentSize: number | null = null;

		// Phase 1: Parse and detect indent size
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (!line) continue;

			// Try to match checkbox first
			const todoMatch = line.match(TodoParser.TODO_REGEX);

			if (todoMatch) {
				const indentation = todoMatch[1] ?? '';
				const checkbox = todoMatch[2] ?? ' ';
				const todoContent = todoMatch[3] ?? '';
				const isCompleted = checkbox.toLowerCase() === 'x';
				const createdMatch = todoContent.match(this.createdInlineRegex)
					|| todoContent.match(TodoParser.SHORTHAND_CREATED_REGEX);

				// Detect indent size from first indented task
				if (detectedIndentSize === null && indentation.length > 0) {
					detectedIndentSize = indentation.length;
				}

				todos.push({
					line: i,
					content: todoContent,
					isCompleted,
					createdDate: createdMatch?.[1] ?? null,
					rawLine: line,
					indentation: indentation,
					indentLevel: 0, // Will be calculated next
					children: [],
					parent: null,
					isCheckbox: true,
				});
			} else {
				// Try to match plain bullet
				const bulletMatch = line.match(TodoParser.BULLET_REGEX);

				if (bulletMatch) {
					const indentation = bulletMatch[1] ?? '';
					const bulletContent = bulletMatch[2] ?? '';

					// Only include bullets that are indented (children of todos)
					if (indentation.length > 0) {
						// Detect indent size from first indented item
						if (detectedIndentSize === null) {
							detectedIndentSize = indentation.length;
						}

						todos.push({
							line: i,
							content: bulletContent,
							isCompleted: false, // Plain bullets are treated as incomplete
							createdDate: null,
							rawLine: line,
							indentation: indentation,
							indentLevel: 0, // Will be calculated next
							children: [],
							parent: null,
							isCheckbox: false,
						});
					}
				}
			}
		}

		// Phase 2: Calculate indent levels
		const indentSize = detectedIndentSize ?? 2; // Default to 2 spaces
		for (const todo of todos) {
			todo.indentLevel = Math.round(todo.indentation.length / indentSize);
		}

		// Phase 3: Build tree structure
		return this.buildTaskTree(todos);
	}

	parseUncompletedTodos(content: string): TodoItem[] {
		const roots = this.parseTodos(content);
		const toMigrate: TodoItem[] = [];

		// Collect roots of incomplete subtrees
		for (const root of roots) {
			if (!this.isSubtreeComplete(root)) {
				toMigrate.push(root);
			}
		}

		return toMigrate;
	}

	addCreatedMetadata(todoContent: string, date: string): string {
		// Check if already has created metadata (both inline and shorthand formats)
		if (this.createdInlineRegex.test(todoContent)) {
			return todoContent;
		}
		if (TodoParser.SHORTHAND_CREATED_REGEX.test(todoContent)) {
			return todoContent;
		}

		// Add metadata at the end, before any trailing tags
		const tagMatch = todoContent.match(/(\s+#\S+)+$/);
		const metadata = this.createdDateConfig.useShorthand
			? ` ➕${date}`
			: ` [${this.createdDateConfig.fieldName}:: ${date}]`;

		if (tagMatch) {
			const tagsStartIndex = todoContent.length - tagMatch[0].length;
			return (
				todoContent.slice(0, tagsStartIndex) +
				metadata +
				todoContent.slice(tagsStartIndex)
			);
		}

		return `${todoContent}${metadata}`;
	}

	stripCreatedMetadata(todoContent: string): string {
		return todoContent
			.replace(this.createdInlineRegex, '')
			.replace(TodoParser.SHORTHAND_CREATED_REGEX, '')
			.trim();
	}

	formatTodoLine(todo: TodoItem, newCreatedDate?: string): string {
		let content = todo.content;

		// Add created date if not present, date is provided, and feature is enabled (only for checkbox items)
		if (this.createdDateConfig.enabled && todo.isCheckbox && newCreatedDate && !todo.createdDate) {
			content = this.addCreatedMetadata(content, newCreatedDate);
		}

		// Format as checkbox or plain bullet
		if (todo.isCheckbox) {
			const checkbox = todo.isCompleted ? 'x' : ' ';
			return `${todo.indentation}- [${checkbox}] ${content}`;
		} else {
			return `${todo.indentation}- ${content}`;
		}
	}

	formatTodosForSection(todos: TodoItem[], createdDate: string): string {
		// Flatten all subtrees
		const allTodos: TodoItem[] = [];
		for (const root of todos) {
			allTodos.push(...this.flattenTree(root));
		}

		// Sort by line number to preserve order
		allTodos.sort((a, b) => a.line - b.line);

		return allTodos
			.map(todo => this.formatTodoLine(todo, todo.createdDate ?? createdDate))
			.join('\n');
	}

	removeTodosFromContent(content: string, todosToRemove: TodoItem[]): string {
		// Flatten all subtrees to get ALL line numbers to remove
		const allTodos: TodoItem[] = [];
		for (const root of todosToRemove) {
			allTodos.push(...this.flattenTree(root));
		}

		const lines = content.split('\n');
		const linesToRemove = new Set(allTodos.map(t => t.line));

		return lines
			.filter((_, index) => !linesToRemove.has(index))
			.join('\n');
	}
}
