import { Component, Input, Output, EventEmitter, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Todo } from '../../models/todo.model';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { TaskEditorComponent } from '../task-editor/task-editor.component';

@Component({
  selector: 'app-todo-item',
  standalone: true,
  imports: [CommonModule, FormsModule, TaskEditorComponent, DragDropModule],
  template: `
    <div class="task-item" [class.has-subtasks]="todo.subtasks.length > 0">
      <!-- Main Task -->
      <div class="task-row" 
           [class.completed]="todo.completed"
           [class.high-priority]="todo.priority === 'high'"
           [class.medium-priority]="todo.priority === 'medium'"
           [class.low-priority]="todo.priority === 'low'"
           [class.overdue]="isOverdue()">
        
        <!-- Expand/Collapse Button -->
        <button class="expand-btn" 
                *ngIf="todo.subtasks.length > 0"
                (click)="onToggleExpanded()"
                [class.expanded]="todo.isExpanded">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="expand-placeholder" *ngIf="todo.subtasks.length === 0"></div>

        <!-- Checkbox -->
        <input type="checkbox" 
               class="task-checkbox"
               [checked]="todo.completed"
               (change)="onToggle()">

        <!-- Task Content -->
        <div class="task-content" (click)="openEditor($event)">
          <div class="task-title" [class.completed]="todo.completed">
            {{ todo.title }}
          </div>
          <div class="task-meta" *ngIf="todo.dueDate || todo.category || todo.duration">
            <span class="due-date" *ngIf="todo.dueDate" [class.overdue]="isOverdue()">
              {{ formatDate(todo.dueDate) }}
            </span>
            <span class="duration" *ngIf="todo.duration" title="Estimated duration">
              ⏰ {{ formatDuration(todo.duration) }}
            </span>
            <span class="category" *ngIf="todo.category">{{ todo.category }}</span>
          </div>
        </div>

        <!-- Priority Indicator -->
        <div class="priority-indicator" [attr.data-priority]="todo.priority"></div>

        <!-- Actions -->
        <div class="task-actions">
          <button class="action-btn" (click)="openEditor($event)" title="Edit task">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61z"/>
            </svg>
          </button>
          <button class="action-btn archive-btn" 
                  (click)="onArchive($event)" 
                  *ngIf="!todo.archived"
                  title="Archive task">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1.75 2.5h12.5a.75.75 0 110 1.5H1.75a.75.75 0 010-1.5zm1 3a.75.75 0 01.75-.75h9a.75.75 0 01.75.75v6.5A1.75 1.75 0 0111.5 13h-7A1.75 1.75 0 012.75 11.5v-6zm1.5.75v5.75c0 .138.112.25.25.25h7a.25.25 0 00.25-.25V6.25h-7.5zm3.5 1.5a.75.75 0 01.75.75v2a.75.75 0 01-1.5 0v-2a.75.75 0 01.75-.75z"/>
            </svg>
          </button>
          <button class="action-btn unarchive-btn" 
                  (click)="onUnarchive($event)" 
                  *ngIf="todo.archived"
                  title="Unarchive task">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1.75 2.5h12.5a.75.75 0 110 1.5H1.75a.75.75 0 010-1.5zm1 3a.75.75 0 01.75-.75h9a.75.75 0 01.75.75v6.5A1.75 1.75 0 0111.5 13h-7A1.75 1.75 0 012.75 11.5v-6zm1.5.75v5.75c0 .138.112.25.25.25h7a.25.25 0 00.25-.25V6.25h-7.5zm3.5 1.5a.75.75 0 01.75.75v2a.75.75 0 01-1.5 0v-2a.75.75 0 01.75-.75z"/>
            </svg>
          </button>
          <button class="action-btn delete-btn" (click)="onDelete($event)" title="Delete task">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675a.75.75 0 10-1.492.15l.66 6.6A1.75 1.75 0 005.405 15h5.19c.9 0 1.652-.681 1.741-1.576l.66-6.6a.75.75 0 00-1.492-.149l-.66 6.6a.25.25 0 01-.249.225h-5.19a.25.25 0 01-.249-.225l-.66-6.6z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Add Subtask Button -->
      <div class="add-subtask" *ngIf="!todo.completed">
        <button class="add-subtask-btn" (click)="addSubtask()">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M7 1a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 017 1z"/>
          </svg>
          Add subtask
        </button>
      </div>

      <!-- Subtasks -->
      <div class="subtasks" 
           cdkDropList 
           [id]="'subtasks-' + todo.id"
           [cdkDropListData]="todo.subtasks" 
           (cdkDropListDropped)="onSubtaskDrop($event)" 
           *ngIf="todo.isExpanded && todo.subtasks.length > 0">
        <app-todo-item
          *ngFor="let subtask of todo.subtasks; trackBy: trackBySubtaskId"
          cdkDrag
          [todo]="subtask"
          [isSubtask]="true"
          (toggle)="onSubtaskToggle($event)"
          (update)="onSubtaskUpdate($event)"
          (delete)="onSubtaskDelete($event)"
          (addSubtaskEvent)="onSubtaskAddSubtask($event)"
          (toggleExpanded)="onSubtaskToggleExpanded($event)"
          (subtaskDrop)="onSubtaskDropEvent($event)"
          (archive)="onSubtaskArchive($event)"
          (unarchive)="onSubtaskUnarchive($event)">
        </app-todo-item>
      </div>
    </div>

    <!-- Task Editor Modal -->
    <app-task-editor
      #taskEditor
      [todo]="editingTodo"
      [isSubtask]="isSubtask"
      (save)="onSaveTask($event)"
      (close)="closeEditor()">
    </app-task-editor>
  `,
  styleUrls: ['./todo-item.component.css']
})
export class TodoItemComponent {
  @Input({ required: true }) todo!: Todo;
  @Input() isSubtask = false;
  @Output() toggle = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();
  @Output() update = new EventEmitter<{ id: string; updates: Partial<Todo> }>();
  @Output() addSubtaskEvent = new EventEmitter<{ parentId: string; subtaskData: Partial<Todo> }>();
  @Output() toggleExpanded = new EventEmitter<string>();
  @Output() subtaskDrop = new EventEmitter<{ parentId: string; event: CdkDragDrop<Todo[]> }>();
  @Output() archive = new EventEmitter<string>();
  @Output() unarchive = new EventEmitter<string>();
  @Output() edit = new EventEmitter<boolean>();

  @ViewChild('taskEditor') taskEditor!: TaskEditorComponent;

  editingTodo: Todo | null = null;

  onToggle(): void {
    this.toggle.emit(this.todo.id);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.delete.emit(this.todo.id);
  }

  onArchive(event: Event): void {
    event.stopPropagation();
    this.archive.emit(this.todo.id);
  }

  onUnarchive(event: Event): void {
    event.stopPropagation();
    this.unarchive.emit(this.todo.id);
  }

  onToggleExpanded(): void {
    this.toggleExpanded.emit(this.todo.id);
  }

  openEditor(event: Event): void {
    event.stopPropagation();
    this.editingTodo = this.todo;
    this.taskEditor.open();
    this.edit.emit(true);
  }

  closeEditor(): void {
    this.editingTodo = null;
    this.edit.emit(false);
  }

  onSaveTask(updates: Partial<Todo>): void {
    if (this.editingTodo) {
      // Editing existing task
      this.update.emit({ id: this.todo.id, updates });
    } else {
      // Creating new subtask
      this.addSubtaskEvent.emit({ 
        parentId: this.todo.id, 
        subtaskData: updates 
      });
    }
    this.closeEditor();
  }

  addSubtask(): void {
    this.editingTodo = null;
    this.taskEditor.open();
  }

  onSubtaskToggle(subtaskId: string): void {
    this.toggle.emit(subtaskId);
  }

  onSubtaskUpdate(data: { id: string; updates: Partial<Todo> }): void {
    this.update.emit(data);
  }

  onSubtaskDelete(subtaskId: string): void {
    this.delete.emit(subtaskId);
  }

  onSubtaskAddSubtask(data: { parentId: string; subtaskData: Partial<Todo> }): void {
    this.addSubtaskEvent.emit(data);
  }

  onSubtaskToggleExpanded(subtaskId: string): void {
    this.toggleExpanded.emit(subtaskId);
  }

  onSubtaskArchive(subtaskId: string): void {
    this.archive.emit(subtaskId);
  }

  onSubtaskUnarchive(subtaskId: string): void {
    this.unarchive.emit(subtaskId);
  }

  onSubtaskDropEvent(event: { parentId: string; event: CdkDragDrop<Todo[]> }) {
    // Propagate the event up the chain - don't modify the parentId
    this.subtaskDrop.emit(event);
  }

  onSubtaskDrop(event: CdkDragDrop<Todo[]>) {
    // This is a direct drop on this todo's subtasks
    this.subtaskDrop.emit({ parentId: this.todo.id, event });
  }

  trackBySubtaskId(index: number, subtask: Todo): string {
    return subtask.id;
  }

  isOverdue(): boolean {
    return !!(this.todo.dueDate && 
             !this.todo.completed && 
             new Date(this.todo.dueDate) < new Date());
  }

  formatDate(date: Date): string {
    const now = new Date();
    const todoDate = new Date(date);
    
    // Reset time part for day comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDate = new Date(todoDate.getFullYear(), todoDate.getMonth(), todoDate.getDate());

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const timeFormat: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    const timeString = todoDate.toLocaleTimeString([], timeFormat);

    if (diffDays === 0) return `Today at ${timeString}`;
    if (diffDays === 1) return `Tomorrow at ${timeString}`;
    if (diffDays === -1) return `Yesterday at ${timeString}`;
    
    const dateFormat: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    if (now.getFullYear() !== todoDate.getFullYear()) {
      dateFormat.year = 'numeric';
    }
    
    return `${todoDate.toLocaleDateString([], dateFormat)} at ${timeString}`;
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
  }
}