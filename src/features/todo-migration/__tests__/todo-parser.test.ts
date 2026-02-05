import { TodoParser } from '../todo-parser';
import type { TodoItem } from '../../../types';

describe('TodoParser', () => {
	let parser: TodoParser;

	beforeEach(() => {
		parser = new TodoParser();
	});

	describe('parseTodos()', () => {
		it('should parse a simple flat todo list', () => {
			const content = `- [ ] Task 1
- [x] Task 2
- [ ] Task 3`;

			const todos = parser.parseTodos(content);

			expect(todos).toHaveLength(3);
			expect(todos[0].content).toBe('Task 1');
			expect(todos[0].isCompleted).toBe(false);
			expect(todos[0].indentLevel).toBe(0);
			expect(todos[0].children).toHaveLength(0);
			expect(todos[1].isCompleted).toBe(true);
		});

		it('should parse nested todos with 2-space indentation', () => {
			const content = `- [ ] Parent task
  - [ ] Child task 1
  - [x] Child task 2`;

			const todos = parser.parseTodos(content);

			expect(todos).toHaveLength(1); // Only root returned
			expect(todos[0].content).toBe('Parent task');
			expect(todos[0].children).toHaveLength(2);
			expect(todos[0].children[0].content).toBe('Child task 1');
			expect(todos[0].children[0].indentLevel).toBe(1);
			expect(todos[0].children[1].content).toBe('Child task 2');
			expect(todos[0].children[1].isCompleted).toBe(true);
		});

		it('should parse deeply nested todos', () => {
			const content = `- [ ] Level 0
  - [ ] Level 1
    - [ ] Level 2
      - [x] Level 3`;

			const todos = parser.parseTodos(content);

			expect(todos).toHaveLength(1);
			expect(todos[0].children).toHaveLength(1);
			expect(todos[0].children[0].children).toHaveLength(1);
			expect(todos[0].children[0].children[0].children).toHaveLength(1);
			expect(todos[0].children[0].children[0].children[0].content).toBe('Level 3');
			expect(todos[0].children[0].children[0].children[0].indentLevel).toBe(3);
		});

		it('should parse multiple root-level todos with their own hierarchies', () => {
			const content = `- [ ] Root 1
  - [ ] Child 1.1
- [ ] Root 2
  - [x] Child 2.1
  - [ ] Child 2.2`;

			const todos = parser.parseTodos(content);

			expect(todos).toHaveLength(2);
			expect(todos[0].children).toHaveLength(1);
			expect(todos[1].children).toHaveLength(2);
		});

		it('should parse todos with 4-space indentation', () => {
			const content = `- [ ] Parent
    - [ ] Child`;

			const todos = parser.parseTodos(content);

			expect(todos).toHaveLength(1);
			expect(todos[0].children).toHaveLength(1);
			expect(todos[0].children[0].indentLevel).toBe(1);
		});

		it('should handle mixed content with todos', () => {
			const content = `Some text
- [ ] Task 1
More text
- [ ] Task 2
  - [ ] Subtask`;

			const todos = parser.parseTodos(content);

			expect(todos).toHaveLength(2);
			expect(todos[1].children).toHaveLength(1);
		});

		it('should parse created date metadata', () => {
			const content = `- [ ] Task with date [created:: 2024-02-01]`;

			const todos = parser.parseTodos(content);

			expect(todos[0].createdDate).toBe('2024-02-01');
			expect(todos[0].content).toContain('[created:: 2024-02-01]');
		});

		it('should set parent references correctly', () => {
			const content = `- [ ] Parent
  - [ ] Child`;

			const todos = parser.parseTodos(content);

			expect(todos[0].parent).toBeNull();
			expect(todos[0].children[0].parent).toBe(todos[0]);
		});

		it('should handle empty lines', () => {
			const content = `- [ ] Task 1

- [ ] Task 2`;

			const todos = parser.parseTodos(content);

			expect(todos).toHaveLength(2);
		});

		it('should ignore non-todo lines', () => {
			const content = `- Regular bullet point
- [ ] Todo item
- Another bullet`;

			const todos = parser.parseTodos(content);

			expect(todos).toHaveLength(1);
			expect(todos[0].content).toBe('Todo item');
		});
	});

	describe('parseUncompletedTodos()', () => {
		it('should return only root todos with incomplete subtasks', () => {
			const content = `- [ ] Parent 1
  - [x] Child complete
  - [ ] Child incomplete
- [x] Parent 2
  - [x] Child complete`;

			const todos = parser.parseUncompletedTodos(content);

			expect(todos).toHaveLength(1);
			expect(todos[0].content).toBe('Parent 1');
		});

		it('should not return completed subtrees', () => {
			const content = `- [x] Parent completed
  - [x] Child 1 completed
  - [x] Child 2 completed`;

			const todos = parser.parseUncompletedTodos(content);

			expect(todos).toHaveLength(0);
		});

		it('should return parent even if parent is complete but child is incomplete', () => {
			const content = `- [x] Parent completed
  - [ ] Child incomplete`;

			const todos = parser.parseUncompletedTodos(content);

			expect(todos).toHaveLength(1);
			expect(todos[0].content).toBe('Parent completed');
		});

		it('should return deeply nested incomplete subtrees', () => {
			const content = `- [ ] Level 0
  - [x] Level 1
    - [ ] Level 2 incomplete`;

			const todos = parser.parseUncompletedTodos(content);

			expect(todos).toHaveLength(1);
			expect(todos[0].content).toBe('Level 0');
		});

		it('should return multiple incomplete subtrees', () => {
			const content = `- [ ] Root 1
  - [ ] Child incomplete
- [ ] Root 2
  - [ ] Child incomplete
- [x] Root 3
  - [x] Child complete`;

			const todos = parser.parseUncompletedTodos(content);

			expect(todos).toHaveLength(2);
			expect(todos[0].content).toBe('Root 1');
			expect(todos[1].content).toBe('Root 2');
		});

		it('should handle flat incomplete todos', () => {
			const content = `- [ ] Task 1
- [x] Task 2
- [ ] Task 3`;

			const todos = parser.parseUncompletedTodos(content);

			expect(todos).toHaveLength(2);
			expect(todos[0].content).toBe('Task 1');
			expect(todos[1].content).toBe('Task 3');
		});
	});

	describe('formatTodosForSection()', () => {
		it('should format flat todos', () => {
			const content = `- [ ] Task 1
- [ ] Task 2`;

			const todos = parser.parseUncompletedTodos(content);
			const formatted = parser.formatTodosForSection(todos, '2024-02-04');

			expect(formatted).toContain('- [ ] Task 1');
			expect(formatted).toContain('- [ ] Task 2');
		});

		it('should preserve indentation in formatted todos', () => {
			const content = `- [ ] Parent
  - [ ] Child`;

			const todos = parser.parseUncompletedTodos(content);
			const formatted = parser.formatTodosForSection(todos, '2024-02-04');

			const lines = formatted.split('\n');
			expect(lines[0]).toBe('- [ ] Parent [created:: 2024-02-04]');
			expect(lines[1]).toBe('  - [ ] Child [created:: 2024-02-04]');
		});

		it('should add created date to todos without one', () => {
			const content = `- [ ] Task without date`;

			const todos = parser.parseUncompletedTodos(content);
			const formatted = parser.formatTodosForSection(todos, '2024-02-04');

			expect(formatted).toContain('[created:: 2024-02-04]');
		});

		it('should preserve existing created dates', () => {
			const content = `- [ ] Task with date [created:: 2024-01-01]`;

			const todos = parser.parseUncompletedTodos(content);
			const formatted = parser.formatTodosForSection(todos, '2024-02-04');

			expect(formatted).toContain('[created:: 2024-01-01]');
			expect(formatted).not.toContain('[created:: 2024-02-04]');
		});

		it('should format entire subtrees', () => {
			const content = `- [ ] Parent
  - [x] Child 1
  - [ ] Child 2`;

			const todos = parser.parseUncompletedTodos(content);
			const formatted = parser.formatTodosForSection(todos, '2024-02-04');

			const lines = formatted.split('\n');
			expect(lines).toHaveLength(3);
			expect(lines[0]).toContain('Parent');
			expect(lines[1]).toContain('Child 1');
			expect(lines[2]).toContain('Child 2');
		});

		it('should preserve order by line number', () => {
			const content = `- [ ] Task A
  - [ ] Task B
- [ ] Task C`;

			const todos = parser.parseUncompletedTodos(content);
			const formatted = parser.formatTodosForSection(todos, '2024-02-04');

			const lines = formatted.split('\n');
			expect(lines[0]).toContain('Task A');
			expect(lines[1]).toContain('Task B');
			expect(lines[2]).toContain('Task C');
		});
	});

	describe('removeTodosFromContent()', () => {
		it('should remove flat todos', () => {
			const content = `- [ ] Task 1
- [ ] Task 2
- [ ] Task 3`;

			const todos = parser.parseTodos(content);
			const toRemove = [todos[0], todos[2]];
			const result = parser.removeTodosFromContent(content, toRemove);

			expect(result).not.toContain('Task 1');
			expect(result).toContain('Task 2');
			expect(result).not.toContain('Task 3');
		});

		it('should remove entire subtrees atomically', () => {
			const content = `- [ ] Parent
  - [ ] Child 1
  - [ ] Child 2
- [ ] Keep this`;

			const todos = parser.parseTodos(content);
			const toRemove = [todos[0]]; // Remove parent
			const result = parser.removeTodosFromContent(content, toRemove);

			expect(result).not.toContain('Parent');
			expect(result).not.toContain('Child 1');
			expect(result).not.toContain('Child 2');
			expect(result).toContain('Keep this');
		});

		it('should remove deeply nested subtrees', () => {
			const content = `- [ ] Root
  - [ ] Level 1
    - [ ] Level 2
      - [ ] Level 3
- [ ] Keep`;

			const todos = parser.parseTodos(content);
			const toRemove = [todos[0]];
			const result = parser.removeTodosFromContent(content, toRemove);

			expect(result).not.toContain('Root');
			expect(result).not.toContain('Level 1');
			expect(result).not.toContain('Level 2');
			expect(result).not.toContain('Level 3');
			expect(result).toContain('Keep');
		});

		it('should preserve non-todo content', () => {
			const content = `# Header
Some text
- [ ] Task
More text`;

			const todos = parser.parseTodos(content);
			const result = parser.removeTodosFromContent(content, todos);

			expect(result).toContain('# Header');
			expect(result).toContain('Some text');
			expect(result).toContain('More text');
			expect(result).not.toContain('Task');
		});

		it('should handle removing multiple separate subtrees', () => {
			const content = `- [ ] Root 1
  - [ ] Child 1
- [ ] Root 2
  - [ ] Child 2
- [ ] Keep`;

			const todos = parser.parseTodos(content);
			const toRemove = [todos[0], todos[1]];
			const result = parser.removeTodosFromContent(content, toRemove);

			expect(result).not.toContain('Root 1');
			expect(result).not.toContain('Child 1');
			expect(result).not.toContain('Root 2');
			expect(result).not.toContain('Child 2');
			expect(result).toContain('Keep');
		});
	});

	describe('addCreatedMetadata()', () => {
		it('should add created metadata to todo without date', () => {
			const content = 'Task without date';
			const result = parser.addCreatedMetadata(content, '2024-02-04');

			expect(result).toBe('Task without date [created:: 2024-02-04]');
		});

		it('should not add metadata if already present', () => {
			const content = 'Task with date [created:: 2024-01-01]';
			const result = parser.addCreatedMetadata(content, '2024-02-04');

			expect(result).toBe(content);
			expect(result).toContain('2024-01-01');
			expect(result).not.toContain('2024-02-04');
		});

		it('should add metadata before tags', () => {
			const content = 'Task with tags #tag1 #tag2';
			const result = parser.addCreatedMetadata(content, '2024-02-04');

			expect(result).toBe('Task with tags [created:: 2024-02-04] #tag1 #tag2');
		});
	});

	describe('formatTodoLine()', () => {
		it('should format incomplete todo', () => {
			const todo: TodoItem = {
				line: 0,
				content: 'Task',
				isCompleted: false,
				createdDate: null,
				rawLine: '- [ ] Task',
				indentation: '',
				indentLevel: 0,
				children: [],
				parent: null,
			};

			const result = parser.formatTodoLine(todo);

			expect(result).toBe('- [ ] Task');
		});

		it('should format completed todo', () => {
			const todo: TodoItem = {
				line: 0,
				content: 'Task',
				isCompleted: true,
				createdDate: null,
				rawLine: '- [x] Task',
				indentation: '',
				indentLevel: 0,
				children: [],
				parent: null,
			};

			const result = parser.formatTodoLine(todo);

			expect(result).toBe('- [x] Task');
		});

		it('should preserve indentation', () => {
			const todo: TodoItem = {
				line: 0,
				content: 'Task',
				isCompleted: false,
				createdDate: null,
				rawLine: '  - [ ] Task',
				indentation: '  ',
				indentLevel: 1,
				children: [],
				parent: null,
			};

			const result = parser.formatTodoLine(todo);

			expect(result).toBe('  - [ ] Task');
		});

		it('should add created date when provided', () => {
			const todo: TodoItem = {
				line: 0,
				content: 'Task',
				isCompleted: false,
				createdDate: null,
				rawLine: '- [ ] Task',
				indentation: '',
				indentLevel: 0,
				children: [],
				parent: null,
			};

			const result = parser.formatTodoLine(todo, '2024-02-04');

			expect(result).toContain('[created:: 2024-02-04]');
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty content', () => {
			const todos = parser.parseTodos('');

			expect(todos).toHaveLength(0);
		});

		it('should handle content with only non-todo lines', () => {
			const content = `# Header
Some text
- Regular bullet`;

			const todos = parser.parseTodos(content);

			expect(todos).toHaveLength(0);
		});

		it('should handle orphaned indented tasks', () => {
			const content = `  - [ ] Indented without parent
- [ ] Normal task`;

			const todos = parser.parseTodos(content);

			expect(todos).toHaveLength(2); // Both treated as roots
		});

		it('should handle mixed checkbox states (X vs x)', () => {
			const content = `- [x] Lowercase complete
- [X] Uppercase complete
- [ ] Incomplete`;

			const todos = parser.parseTodos(content);

			expect(todos[0].isCompleted).toBe(true);
			expect(todos[1].isCompleted).toBe(true);
			expect(todos[2].isCompleted).toBe(false);
		});

		it('should handle todos with complex content', () => {
			const content = `- [ ] Task with [link](url) and **bold** text`;

			const todos = parser.parseTodos(content);

			expect(todos[0].content).toContain('[link](url)');
			expect(todos[0].content).toContain('**bold**');
		});
	});
});
