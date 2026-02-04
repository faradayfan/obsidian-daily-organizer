import type { TodoItem } from '../../types';

export class TodoParser {
	private static readonly TODO_REGEX = /^(\s*)- \[([ xX])\] (.*)$/;
	private static readonly CREATED_REGEX = /\[created::\s*(\d{4}-\d{2}-\d{2})\]/;

	parseTodos(content: string): TodoItem[] {
		const lines = content.split('\n');
		const todos: TodoItem[] = [];

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

				todos.push({
					line: i,
					content: todoContent,
					isCompleted,
					createdDate: createdMatch?.[1] ?? null,
					rawLine: line,
					indentation: indentation,
				});
			}
		}

		return todos;
	}

	parseUncompletedTodos(content: string): TodoItem[] {
		return this.parseTodos(content).filter(todo => !todo.isCompleted);
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
		return todos
			.map(todo => this.formatTodoLine(todo, todo.createdDate ?? createdDate))
			.join('\n');
	}

	removeTodosFromContent(content: string, todosToRemove: TodoItem[]): string {
		const lines = content.split('\n');
		const linesToRemove = new Set(todosToRemove.map(t => t.line));

		return lines
			.filter((_, index) => !linesToRemove.has(index))
			.join('\n');
	}
}
