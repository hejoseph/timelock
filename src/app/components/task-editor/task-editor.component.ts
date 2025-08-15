import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Todo } from '../../models/todo.model';

@Component({
  selector: 'app-task-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen()" (click)="onOverlayClick($event)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">{{ isEditing ? 'Edit Task' : 'Create Task' }}</h2>
          <button class="close-btn" (click)="onClose()" type="button">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
            </svg>
          </button>
        </div>

        <form (ngSubmit)="onSubmit()" class="modal-form">
          <div class="form-group">
            <label class="form-label">Task Title *</label>
            <input 
              type="text" 
              class="form-input"
              [(ngModel)]="formData.title"
              name="title"
              placeholder="Enter task title"
              required
              #titleInput>
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea 
              class="form-input"
              [(ngModel)]="formData.description"
              name="description"
              placeholder="Add task description..."
              rows="3"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-input" [(ngModel)]="formData.priority" name="priority">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Due Date</label>
              <input 
                type="datetime-local" 
                class="form-input"
                [(ngModel)]="formData.dueDate"
                name="dueDate"
                [min]="today">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Start Date Time</label>
              <input 
                type="datetime-local" 
                class="form-input"
                [(ngModel)]="formData.startDateTime"
                name="startDateTime"
                [min]="today">
            </div>

            <div class="form-group">
              <label class="form-label">End Date Time</label>
              <input 
                type="datetime-local" 
                class="form-input"
                [(ngModel)]="formData.endDateTime"
                name="endDateTime"
                [min]="formData.startDateTime || today">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Category</label>
            <input 
              type="text" 
              class="form-input"
              [(ngModel)]="formData.category"
              name="category"
              placeholder="e.g., Work, Personal"
              list="categories">
            <datalist id="categories">
              <option value="Work">
              <option value="Personal">
              <option value="Development">
              <option value="Design">
              <option value="Meeting">
              <option value="Research">
            </datalist>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" (click)="onClose()">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="!formData.title.trim()">
              {{ isEditing ? 'Update Task' : 'Create Task' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrls: ['./task-editor.component.css']
})
export class TaskEditorComponent implements OnChanges {
  @Input() todo: Todo | null = null;
  @Input() isSubtask = false;
  @Output() save = new EventEmitter<Partial<Todo>>();
  @Output() close = new EventEmitter<void>();

  private isOpenSignal = signal(false);
  isOpen = this.isOpenSignal.asReadonly();

  get today(): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }
  isEditing = false;

  formData = {
    title: '',
    description: '',
    priority: 'medium' as Todo['priority'],
    dueDate: '',
    startDateTime: '',
    endDateTime: '',
    category: '',
    completed: false,
    archived: false
  };

  ngOnChanges(changes: SimpleChanges) {
    if (changes['todo'] && changes['todo'].currentValue) {
      this.isEditing = true;
      if (this.todo) {
        this.formData = {
          title: this.todo.title,
          description: this.todo.description || '',
          priority: this.todo.priority,
          dueDate: this.todo.dueDate ? this.formatDateForInput(this.todo.dueDate) : '',
          startDateTime: this.todo.startDateTime ? this.formatDateForInput(this.todo.startDateTime) : '',
          endDateTime: this.todo.endDateTime ? this.formatDateForInput(this.todo.endDateTime) : '',
          category: this.todo.category || '',
          completed: this.todo.completed,
          archived: this.todo.archived
        };
      }
    } else {
      this.isEditing = false;
      this.resetForm();
    }
  }

  open() {
    this.isOpenSignal.set(true);
    // Focus title input after modal opens
    setTimeout(() => {
      const titleInput = document.querySelector('.modal-content input[name="title"]') as HTMLInputElement;
      titleInput?.focus();
    }, 100);
  }

  onOverlayClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onClose() {
    this.close.emit();
    this.isOpenSignal.set(false);
  }

  onSubmit() {
    if (!this.formData.title.trim()) return;

    const todoData: Partial<Todo> = {
      title: this.formData.title.trim(),
      description: this.formData.description.trim() || undefined,
      priority: this.formData.priority,
      dueDate: this.formData.dueDate ? new Date(this.formData.dueDate) : undefined,
      startDateTime: this.formData.startDateTime ? new Date(this.formData.startDateTime) : undefined,
      endDateTime: this.formData.endDateTime ? new Date(this.formData.endDateTime) : undefined,
      category: this.formData.category.trim() || undefined,
      completed: this.formData.completed
    };

    this.save.emit(todoData);
    this.isOpenSignal.set(false);
    this.resetForm();
  }

  private resetForm() {
    this.formData = {
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      startDateTime: '',
      endDateTime: '',
      category: '',
      completed: false,
      archived: false
    };
  }

  private formatDateForInput(date: Date): string {
    const localDate = new Date(date);
    localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
    return localDate.toISOString().slice(0, 16);
  }
}
