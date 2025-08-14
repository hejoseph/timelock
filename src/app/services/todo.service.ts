import { Injectable, signal, computed, inject } from '@angular/core';
import { Todo, FilterType, SortType } from '../models/todo.model';
import { IndexedDBService } from './indexeddb.service';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private indexedDBService = inject(IndexedDBService);
  
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
        todos = todos.filter(todo => !todo.completed && !todo.archived);
        break;
      case 'completed':
        todos = todos.filter(todo => todo.completed && !todo.archived);
        break;
      case 'archived':
        todos = todos.filter(todo => todo.archived);
        break;
      case 'all':
      default:
        todos = todos.filter(todo => !todo.archived);
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
    const activeTasks = allTasks.filter(t => !t.archived);
    return {
      total: activeTasks.length,
      completed: activeTasks.filter(t => t.completed).length,
      active: activeTasks.filter(t => !t.completed).length,
      archived: allTasks.filter(t => t.archived).length,
      highPriority: activeTasks.filter(t => t.priority === 'high' && !t.completed).length,
      overdue: activeTasks.filter(t => 
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
    this.initializeData();
  }

  private async initializeData(): Promise<void> {
    try {
      // First, try to migrate data from localStorage if it exists
      await this.migrateFromLocalStorage();
      
      // Then load data from IndexedDB
      await this.loadTodos();
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  }

  private async migrateFromLocalStorage(): Promise<void> {
    const LEGACY_STORAGE_KEY = 'awesome-todos';
    const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
    
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

        // Check if IndexedDB is empty before migrating
        const existingTodos = await this.indexedDBService.loadTodos();
        if (existingTodos.length === 0) {
          await this.indexedDBService.saveTodos(todos);
          console.log('Migrated', todos.length, 'todos from localStorage to IndexedDB');
        }
        
        // Remove from localStorage after successful migration
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch (error) {
        console.error('Error migrating from localStorage:', error);
      }
    }
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
      order: maxOrder + 1,
      archived: false
    };

    this.todosSignal.update(todos => [...todos, newTodo]);
    this.saveTodos();
  }

  addSubtask(parentId: string, subtaskData: Partial<Todo>): void {
    const todos = this.todosSignal();
    const parent = this.findTodoById(todos, parentId);
    if (!parent) return;

    const maxOrder = Math.max(0, ...parent.subtasks.map(s => s.order || 0));
    
    const newSubtask: Todo = {
      title: subtaskData.title || '',
      description: subtaskData.description,
      completed: subtaskData.completed || false,
      archived: false,
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

    const updatedTodos = this.addSubtaskRecursive(todos, parentId, newSubtask);
    this.todosSignal.set(updatedTodos);
    this.saveTodos();
  }

  private addSubtaskRecursive(todos: Todo[], parentId: string, newSubtask: Todo): Todo[] {
    return todos.map(todo => {
      if (todo.id === parentId) {
        return { 
          ...todo, 
          subtasks: [...todo.subtasks, newSubtask], 
          updatedAt: new Date(),
          isExpanded: true // Auto-expand when adding subtask
        };
      }
      if (todo.subtasks.length > 0) {
        const updatedSubtasks = this.addSubtaskRecursive(todo.subtasks, parentId, newSubtask);
        if (updatedSubtasks !== todo.subtasks) {
          return { ...todo, subtasks: updatedSubtasks, updatedAt: new Date() };
        }
      }
      return todo;
    });
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
    this.todosSignal.update(todos => this.deleteTodoRecursive(todos, id));
    this.saveTodos();
  }

  private deleteTodoRecursive(todos: Todo[], id: string): Todo[] {
    return todos
      .filter(todo => todo.id !== id)
      .map(todo => ({
        ...todo,
        subtasks: this.deleteTodoRecursive(todo.subtasks, id)
      }));
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
    const todos = this.todosSignal();
    const updatedTodos = this.toggleExpandedRecursive(todos, id);
    this.todosSignal.set(updatedTodos);
  }

  private toggleExpandedRecursive(todos: Todo[], id: string): Todo[] {
    return todos.map(todo => {
      if (todo.id === id) {
        return { ...todo, isExpanded: !todo.isExpanded };
      }
      if (todo.subtasks.length > 0) {
        const updatedSubtasks = this.toggleExpandedRecursive(todo.subtasks, id);
        if (updatedSubtasks !== todo.subtasks) {
          return { ...todo, subtasks: updatedSubtasks };
        }
      }
      return todo;
    });
  }

  reorderTodos(todoIds: string[]): void {
    this.todosSignal.update(todos => {
      const todoMap = new Map(todos.map(t => [t.id, t]));
      const reorderedTodos = todoIds.map((id, index) => {
        const todo = todoMap.get(id)!;
        return { ...todo, order: index };
      });

      const reorderedIds = new Set(reorderedTodos.map(t => t.id));
      const remainingTodos = todos.filter(t => !reorderedIds.has(t.id));

      return [...reorderedTodos, ...remainingTodos];
    });
    this.saveTodos();
  }

  reorderSubtasks(parentId: string, subtaskIds: string[]): void {
    this.todosSignal.update(todos => {
      return this.reorderSubtasksRecursive(todos, parentId, subtaskIds);
    });
    this.saveTodos();
  }

  private reorderSubtasksRecursive(todos: Todo[], parentId: string, subtaskIds: string[]): Todo[] {
    return todos.map(todo => {
      if (todo.id === parentId) {
        // Found the parent, reorder its direct subtasks
        const subtaskMap = new Map(todo.subtasks.map(s => [s.id, s]));
        const reorderedSubtasks = subtaskIds.map((id, index) => {
          const subtask = subtaskMap.get(id);
          if (subtask) {
            return { ...subtask, order: index };
          }
          return subtask;
        }).filter(Boolean) as Todo[];
        
        return { 
          ...todo, 
          subtasks: reorderedSubtasks,
          updatedAt: new Date()
        };
      }
      
      // Check if this todo has subtasks and recursively search
      if (todo.subtasks.length > 0) {
        const updatedSubtasks = this.reorderSubtasksRecursive(todo.subtasks, parentId, subtaskIds);
        if (updatedSubtasks !== todo.subtasks) {
          return { 
            ...todo, 
            subtasks: updatedSubtasks,
            updatedAt: new Date()
          };
        }
      }
      
      return todo;
    });
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
    this.todosSignal.update(todos => this.clearCompletedRecursive(todos));
    this.saveTodos();
  }

  private clearCompletedRecursive(todos: Todo[]): Todo[] {
    return todos
      .filter(todo => !todo.completed)
      .map(todo => ({
        ...todo,
        subtasks: this.clearCompletedRecursive(todo.subtasks)
      }));
  }

  archiveTodo(id: string): void {
    const todos = this.todosSignal();
    const updatedTodos = this.updateTodoRecursive(todos, id, { archived: true });
    this.todosSignal.set(updatedTodos);
    this.saveTodos();
  }

  unarchiveTodo(id: string): void {
    const todos = this.todosSignal();
    const updatedTodos = this.updateTodoRecursive(todos, id, { archived: false });
    this.todosSignal.set(updatedTodos);
    this.saveTodos();
  }

  archiveCompleted(): void {
    this.todosSignal.update(todos => this.archiveCompletedRecursive(todos));
    this.saveTodos();
  }

  private archiveCompletedRecursive(todos: Todo[]): Todo[] {
    return todos.map(todo => {
      const updatedTodo = { ...todo };
      
      // Archive completed tasks
      if (todo.completed && !todo.archived) {
        updatedTodo.archived = true;
        updatedTodo.updatedAt = new Date();
      }
      
      // Recursively handle subtasks
      if (todo.subtasks.length > 0) {
        updatedTodo.subtasks = this.archiveCompletedRecursive(todo.subtasks);
      }
      
      return updatedTodo;
    });
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

  private async saveTodos(): Promise<void> {
    try {
      await this.indexedDBService.saveTodos(this.todosSignal());
    } catch (error) {
      console.error('Error saving todos to IndexedDB:', error);
    }
  }

  private async loadTodos(): Promise<void> {
    try {
      const todos = await this.indexedDBService.loadTodos();
      this.todosSignal.set(todos);
    } catch (error) {
      console.error('Error loading todos from IndexedDB:', error);
    }
  }
}