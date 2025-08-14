import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterType, SortType } from '../../models/todo.model';

@Component({
  selector: 'app-todo-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filters-container">
      <!-- Search Bar -->
      <div class="search-section">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" 
                 class="search-input"
                 [value]="searchTerm"
                 (input)="onSearchChange($event)"
                 placeholder="Search todos...">
          <button class="clear-search" 
                  *ngIf="searchTerm"
                  (click)="clearSearch()"
                  title="Clear search">
            ✕
          </button>
        </div>
      </div>

      <!-- Stats Dashboard -->
      <div class="stats-dashboard">
        <div class="stat-card total">
          <div class="stat-number">{{ stats.total }}</div>
          <div class="stat-label">Total</div>
        </div>
        <div class="stat-card active">
          <div class="stat-number">{{ stats.active }}</div>
          <div class="stat-label">Active</div>
        </div>
        <div class="stat-card completed">
          <div class="stat-number">{{ stats.completed }}</div>
          <div class="stat-label">Done</div>
        </div>
        <div class="stat-card priority" *ngIf="stats.highPriority > 0">
          <div class="stat-number">{{ stats.highPriority }}</div>
          <div class="stat-label">High Priority</div>
        </div>
        <div class="stat-card overdue" *ngIf="stats.overdue > 0">
          <div class="stat-number">{{ stats.overdue }}</div>
          <div class="stat-label">Overdue</div>
        </div>
      </div>

      <!-- Filter and Sort Controls -->
      <div class="controls-section">
        <div class="filter-group">
          <label class="control-label">Show:</label>
          <div class="filter-buttons">
            <button class="filter-btn" 
                    [class.active]="currentFilter === 'all'"
                    (click)="onFilterChange('all')">
              <span class="btn-icon">📋</span>
              All
            </button>
            <button class="filter-btn" 
                    [class.active]="currentFilter === 'active'"
                    (click)="onFilterChange('active')">
              <span class="btn-icon">⏳</span>
              Active
            </button>
            <button class="filter-btn" 
                    [class.active]="currentFilter === 'completed'"
                    (click)="onFilterChange('completed')">
              <span class="btn-icon">✅</span>
              Completed
            </button>
            <button class="filter-btn" 
                    [class.active]="currentFilter === 'archived'"
                    (click)="onFilterChange('archived')">
              <span class="btn-icon">📦</span>
              Archived
            </button>
          </div>
        </div>

        <div class="sort-group">
          <label class="control-label">Sort by:</label>
          <select class="sort-select" 
                  [value]="currentSort"
                  (change)="onSortChange($event)">
            <option value="created">📅 Date Created</option>
            <option value="priority">🎯 Priority</option>
            <option value="dueDate">⏰ Due Date</option>
            <option value="alphabetical">🔤 Alphabetical</option>
          </select>
        </div>

        <div class="action-group" *ngIf="stats.completed > 0">
          <button class="clear-completed-btn" 
                  (click)="onClearCompleted()"
                  title="Remove all completed todos">
            <span class="btn-icon">🗑️</span>
            Clear Completed
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./todo-filters.component.css']
})
export class TodoFiltersComponent {
  @Input({ required: true }) currentFilter!: FilterType;
  @Input({ required: true }) currentSort!: SortType;
  @Input({ required: true }) searchTerm!: string;
  @Input({ required: true }) stats!: {
    total: number;
    completed: number;
    active: number;
    archived: number;
    highPriority: number;
    overdue: number;
  };

  @Output() filterChange = new EventEmitter<FilterType>();
  @Output() sortChange = new EventEmitter<SortType>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() clearCompleted = new EventEmitter<void>();

  onFilterChange(filter: FilterType): void {
    this.filterChange.emit(filter);
  }

  onSortChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.sortChange.emit(target.value as SortType);
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchChange.emit(target.value);
  }

  clearSearch(): void {
    this.searchChange.emit('');
  }

  onClearCompleted(): void {
    this.clearCompleted.emit();
  }
}