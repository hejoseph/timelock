import { Component, inject, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TodoService } from '../../services/todo.service';
import { ProjectService } from '../../services/project.service';
import { Todo } from '../../models/todo.model';
import { TaskEditorComponent } from '../../components/task-editor/task-editor.component';

type CalendarView = 'today' | 'week' | 'month';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule, TaskEditorComponent],
  template: `
    <div class="calendar-container">
      <header class="calendar-header">
        <h1>Calendar</h1>
        <div class="view-controls">
          <button 
            class="view-btn" 
            [class.active]="currentView() === 'today'"
            (click)="setView('today')">
            Today
          </button>
          <button 
            class="view-btn" 
            [class.active]="currentView() === 'week'"
            (click)="setView('week')">
            Week
          </button>
          <button 
            class="view-btn" 
            [class.active]="currentView() === 'month'"
            (click)="setView('month')">
            Month
          </button>
        </div>
      </header>

      <!-- Today View -->
      <div *ngIf="currentView() === 'today'" class="today-view">
        <div class="date-header">
          <h2>{{ formatDate(today()) }}</h2>
          <div class="date-navigation">
            <button class="nav-btn" (click)="previousDay()">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M9.707 4.293a1 1 0 010 1.414L7.414 8l2.293 2.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z"/>
              </svg>
            </button>
            <button class="nav-btn" (click)="goToToday()" [disabled]="isToday(today())">Today</button>
            <button class="nav-btn" (click)="nextDay()">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6.293 4.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L8.586 8 6.293 5.707a1 1 0 010-1.414z"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="tasks-for-day">
          <div *ngIf="tasksForToday().length === 0" class="no-tasks">
            <div class="no-tasks-icon">📅</div>
            <h3>No tasks scheduled for today</h3>
            <p>Your day is free! Consider adding some tasks or enjoy the break.</p>
          </div>

          <div *ngFor="let task of tasksForToday()" class="task-card" [class.completed]="task.completed" (click)="editTask(task)">
            <div class="task-time" *ngIf="getTaskDisplayTime(task)">
              {{ getTaskDisplayTime(task) }}
            </div>
            <div class="task-content">
              <div class="task-header">
                <div class="task-project">
                  <span class="project-icon" [style.color]="getProjectColor(task.projectId!)">
                    {{ getProjectIcon(task.projectId!) }}
                  </span>
                  <span class="project-name">{{ getProjectName(task.projectId!) }}</span>
                </div>
                <div class="task-priority" [class]="'priority-' + task.priority">
                  {{ task.priority }}
                </div>
              </div>
              <div class="task-time-range" *ngIf="getTaskTimeRange(task)">
                {{ getTaskTimeRange(task) }}
              </div>
              <h3 class="task-title" [class.completed]="task.completed">{{ task.title }}</h3>
              <p class="task-description" *ngIf="task.description">{{ task.description }}</p>
              <div class="task-duration" *ngIf="task.duration" title="Duration">
                🕒 {{ formatDuration(task.duration) }}
              </div>
              <div class="task-actions" (click)="$event.stopPropagation()">
                <button class="action-btn" (click)="toggleTask(task.id)">
                  {{ task.completed ? 'Mark Incomplete' : 'Mark Complete' }}
                </button>
                <button class="action-btn edit-btn" (click)="editTask(task)" title="Edit task">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61z"/>
                  </svg>
                </button>
                <a [routerLink]="['/project', task.projectId!]" class="action-btn secondary">
                  View Project
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Week View -->
      <div *ngIf="currentView() === 'week'" class="week-view">
        <div class="week-header">
          <h2>{{ getWeekRange() }}</h2>
          <div class="date-navigation">
            <button class="nav-btn" (click)="previousWeek()">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M9.707 4.293a1 1 0 010 1.414L7.414 8l2.293 2.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z"/>
              </svg>
            </button>
            <button class="nav-btn" (click)="goToCurrentWeek()">This Week</button>
            <button class="nav-btn" (click)="nextWeek()">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6.293 4.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L8.586 8 6.293 5.707a1 1 0 010-1.414z"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="week-grid">
          <div *ngFor="let day of weekDays()" class="day-column" [class.today]="isToday(day.date)">
            <div class="day-header">
              <div class="day-name">{{ day.name }}</div>
              <div class="day-number">{{ day.date.getDate() }}</div>
            </div>
            <div class="day-tasks">
              <div *ngIf="getTasksForDate(day.date).length === 0" class="no-tasks-small">
                No tasks
              </div>
              <div *ngFor="let task of getTasksForDate(day.date)" class="task-item-small" [class.completed]="task.completed" (click)="editTask(task)">
                <div class="task-time-small" *ngIf="getTaskDisplayTime(task)">
                  {{ getTaskDisplayTime(task) }}
                </div>
                <div class="task-title-small" [class.completed]="task.completed">{{ task.title }}</div>
                <div class="task-project-small">{{ getProjectName(task.projectId!) }}</div>
                <div class="task-duration-small" *ngIf="task.duration" title="Duration">
                  🕒 {{ formatDuration(task.duration) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Month View -->
      <div *ngIf="currentView() === 'month'" class="month-view">
        <div class="month-header">
          <h2>{{ getMonthYear() }}</h2>
          <div class="date-navigation">
            <button class="nav-btn" (click)="previousMonth()">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M9.707 4.293a1 1 0 010 1.414L7.414 8l2.293 2.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z"/>
              </svg>
            </button>
            <button class="nav-btn" (click)="goToCurrentMonth()">This Month</button>
            <button class="nav-btn" (click)="nextMonth()">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6.293 4.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L8.586 8 6.293 5.707a1 1 0 010-1.414z"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="month-grid">
          <div class="month-weekdays">
            <div class="weekday-header" *ngFor="let day of weekdayNames">{{ day }}</div>
          </div>
          <div class="month-days">
            <div *ngFor="let day of monthDays()" 
                 class="month-day" 
                 [class.other-month]="!day.isCurrentMonth"
                 [class.today]="isToday(day.date)">
              <div class="day-number">{{ day.date.getDate() }}</div>
              <div class="day-tasks-month">
                <div *ngFor="let task of getTasksForDate(day.date); let i = index" 
                     class="task-dot" 
                     [class.completed]="task.completed"
                     [class]="'priority-' + task.priority"
                     [title]="getTaskTooltip(task)"
                     (click)="editTask(task)">
                  <span class="task-dot-text" *ngIf="i < 3">{{ task.title.substring(0, 15) }}{{ task.title.length > 15 ? '...' : '' }}</span>
                </div>
                <div *ngIf="getTasksForDate(day.date).length > 3" class="more-tasks">
                  +{{ getTasksForDate(day.date).length - 3 }} more
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Task Editor Modal -->
    <app-task-editor
      #taskEditor
      [todo]="editingTask"
      (save)="onSaveTask($event)"
      (close)="closeEditor()">
    </app-task-editor>
  `,
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent {
  private todoService = inject(TodoService);
  private projectService = inject(ProjectService);

  @ViewChild('taskEditor') taskEditor!: TaskEditorComponent;

  // Current view state
  private currentViewSignal = signal<CalendarView>('today');
  currentView = this.currentViewSignal.asReadonly();

  // Task editing state
  editingTask: Todo | null = null;

  // Date navigation state
  private todaySignal = signal(new Date());
  today = this.todaySignal.asReadonly();

  private weekStartSignal = signal(this.getStartOfWeek(new Date()));
  weekStart = this.weekStartSignal.asReadonly();

  private monthSignal = signal(new Date());
  month = this.monthSignal.asReadonly();

  // Get todos that have scheduling information
  scheduledTodos = computed(() => 
    this.todoService.todos().filter(todo => 
      !todo.archived && (todo.startDateTime || todo.endDateTime || todo.dueDate)
    )
  );

  // Tasks for today view
  tasksForToday = computed(() => {
    const todayDate = this.today();
    return this.scheduledTodos().filter(todo => 
      this.isTaskOnDate(todo, todayDate)
    ).sort((a, b) => {
      // Sort by start time, then end time, then priority
      const startA = a.startDateTime ? new Date(a.startDateTime) : null;
      const startB = b.startDateTime ? new Date(b.startDateTime) : null;
      
      if (startA && startB) {
        return startA.getTime() - startB.getTime();
      }
      if (startA && !startB) return -1;
      if (!startA && startB) return 1;
      
      // If no start times, sort by end time
      const endA = a.endDateTime ? new Date(a.endDateTime) : null;
      const endB = b.endDateTime ? new Date(b.endDateTime) : null;
      
      if (endA && endB) {
        return endA.getTime() - endB.getTime();
      }
      if (endA && !endB) return -1;
      if (!endA && endB) return 1;
      
      // Finally sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  });

  // Week days for week view
  weekDays = computed(() => {
    const start = this.weekStart();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push({
        date,
        name: date.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }
    return days;
  });

  // Month days for month view
  monthDays = computed(() => {
    const currentMonth = this.month();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the beginning of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    // End at the end of the week containing the last day
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month
      });
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  });

  // Weekday names for month header
  weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // View controls
  setView(view: CalendarView): void {
    this.currentViewSignal.set(view);
  }

  // Date navigation
  previousDay(): void {
    const current = this.today();
    const previous = new Date(current);
    previous.setDate(current.getDate() - 1);
    this.todaySignal.set(previous);
  }

  nextDay(): void {
    const current = this.today();
    const next = new Date(current);
    next.setDate(current.getDate() + 1);
    this.todaySignal.set(next);
  }

  goToToday(): void {
    this.todaySignal.set(new Date());
  }

  previousWeek(): void {
    const current = this.weekStart();
    const previous = new Date(current);
    previous.setDate(current.getDate() - 7);
    this.weekStartSignal.set(previous);
  }

  nextWeek(): void {
    const current = this.weekStart();
    const next = new Date(current);
    next.setDate(current.getDate() + 7);
    this.weekStartSignal.set(next);
  }

  goToCurrentWeek(): void {
    this.weekStartSignal.set(this.getStartOfWeek(new Date()));
  }

  previousMonth(): void {
    const current = this.month();
    const previous = new Date(current);
    previous.setMonth(current.getMonth() - 1);
    this.monthSignal.set(previous);
  }

  nextMonth(): void {
    const current = this.month();
    const next = new Date(current);
    next.setMonth(current.getMonth() + 1);
    this.monthSignal.set(next);
  }

  goToCurrentMonth(): void {
    this.monthSignal.set(new Date());
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  getWeekRange(): string {
    const start = this.weekStart();
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    return `${startStr} - ${endStr}`;
  }

  getMonthYear(): string {
    return this.month().toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  }

  // Task operations
  toggleTask(taskId: string): void {
    this.todoService.toggleTodo(taskId);
  }

  // Task editing methods
  editTask(task: Todo): void {
    this.editingTask = task;
    this.taskEditor.open();
  }

  onSaveTask(updates: Partial<Todo>): void {
    if (this.editingTask) {
      this.todoService.updateTodo(this.editingTask.id, updates);
    }
    this.closeEditor();
  }

  closeEditor(): void {
    this.editingTask = null;
  }

  // Get tasks for a specific date (week view)
  getTasksForDate(date: Date): Todo[] {
    return this.scheduledTodos().filter(todo => 
      this.isTaskOnDate(todo, date)
    ).sort((a, b) => {
      // Sort by start time, then end time, then priority
      const startA = a.startDateTime ? new Date(a.startDateTime) : null;
      const startB = b.startDateTime ? new Date(b.startDateTime) : null;
      
      if (startA && startB) {
        return startA.getTime() - startB.getTime();
      }
      if (startA && !startB) return -1;
      if (!startA && startB) return 1;
      
      // If no start times, sort by end time
      const endA = a.endDateTime ? new Date(a.endDateTime) : null;
      const endB = b.endDateTime ? new Date(b.endDateTime) : null;
      
      if (endA && endB) {
        return endA.getTime() - endB.getTime();
      }
      if (endA && !endB) return -1;
      if (!endA && endB) return 1;
      
      // Finally sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  // Check if a task occurs on a specific date
  isTaskOnDate(task: Todo, date: Date): boolean {
    // Check start date
    if (task.startDateTime && this.isSameDay(new Date(task.startDateTime), date)) {
      return true;
    }
    // Check end date
    if (task.endDateTime && this.isSameDay(new Date(task.endDateTime), date)) {
      return true;
    }
    // Check if task spans multiple days and includes this date
    if (task.startDateTime && task.endDateTime) {
      const start = new Date(task.startDateTime);
      const end = new Date(task.endDateTime);
      return date >= start && date <= end;
    }
    // Fallback to due date
    if (task.dueDate && this.isSameDay(new Date(task.dueDate), date)) {
      return true;
    }
    return false;
  }

  // Get display time for task cards
  getTaskDisplayTime(task: Todo): string | null {
    if (task.startDateTime) {
      const date = new Date(task.startDateTime);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }
    // If no start time but has due date, show due time
    if (task.dueDate) {
      const date = new Date(task.dueDate);
      // Only show time if it's not midnight (indicating a specific time was set)
      if (date.getHours() !== 0 || date.getMinutes() !== 0) {
        return `Due: ${date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })}`;
      } else {
        return 'Due today';
      }
    }
    return null;
  }

  // Get time range display
  getTaskTimeRange(task: Todo): string | null {
    if (task.startDateTime && task.endDateTime) {
      const start = new Date(task.startDateTime);
      const end = new Date(task.endDateTime);
      const startTime = start.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      const endTime = end.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      return `${startTime} - ${endTime}`;
    }
    // Show due date info if no start/end times
    if (task.dueDate && !task.startDateTime && !task.endDateTime) {
      const date = new Date(task.dueDate);
      if (date.getHours() !== 0 || date.getMinutes() !== 0) {
        return `Due at ${date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })}`;
      } else {
        return 'Due today';
      }
    }
    return null;
  }

  // Format duration for display
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

  // Get task tooltip for month view
  getTaskTooltip(task: Todo): string {
    let tooltip = task.title;
    
    if (task.startDateTime || task.dueDate) {
      const time = this.getTaskDisplayTime(task);
      if (time) {
        tooltip += ` (${time})`;
      }
    }
    
    if (task.description) {
      tooltip += ` - ${task.description}`;
    }
    
    return tooltip;
  }

  // Project helpers
  getProjectName(projectId: string): string {
    const project = this.projectService.projects().find(p => p.id === projectId);
    return project?.name || 'No Project';
  }

  getProjectColor(projectId: string): string {
    const project = this.projectService.projects().find(p => p.id === projectId);
    return project?.color || '#6b7280';
  }

  getProjectIcon(projectId: string): string {
    const project = this.projectService.projects().find(p => p.id === projectId);
    return project?.icon || '📋';
  }

  // Utility methods
  isToday(date: Date): boolean {
    const today = new Date();
    return this.isSameDay(date, today);
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  private getStartOfWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }
}