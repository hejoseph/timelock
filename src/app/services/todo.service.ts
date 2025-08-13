import { Injectable, signal, computed } from '@angular/core';
import { Todo, FilterType, SortType } from '../models/todo.model';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private readonly STORAGE_KEY = 'awesome-todos';
  
  // Signals for reactive state management
  private todosSignal = signal<Todo[]>([]);
  private filterSignal = signal<FilterType>('all');
  private sortSignal = signal<SortType>('created');
  private searchSignal = signal<string>('');

  // Computed signals for derived state
  todos = this.todosSignal.asReadonly();
  filter = this.filterSignal.asReadonly();
  sort = this.sortSignal.asReadonly();
  search = this.searchSignal.asReadonly();

  filteredTodos = computed(() => {
    let todos = this.todosSignal();
    const filter = this.filterSignal();
    const search = this.searchSignal().toLowerCase();
    const sort = this.sortSignal();

    // Apply search filter
    if (search) {
      todos = todos.filter(todo => 
        this.todoMatchesSearch(todo, search)
      );
    }

    // Apply status filter
    switch (filter) {
      case 'active':
        todos = todos.filter(todo => !todo.completed);
        break;
      case 'completed':
        todos = todos.filter(todo => todo.completed);
        break;
    }

    // Apply sorting
    switch (sort) {
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        todos = todos.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
        break;
      case 'dueDate':
        todos = todos.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
        break;
      case 'alphabetical':
        todos = todos.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'created':
      default:
        todos = todos.sort((a, b) => a.order - b.order);
        break;
    }

    return todos;
  });

  private todoMatchesSearch(todo: Todo, search: string): boolean {
    const matches = todo.title.toLowerCase().includes(search) ||
                   todo.description?.toLowerCase().includes(search) ||
                   todo.category?.toLowerCase().includes(search);
    
    if (matches) return true;
    
    // Check subtasks
    return todo.subtasks.some(subtask => this.todoMatchesSearch(subtask, search));
  }

  stats = computed(() => {
    const todos = this.todosSignal();
    const allTasks = this.flattenTodos(todos);
    return {
      total: allTasks.length,
      completed: allTasks.filter(t => t.completed).length,
      active: allTasks.filter(t => !t.completed).length,
      highPriority: allTasks.filter(t => t.priority === 'high' && !t.completed).length,
      overdue: allTasks.filter(t => 
        t.dueDate && 
        !t.completed && 
        new Date(t.dueDate) < new Date()
      ).length
    };
  });

  private flattenTodos(todos: Todo[]): Todo[] {
    const result: Todo[] = [];
    for (const todo of todos) {
      result.push(todo);
      if (todo.subtasks.length > 0) {
        result.push(...this.flattenTodos(todo.subtasks));
      }
    }
    return result;
  }

  constructor() {
    this.loadTodos();
  }

  addTodo(todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt' | 'subtasks' | 'order'>): void {
    const todos = this.todosSignal();
    const maxOrder = Math.max(0, ...todos.map(t => t.order));
    
    const newTodo: Todo = {
      ...todoData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      subtasks: [],
      isExpanded: false,
      order: maxOrder + 1
    };

    this.todosSignal.update(todos => [...todos, newTodo]);
    this.saveTodos();
  }

  addSubtask(parentId: string, subtaskData: Partial<Todo>): void {
    const todos = this.todosSignal();
    const parent = todos.find(t => t.id === parentId);
    if (!parent) return;

    const maxOrder = Math.max(0, ...parent.subtasks.map(s => s.order || 0));
    
    const newSubtask: Todo = {
      title: subtaskData.title || '',
      description: subtaskData.description,
      completed: subtaskData.completed || false,
      priority: subtaskData.priority || 'medium',
      dueDate: subtaskData.dueDate,
      category: subtaskData.category,
      id: this.generateId(),
      parentId,
      createdAt: new Date(),
      updatedAt: new Date(),
      subtasks: [],
      isExpanded: false,
      order: maxOrder + 1
    };

    this.todosSignal.update(todos =>
      todos.map(todo =>
        todo.id === parentId
          ? { ...todo, subtasks: [...todo.subtasks, newSubtask], updatedAt: new Date() }
          : todo
      )
    );
    this.saveTodos();
  }

  updateTodo(id: string, updates: Partial<Todo>): void {
    this.todosSignal.update(todos =>
      todos.map(todo => {
        if (todo.id === id) {
          return { ...todo, ...updates, updatedAt: new Date() };
        }
        // Check subtasks
        const updatedSubtasks = todo.subtasks.map(subtask =>
          subtask.id === id
            ? { ...subtask, ...updates, updatedAt: new Date() }
            : subtask
        );
        if (updatedSubtasks !== todo.subtasks) {
          return { ...todo, subtasks: updatedSubtasks, updatedAt: new Date() };
        }
        return todo;
      })
    );
    this.saveTodos();
  }

  deleteTodo(id: string): void {
    this.todosSignal.update(todos => {
      // Remove main todo or subtask
      return todos
        .filter(todo => todo.id !== id)
        .map(todo => ({
          ...todo,
          subtasks: todo.subtasks.filter(subtask => subtask.id !== id)
        }));
    });
    this.saveTodos();
  }

  toggleTodo(id: string): void {
    const todos = this.todosSignal();
    const todoToToggle = this.findTodoById(todos, id);

    if (todoToToggle) {
      const newCompletedState = !todoToToggle.completed;
      const updatedTodos = this.updateTodoRecursive(todos, id, { completed: newCompletedState });
      this.todosSignal.set(updatedTodos);
      this.saveTodos();
    }
  }

  toggleExpanded(id: string): void {
    this.todosSignal.update(todos =>
      todos.map(todo =>
        todo.id === id
          ? { ...todo, isExpanded: !todo.isExpanded }
          : todo
      )
    );
  }

  reorderTodos(fromIndex: number, toIndex: number): void {
    const filteredTodos = this.filteredTodos();
    const allTodos = this.todosSignal();
    
    // Get the todo being moved
    const movedTodo = filteredTodos[fromIndex];
    
    // Remove the moved todo from filtered list
    const newFilteredTodos = [...filteredTodos];
    newFilteredTodos.splice(fromIndex, 1);
    newFilteredTodos.splice(toIndex, 0, movedTodo);
    
    // Update the full todos list maintaining the new order for filtered items
    const updatedTodos = allTodos.map(todo => {
      const filteredIndex = newFilteredTodos.findIndex(ft => ft.id === todo.id);
      return filteredIndex >= 0 ? newFilteredTodos[filteredIndex] : todo;
    });
    
    this.todosSignal.set(updatedTodos);
    this.saveTodos();
  }

  setFilter(filter: FilterType): void {
    this.filterSignal.set(filter);
  }

  setSort(sort: SortType): void {
    this.sortSignal.set(sort);
  }

  setSearch(search: string): void {
    this.searchSignal.set(search);
  }

  clearCompleted(): void {
    this.todosSignal.update(todos => todos.filter(todo => !todo.completed));
    this.saveTodos();
  }

  private updateTodoRecursive(todos: Todo[], id: string, updates: Partial<Todo>): Todo[] {
    return todos.map(todo => {
      if (todo.id === id) {
        return { ...todo, ...updates, updatedAt: new Date() };
      }
      if (todo.subtasks.length > 0) {
        const updatedSubtasks = this.updateTodoRecursive(todo.subtasks, id, updates);
        if (updatedSubtasks !== todo.subtasks) {
          return { ...todo, subtasks: updatedSubtasks, updatedAt: new Date() };
        }
      }
      return todo;
    });
  }

  private findTodoById(todos: Todo[], id: string): Todo | undefined {
    for (const todo of todos) {
      if (todo.id === id) {
        return todo;
      }
      if (todo.subtasks.length > 0) {
        const foundInSubtasks = this.findTodoById(todo.subtasks, id);
        if (foundInSubtasks) {
          return foundInSubtasks;
        }
      }
    }
    return undefined;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private saveTodos(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.todosSignal()));
  }

  private loadTodos(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const todos = JSON.parse(stored).map((todo: any) => ({
          ...todo,
          createdAt: new Date(todo.createdAt),
          updatedAt: new Date(todo.updatedAt),
          dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
          subtasks: todo.subtasks || [],
          isExpanded: todo.isExpanded ?? false,
          order: todo.order || 0
        }));
        this.todosSignal.set(todos);
      } catch (error) {
        console.error('Error loading todos from localStorage:', error);
      }
    }
  }
}