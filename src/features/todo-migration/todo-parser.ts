import type { TodoItem } from '../../types';

export class TodoParser {
	private static readonly TODO_REGEX = /^(\s*)- \[([ xX])\] (.*)$/;
	private static readonly CREATED_REGEX = /\[created::\s*(\d{4}-\d{2}-\d{2})\]/;

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
		// If has no children, check only this task
		if (todo.children.length === 0) {
			return todo.isCompleted;
		}

		// If has children, check if ALL children subtrees are complete
		// Note: Parent's completion status is ignored per requirements
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

			const match = line.match(TodoParser.TODO_REGEX);

			if (match) {
				const indentation = match[1] ?? '';
				const checkbox = match[2] ?? ' ';
				const todoContent = match[3] ?? '';
				const isCompleted = checkbox.toLowerCase() === 'x';
				const createdMatch = todoContent.match(TodoParser.CREATED_REGEX);

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
				});
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
		// Check if already has created metadata
		if (TodoParser.CREATED_REGEX.test(todoContent)) {
			return todoContent;
		}

		// Add metadata at the end, before any trailing tags
		const tagMatch = todoContent.match(/(\s+#\S+)+$/);
		if (tagMatch) {
			const tagsStartIndex = todoContent.length - tagMatch[0].length;
			return (
				todoContent.slice(0, tagsStartIndex) +
				` [created:: ${date}]` +
				todoContent.slice(tagsStartIndex)
			);
		}

		return `${todoContent} [created:: ${date}]`;
	}

	formatTodoLine(todo: TodoItem, newCreatedDate?: string): string {
		const checkbox = todo.isCompleted ? 'x' : ' ';
		let content = todo.content;

		// Add created date if not present and date is provided
		if (newCreatedDate && !todo.createdDate) {
			content = this.addCreatedMetadata(content, newCreatedDate);
		}

		return `${todo.indentation}- [${checkbox}] ${content}`;
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
