import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TodoService } from './services/todo.service';
import { TodoFormComponent } from './components/todo-form/todo-form.component';
import { TodoItemComponent } from './components/todo-item/todo-item.component';
import { TodoFiltersComponent } from './components/todo-filters/todo-filters.component';
import { Todo, FilterType, SortType } from './models/todo.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    TodoFormComponent,
    TodoItemComponent,
    TodoFiltersComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private todoService = inject(TodoService);

  @ViewChild('todoForm') todoFormComponent!: TodoFormComponent;

  // Expose service signals to template
  todos = this.todoService.filteredTodos;
  filter = this.todoService.filter;
  sort = this.todoService.sort;
  search = this.todoService.search;
  stats = this.todoService.stats;

  onAddTodo(todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt' | 'subtasks' | 'order'>): void {
    this.todoService.addTodo(todoData);
  }

  onShowAddTaskForm(): void {
    // Scroll to top and trigger the add todo form
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Open the todo form if it's not already open
    setTimeout(() => {
      if (this.todoFormComponent && !this.todoFormComponent.showForm()) {
        this.todoFormComponent.toggleForm();
      }
    }, 300); // Small delay to allow scroll to complete
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

  onDeleteTodo(id: string): void {
    this.todoService.deleteTodo(id);
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

  onClearCompleted(): void {
    this.todoService.clearCompleted();
  }

  trackByTodoId(index: number, todo: Todo): string {
    return todo.id;
  }
}
