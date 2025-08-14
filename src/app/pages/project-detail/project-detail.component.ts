import { Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { TodoService } from '../../services/todo.service';
import { TodoFormComponent } from '../../components/todo-form/todo-form.component';
import { TodoItemComponent } from '../../components/todo-item/todo-item.component';
import { TodoFiltersComponent } from '../../components/todo-filters/todo-filters.component';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Todo, FilterType, SortType } from '../../models/todo.model';

import { ConfirmationService } from '../../services/confirmation.service';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    TodoFormComponent, 
    TodoItemComponent, 
    TodoFiltersComponent,
    DragDropModule
  ],
  template: `
    <div class="project-detail-container" *ngIf="project(); else notFound">
      <!-- Project Header -->
      <header class="project-header">
        <button class="back-btn" (click)="goBack()">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/>
          </svg>
          Back to Projects
        </button>
        
        <div class="project-info">
          <div class="project-icon" [style.background-color]="project()!.color">
            {{ project()!.icon || '📋' }}
          </div>
          <div>
            <h1 class="project-name">{{ project()!.name }}</h1>
            <p class="project-description" *ngIf="project()!.description">
              {{ project()!.description }}
            </p>
          </div>
        </div>

        <div class="project-stats">
          <div class="stat">
            <span class="stat-value">{{ projectTodos().length }}</span>
            <span class="stat-label">Total Tasks</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ completedTodos().length }}</span>
            <span class="stat-label">Completed</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ activeTodos().length }}</span>
            <span class="stat-label">Active</span>
          </div>
        </div>
      </header>

      <!-- Todo Management -->
      <div class="todo-container">
        <!-- Add Todo Form -->
        <app-todo-form #todoForm (addTodo)="onAddTodo($event)"></app-todo-form>

        <!-- Filters and Stats -->
        <app-todo-filters
          [currentFilter]="filter()"
          [currentSort]="sort()"
          [searchTerm]="search()"
          [stats]="todoStats()"
          (filterChange)="onFilterChange($event)"
          (sortChange)="onSortChange($event)"
          (searchChange)="onSearchChange($event)"
          (clearCompleted)="onClearCompleted()">
        </app-todo-filters>

        <!-- Todo List -->
        <div class="todos-section">
          <div class="todos-list" 
               cdkDropList 
               id="main-todos-list"
               [cdkDropListData]="filteredTodos()" 
               (cdkDropListDropped)="onDrop($event)" 
               *ngIf="filteredTodos().length > 0; else emptyState">
            <app-todo-item
              *ngFor="let todo of filteredTodos(); trackBy: trackByTodoId"
              cdkDrag
              [todo]="todo"
              (toggle)="onToggleTodo($event)"
              (update)="onUpdateTodo($event)"
              (delete)="onDeleteTodo($event)"
              (addSubtaskEvent)="onAddSubtask($event)"
              (toggleExpanded)="onToggleExpanded($event)"
              (subtaskDrop)="onSubtaskDrop($event.event, $event.parentId)">
            </app-todo-item>
            
            <!-- Add Task Button at bottom of list -->
            <div class="add-task-bottom">
              <button class="add-task-bottom-btn" (click)="onShowAddTaskForm()">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1a.75.75 0 01.75.75v5.5h5.5a.75.75 0 010 1.5h-5.5v5.5a.75.75 0 01-1.5 0v-5.5h-5.5a.75.75 0 010-1.5h5.5v-5.5A.75.75 0 018 1z"/>
                </svg>
                Add Task
              </button>
            </div>
          </div>

          <ng-template #emptyState>
            <div class="empty-state">
              <div class="empty-icon">
                @if (search()) {
                  🔍
                } @else if (filter() === 'completed') {
                  🎉
                } @else {
                  📝
                }
              </div>
              <h3 class="empty-title">
                @if (search()) {
                  No tasks found
                } @else if (filter() === 'completed') {
                  No completed tasks
                } @else if (filter() === 'active') {
                  No active tasks
                } @else {
                  No tasks yet
                }
              </h3>
              <p class="empty-description">
                @if (search()) {
                  Try adjusting your search terms or filters
                } @else if (filter() === 'completed') {
                  Complete some tasks to see them here
                } @else if (filter() === 'active') {
                  All your tasks are completed! 🎉
                } @else {
                  Add your first task to get started
                }
              </p>
            </div>
          </ng-template>
        </div>
      </div>
    </div>

    <ng-template #notFound>
      <div class="not-found">
        <h2>Project Not Found</h2>
        <p>The project you're looking for doesn't exist.</p>
        <button class="btn btn-primary" (click)="goBack()">
          Back to Projects
        </button>
      </div>
    </ng-template>
  `,
  styleUrls: ['./project-detail.component.css']
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private todoService = inject(TodoService);
  private confirmationService = inject(ConfirmationService);

  projectId = computed(() => this.route.snapshot.paramMap.get('id'));
  project = computed(() => {
    const id = this.projectId();
    return id ? this.projectService.getProjectById(id) : null;
  });

  // Project-specific todos
  projectTodos = computed(() => 
    this.todoService.todos().filter(todo => todo.projectId === this.projectId())
  );

  completedTodos = computed(() => 
    this.projectTodos().filter(todo => todo.completed)
  );

  activeTodos = computed(() => 
    this.projectTodos().filter(todo => !todo.completed)
  );

  // Filtered todos for display
  filteredTodos = computed(() => {
    let todos = this.projectTodos();
    const filter = this.filter();
    const search = this.search().toLowerCase();
    const sort = this.sort();

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

  // Todo service signals
  filter = this.todoService.filter;
  sort = this.todoService.sort;
  search = this.todoService.search;

  todoStats = computed(() => {
    const todos = this.projectTodos();
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

  ngOnInit(): void {
    // Set current project in service
    const projectId = this.projectId();
    if (projectId) {
      this.projectService.setCurrentProject(projectId);
    }
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }

  onAddTodo(todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt' | 'subtasks' | 'order'>): void {
    const projectId = this.projectId();
    if (projectId) {
      this.todoService.addTodo({ ...todoData, projectId });
    }
  }

  onAddSubtask(data: { parentId: string; subtaskData: Partial<Todo> }): void {
    this.todoService.addSubtask(data.parentId, data.subtaskData);
  }

  onToggleExpanded(id: string): void {
    this.todoService.toggleExpanded(id);
  }

  onToggleTodo(id: string): void {
    this.todoService.toggleTodo(id);
  }

  onUpdateTodo(data: { id: string; updates: Partial<Todo> }): void {
    this.todoService.updateTodo(data.id, data.updates);
  }

  async onDeleteTodo(id: string): Promise<void> {
    const todo = this.findTodoByIdInProject(id);
    if (!todo) return;

    const confirmed = await this.confirmationService.open(
      'Delete Task',
      `Are you sure you want to delete "${todo.title}"? This will also delete all its subtasks.`
    );

    if (confirmed) {
      this.todoService.deleteTodo(id);
    }
  }

  onFilterChange(filter: FilterType): void {
    this.todoService.setFilter(filter);
  }

  onSortChange(sort: SortType): void {
    this.todoService.setSort(sort);
  }

  onSearchChange(search: string): void {
    this.todoService.setSearch(search);
  }

  async onClearCompleted(): Promise<void> {
    const confirmed = await this.confirmationService.open(
      'Clear Completed Tasks',
      'Are you sure you want to delete all completed tasks?'
    );

    if (confirmed) {
      this.todoService.clearCompleted();
    }
  }

  onShowAddTaskForm(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const todoForm = document.querySelector('app-todo-form') as any;
      if (todoForm && !todoForm.showForm()) {
        todoForm.toggleForm();
      }
    }, 300);
  }

  trackByTodoId(index: number, todo: Todo): string {
    return todo.id;
  }

  private todoMatchesSearch(todo: Todo, search: string): boolean {
    const matches = todo.title.toLowerCase().includes(search) ||
                   todo.description?.toLowerCase().includes(search) ||
                   todo.category?.toLowerCase().includes(search);
    
    if (matches) return true;
    
    // Check subtasks
    return todo.subtasks.some(subtask => this.todoMatchesSearch(subtask, search));
  }

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

  onDrop(event: CdkDragDrop<Todo[]>) {
    const todos = this.filteredTodos();
    const movedTodo = todos[event.previousIndex];
    const targetTodo = todos[event.currentIndex];

    let allTodos = [...this.projectTodos()];
    const fromIndex = allTodos.findIndex(t => t.id === movedTodo.id);
    const toIndex = allTodos.findIndex(t => t.id === targetTodo.id);

    moveItemInArray(allTodos, fromIndex, toIndex);
    this.todoService.reorderTodos(allTodos.map(t => t.id));
  }

  onSubtaskDrop(event: CdkDragDrop<Todo[]>, parentId: string) {
    // Find the parent todo at any nesting level
    const parentTodo = this.findTodoByIdInProject(parentId);
    if (parentTodo && parentTodo.subtasks.length > 0) {
      let subtasks = [...parentTodo.subtasks];
      moveItemInArray(subtasks, event.previousIndex, event.currentIndex);
      this.todoService.reorderSubtasks(parentId, subtasks.map(s => s.id));
    }
  }

  private findTodoByIdInProject(id: string): Todo | undefined {
    const projectTodos = this.projectTodos();
    return this.findTodoByIdRecursive(projectTodos, id);
  }

  private findTodoByIdRecursive(todos: Todo[], id: string): Todo | undefined {
    for (const todo of todos) {
      if (todo.id === id) {
        return todo;
      }
      if (todo.subtasks.length > 0) {
        const found = this.findTodoByIdRecursive(todo.subtasks, id);
        if (found) {
          return found;
        }
      }
    }
    return undefined;
  }
}