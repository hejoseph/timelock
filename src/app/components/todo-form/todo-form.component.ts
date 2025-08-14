import { Component, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Todo } from '../../models/todo.model';

@Component({
  selector: 'app-todo-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="todo-form-container">
      <button class="add-todo-btn" 
              (click)="toggleForm()"
              [class.active]="showForm()">
        <span class="btn-icon">{{ showForm() ? '✕' : '+' }}</span>
        <span class="btn-text">{{ showForm() ? 'Cancel' : 'Add New Todo' }}</span>
      </button>

      <div class="todo-form" [class.show]="showForm()">
        <form (ngSubmit)="onSubmit()" #todoForm="ngForm">
          <div class="form-group">
            <input type="text" 
                   class="form-input title-input"
                   [(ngModel)]="formData.title"
                   name="title"
                   placeholder="What needs to be done?"
                   required
                   #titleInput>
          </div>

          <div class="form-group">
            <textarea class="form-input description-input"
                      [(ngModel)]="formData.description"
                      name="description"
                      placeholder="Add a description (optional)"
                      rows="3"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-input priority-select" 
                      [(ngModel)]="formData.priority"
                      name="priority">
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Due Date</label>
              <input type="date" 
                     class="form-input date-input"
                     [(ngModel)]="formData.dueDate"
                     name="dueDate"
                     [min]="today">
            </div>

            <div class="form-group">
              <label class="form-label">Category</label>
              <input type="text" 
                     class="form-input category-input"
                     [(ngModel)]="formData.category"
                     name="category"
                     placeholder="e.g., Work, Personal"
                     list="categories">
              <datalist id="categories">
                <option value="Work">
                <option value="Personal">
                <option value="Shopping">
                <option value="Health">
                <option value="Learning">
                <option value="Home">
              </datalist>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" 
                    class="btn btn-primary"
                    [disabled]="!todoForm.form.valid">
              <span class="btn-icon">✓</span>
              Add Todo
            </button>
            <button type="button" 
                    class="btn btn-secondary"
                    (click)="resetForm()">
              <span class="btn-icon">↻</span>
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrls: ['./todo-form.component.css']
})
export class TodoFormComponent {
  @Output() addTodo = new EventEmitter<Omit<Todo, 'id' | 'createdAt' | 'updatedAt' | 'subtasks' | 'order'>>();

  private showFormSignal = signal(false);
  showForm = this.showFormSignal.asReadonly();

  today = new Date().toISOString().split('T')[0];

  formData = {
    title: '',
    description: '',
    priority: 'medium' as Todo['priority'],
    dueDate: '',
    category: '',
    completed: false,
    archived: false
  };

  toggleForm(): void {
    this.showFormSignal.update(show => !show);
    if (!this.showForm()) {
      this.resetForm();
    }
  }

  onSubmit(): void {
    if (!this.formData.title.trim()) return;

    const todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt' | 'subtasks' | 'order'> = {
      title: this.formData.title.trim(),
      description: this.formData.description.trim() || undefined,
      completed: false,
      archived: false,
      priority: this.formData.priority,
      dueDate: this.formData.dueDate ? new Date(this.formData.dueDate) : undefined,
      category: this.formData.category.trim() || undefined,
      isExpanded: false
    };

    this.addTodo.emit(todoData);
    this.resetForm();
    this.showFormSignal.set(false);
  }

  resetForm(): void {
    this.formData = {
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      category: '',
      completed: false,
      archived: false
    };
  }
}