import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TodoService } from '../../services/todo.service';
import { ProjectService } from '../../services/project.service';
import { Todo } from '../../models/todo.model';

type CalendarView = 'today' | 'week';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule],
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

          <div *ngFor="let task of tasksForToday()" class="task-card" [class.completed]="task.completed">
            <div class="task-time" *ngIf="getTaskTime(task)">
              {{ getTaskTime(task) }}
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
              <h3 class="task-title" [class.completed]="task.completed">{{ task.title }}</h3>
              <p class="task-description" *ngIf="task.description">{{ task.description }}</p>
              <div class="task-actions">
                <button class="action-btn" (click)="toggleTask(task.id)">
                  {{ task.completed ? 'Mark Incomplete' : 'Mark Complete' }}
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
              <div *ngFor="let task of getTasksForDate(day.date)" 
                   class="task-item-small" 
                   [class.completed]="task.completed"
                   [style.border-left-color]="getProjectColor(task.projectId!)">
                <div class="task-time-small" *ngIf="getTaskTime(task)">
                  {{ getTaskTime(task) }}
                </div>
                <div class="task-title-small">{{ task.title }}</div>
                <div class="task-project-small">{{ getProjectName(task.projectId!) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent {
  private todoService = inject(TodoService);
  private projectService = inject(ProjectService);

  currentView = signal<CalendarView>('today');
  today = signal(new Date());
  weekStart = signal(this.getWeekStart(new Date()));

  // Get all todos with due dates
  scheduledTodos = computed(() => 
    this.todoService.todos().filter(todo => 
      todo.dueDate && !todo.archived && todo.projectId
    )
  );

  // Tasks for today view
  tasksForToday = computed(() => {
    const todayDate = this.today();
    return this.scheduledTodos().filter(todo => 
      this.isSameDay(new Date(todo.dueDate!), todayDate)
    ).sort((a, b) => {
      // Sort by time if available, then by priority
      const timeA = this.getTaskTime(a);
      const timeB = this.getTaskTime(b);
      if (timeA && timeB) {
        return timeA.localeCompare(timeB);
      }
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
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date
      });
    }
    return days;
  });

  setView(view: CalendarView) {
    this.currentView.set(view);
  }

  // Today view navigation
  previousDay() {
    const current = this.today();
    const previous = new Date(current);
    previous.setDate(current.getDate() - 1);
    this.today.set(previous);
  }

  nextDay() {
    const current = this.today();
    const next = new Date(current);
    next.setDate(current.getDate() + 1);
    this.today.set(next);
  }

  goToToday() {
    this.today.set(new Date());
  }

  // Week view navigation
  previousWeek() {
    const current = this.weekStart();
    const previous = new Date(current);
    previous.setDate(current.getDate() - 7);
    this.weekStart.set(previous);
  }

  nextWeek() {
    const current = this.weekStart();
    const next = new Date(current);
    next.setDate(current.getDate() + 7);
    this.weekStart.set(next);
  }

  goToCurrentWeek() {
    this.weekStart.set(this.getWeekStart(new Date()));
  }

  // Helper methods
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

  isToday(date: Date): boolean {
    return this.isSameDay(date, new Date());
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  getWeekStart(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day; // Sunday = 0
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  getTasksForDate(date: Date): Todo[] {
    return this.scheduledTodos().filter(todo => 
      todo.dueDate && this.isSameDay(new Date(todo.dueDate), date)
    ).sort((a, b) => {
      const timeA = this.getTaskTime(a);
      const timeB = this.getTaskTime(b);
      if (timeA && timeB) {
        return timeA.localeCompare(timeB);
      }
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  getTaskTime(task: Todo): string | null {
    if (!task.dueDate) return null;
    const date = new Date(task.dueDate);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    // Only show time if it's not midnight (00:00)
    if (hours === 0 && minutes === 0) return null;
    
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }

  getProjectName(projectId: string): string {
    const project = this.projectService.getProjectById(projectId);
    return project?.name || 'Unknown Project';
  }

  getProjectColor(projectId: string): string {
    const project = this.projectService.getProjectById(projectId);
    return project?.color || '#6b7280';
  }

  getProjectIcon(projectId: string): string {
    const project = this.projectService.getProjectById(projectId);
    return project?.icon || '📋';
  }

  toggleTask(taskId: string) {
    this.todoService.toggleTodo(taskId);
  }
}