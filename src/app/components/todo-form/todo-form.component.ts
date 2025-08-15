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
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Start Date & Time</label>
              <input type="datetime-local" 
                     class="form-input datetime-input"
                     [(ngModel)]="formData.startDateTime"
                     name="startDateTime"
                     [min]="todayDateTime"
                     (change)="onStartDateTimeChange()">
            </div>

            <div class="form-group">
              <label class="form-label">End Date & Time</label>
              <input type="datetime-local" 
                     class="form-input datetime-input"
                     [(ngModel)]="formData.endDateTime"
                     name="endDateTime"
                     [min]="formData.startDateTime || todayDateTime"
                     (change)="onEndDateTimeChange()">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Duration</label>
              <div class="duration-input-group">
                <input type="number" 
                       class="form-input duration-input"
                       [(ngModel)]="formData.durationHours"
                       name="durationHours"
                       placeholder="0"
                       min="0"
                       max="23"
                       (change)="onDurationChange()">
                <span class="duration-label">hours</span>
                <input type="number" 
                       class="form-input duration-input"
                       [(ngModel)]="formData.durationMinutes"
                       name="durationMinutes"
                       placeholder="0"
                       min="0"
                       max="59"
                       (change)="onDurationChange()">
                <span class="duration-label">minutes</span>
              </div>
              <small class="form-hint">Duration will auto-calculate from start/end times, or you can set it manually</small>
            </div>
          </div>

          <div class="form-row">

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
  todayDateTime = new Date().toISOString().slice(0, 16);

  formData = {
    title: '',
    description: '',
    priority: 'medium' as Todo['priority'],
    dueDate: '',
    startDateTime: '',
    endDateTime: '',
    durationHours: 0,
    durationMinutes: 0,
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

    const totalMinutes = (this.formData.durationHours || 0) * 60 + (this.formData.durationMinutes || 0);
    
    const todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt' | 'subtasks' | 'order'> = {
      title: this.formData.title.trim(),
      description: this.formData.description.trim() || undefined,
      completed: false,
      archived: false,
      priority: this.formData.priority,
      dueDate: this.formData.dueDate ? new Date(this.formData.dueDate) : undefined,
      startDateTime: this.formData.startDateTime ? new Date(this.formData.startDateTime) : undefined,
      endDateTime: this.formData.endDateTime ? new Date(this.formData.endDateTime) : undefined,
      duration: totalMinutes > 0 ? totalMinutes : undefined,
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
      startDateTime: '',
      endDateTime: '',
      durationHours: 0,
      durationMinutes: 0,
      category: '',
      completed: false,
      archived: false
    };
  }

  onStartDateTimeChange(): void {
    this.calculateDurationFromDates();
  }

  onEndDateTimeChange(): void {
    this.calculateDurationFromDates();
  }

  onDurationChange(): void {
    // When duration is manually changed, update end time if start time is set
    if (this.formData.startDateTime && (this.formData.durationHours || this.formData.durationMinutes)) {
      const startDate = new Date(this.formData.startDateTime);
      const totalMinutes = (this.formData.durationHours || 0) * 60 + (this.formData.durationMinutes || 0);
      const endDate = new Date(startDate.getTime() + totalMinutes * 60000);
      
      // Format for datetime-local input
      const endDateTime = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000)
        .toISOString().slice(0, 16);
      this.formData.endDateTime = endDateTime;
    }
  }

  private calculateDurationFromDates(): void {
    if (this.formData.startDateTime && this.formData.endDateTime) {
      const start = new Date(this.formData.startDateTime);
      const end = new Date(this.formData.endDateTime);
      
      if (end > start) {
        const diffMs = end.getTime() - start.getTime();
        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        
        this.formData.durationHours = Math.floor(totalMinutes / 60);
        this.formData.durationMinutes = totalMinutes % 60;
      }
    }
  }
}