import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../services/project.service';
import { TodoService } from '../../services/todo.service';
import { Project, DEFAULT_PROJECT_COLORS, PROJECT_ICONS } from '../../models/project.model';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="projects-container">
      <header class="projects-header">
        <h1>Projects</h1>
        <button class="btn btn-primary" (click)="showCreateForm.set(true)">
          <span class="btn-icon">+</span>
          New Project
        </button>
      </header>

      <!-- Create Project Form -->
      <div class="create-form" *ngIf="showCreateForm()" [@slideDown]>
        <form (ngSubmit)="createProject()" #projectForm="ngForm">
          <div class="form-row">
            <div class="form-group">
              <label>Project Name</label>
              <input type="text" 
                     [(ngModel)]="newProject.name" 
                     name="name" 
                     placeholder="Enter project name"
                     required>
            </div>
            <div class="form-group">
              <label>Description</label>
              <input type="text" 
                     [(ngModel)]="newProject.description" 
                     name="description" 
                     placeholder="Optional description">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Color</label>
              <div class="color-picker">
                <div *ngFor="let color of projectColors" 
                     class="color-option" 
                     [style.background-color]="color"
                     [class.selected]="newProject.color === color"
                     (click)="newProject.color = color">
                </div>
              </div>
            </div>
            <div class="form-group">
              <label>Icon</label>
              <div class="icon-picker">
                <div *ngFor="let icon of projectIcons" 
                     class="icon-option" 
                     [class.selected]="newProject.icon === icon"
                     (click)="newProject.icon = icon">
                  {{ icon }}
                </div>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" [disabled]="!projectForm.form.valid">
              Create Project
            </button>
            <button type="button" class="btn btn-secondary" (click)="cancelCreate()">
              Cancel
            </button>
          </div>
        </form>
      </div>

      <!-- Edit Project Form -->
      <div class="create-form" *ngIf="editingProject() as project">
        <form (ngSubmit)="updateProject()" #editProjectForm="ngForm">
          <div class="form-row">
            <div class="form-group">
              <label>Project Name</label>
              <input type="text" 
                     [(ngModel)]="project.name" 
                     name="name" 
                     placeholder="Enter project name"
                     required>
            </div>
            <div class="form-group">
              <label>Description</label>
              <input type="text" 
                     [(ngModel)]="project.description" 
                     name="description" 
                     placeholder="Optional description">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Color</label>
              <div class="color-picker">
                <div *ngFor="let color of projectColors" 
                     class="color-option" 
                     [style.background-color]="color"
                     [class.selected]="project.color === color"
                     (click)="project.color = color">
                </div>
              </div>
            </div>
            <div class="form-group">
              <label>Icon</label>
              <div class="icon-picker">
                <div *ngFor="let icon of projectIcons" 
                     class="icon-option" 
                     [class.selected]="project.icon === icon"
                     (click)="project.icon = icon">
                  {{ icon }}
                </div>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" [disabled]="!editProjectForm.form.valid">
              Update Project
            </button>
            <button type="button" class="btn btn-secondary" (click)="cancelEdit()">
              Cancel
            </button>
          </div>
        </form>
      </div>

      <!-- Projects Grid -->
      <div class="projects-grid">
        <div *ngFor="let project of projectService.activeProjects(); trackBy: trackByProjectId" 
             class="project-card"
             [routerLink]="['/project', project.id]">
          <div class="project-header">
            <div class="project-icon" [style.background-color]="project.color">
              {{ project.icon || '📋' }}
            </div>
            <div class="project-info">
              <h3 class="project-name">{{ project.name }}</h3>
              <p class="project-description" *ngIf="project.description">
                {{ project.description }}
              </p>
            </div>
            <div class="project-actions" (click)="$event.stopPropagation()">
              <button class="action-btn" (click)="editProject(project)" title="Edit">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61z"/>
                </svg>
              </button>
              <button class="action-btn delete-btn" (click)="deleteProject(project)" title="Delete">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675a.75.75 0 10-1.492.15l.66 6.6A1.75 1.75 0 005.405 15h5.19c.9 0 1.652-.681 1.741-1.576l.66-6.6a.75.75 0 00-1.492-.149l-.66 6.6a.25.25 0 01-.249.225h-5.19a.25.25 0 01-.249-.225l-.66-6.6z"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="project-stats">
            <div class="stat">
              <span class="stat-value">{{ getProjectStats(project.id).totalTasks }}</span>
              <span class="stat-label">Tasks</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ getProjectStats(project.id).completedTasks }}</span>
              <span class="stat-label">Done</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ getProjectStats(project.id).activeTasks }}</span>
              <span class="stat-label">Active</span>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="projectService.activeProjects().length === 0">
          <div class="empty-icon">📁</div>
          <h3>No Projects Yet</h3>
          <p>Create your first project to start organizing your tasks</p>
          <button class="btn btn-primary" (click)="showCreateForm.set(true)">
            Create Project
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent {
  projectService = inject(ProjectService);
  todoService = inject(TodoService);
  
  showCreateForm = signal(false);
  editingProject = signal<Project | null>(null);
  projectColors = DEFAULT_PROJECT_COLORS;
  projectIcons = PROJECT_ICONS;
  
  newProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'order'> = {
    name: '',
    description: '',
    color: DEFAULT_PROJECT_COLORS[0],
    icon: PROJECT_ICONS[0],
    isArchived: false
  };

  async createProject(): Promise<void> {
    if (!this.newProject.name.trim()) return;
    
    try {
      await this.projectService.addProject(this.newProject);
      this.cancelCreate();
    } catch (error) {
      console.error('Error creating project:', error);
    }
  }

  cancelCreate(): void {
    this.showCreateForm.set(false);
    this.newProject = {
      name: '',
      description: '',
      color: DEFAULT_PROJECT_COLORS[0],
      icon: PROJECT_ICONS[0],
      isArchived: false
    };
  }

  editProject(project: Project): void {
    this.editingProject.set({ ...project });
  }

  async updateProject(): Promise<void> {
    const project = this.editingProject();
    if (!project || !project.name.trim()) return;

    try {
      await this.projectService.updateProject(project.id, {
        name: project.name,
        description: project.description,
        color: project.color,
        icon: project.icon,
      });
      this.cancelEdit();
    } catch (error) {
      console.error('Error updating project:', error);
    }
  }

  cancelEdit(): void {
    this.editingProject.set(null);
  }

  async deleteProject(project: Project): Promise<void> {
    if (confirm(`Are you sure you want to delete "${project.name}"? This will also delete all tasks in this project.`)) {
      try {
        await this.projectService.deleteProject(project.id);
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  }

  getProjectStats(projectId: string) {
    const todos = this.todoService.todos();
    const projectTodos = todos.filter(todo => todo.projectId === projectId);
    
    return {
      totalTasks: projectTodos.length,
      completedTasks: projectTodos.filter(t => t.completed).length,
      activeTasks: projectTodos.filter(t => !t.completed).length,
      overdueTasks: projectTodos.filter(t => 
        t.dueDate && !t.completed && new Date(t.dueDate) < new Date()
      ).length,
      highPriorityTasks: projectTodos.filter(t => 
        t.priority === 'high' && !t.completed
      ).length
    };
  }

  trackByProjectId(index: number, project: Project): string {
    return project.id;
  }
}