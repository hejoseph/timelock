import { Injectable, signal, computed, inject } from '@angular/core';
import { Project, ProjectStats } from '../models/project.model';
import { IndexedDBService } from './indexeddb.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private indexedDBService = inject(IndexedDBService);
  
  // Signals for reactive state management
  private projectsSignal = signal<Project[]>([]);
  private currentProjectIdSignal = signal<string | null>(null);

  // Computed signals for derived state
  projects = this.projectsSignal.asReadonly();
  currentProjectId = this.currentProjectIdSignal.asReadonly();
  
  currentProject = computed(() => {
    const projectId = this.currentProjectIdSignal();
    if (!projectId) return null;
    return this.projectsSignal().find(p => p.id === projectId) || null;
  });

  activeProjects = computed(() => 
    this.projectsSignal().filter(p => !p.isArchived).sort((a, b) => a.order - b.order)
  );

  archivedProjects = computed(() => 
    this.projectsSignal().filter(p => p.isArchived).sort((a, b) => a.order - b.order)
  );

  constructor() {
    this.initializeData();
  }

  private async initializeData(): Promise<void> {
    try {
      await this.loadProjects();
      
      // Create default project if no projects exist
      if (this.projectsSignal().length === 0) {
        await this.createDefaultProject();
      }
    } catch (error) {
      console.error('Error initializing project data:', error);
    }
  }

  private async createDefaultProject(): Promise<void> {
    const defaultProject: Project = {
      id: this.generateId(),
      name: 'Personal Tasks',
      description: 'Default project for personal tasks',
      color: '#3b82f6',
      icon: '📋',
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false,
      order: 0
    };

    await this.addProject(defaultProject);
    this.setCurrentProject(defaultProject.id);
  }

  async addProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'order'>): Promise<string> {
    const projects = this.projectsSignal();
    const maxOrder = Math.max(0, ...projects.map(p => p.order));
    
    const newProject: Project = {
      ...projectData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      order: maxOrder + 1
    };

    this.projectsSignal.update(projects => [...projects, newProject]);
    await this.saveProjects();
    return newProject.id;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<void> {
    this.projectsSignal.update(projects =>
      projects.map(project =>
        project.id === id
          ? { ...project, ...updates, updatedAt: new Date() }
          : project
      )
    );
    await this.saveProjects();
  }

  async deleteProject(id: string): Promise<void> {
    this.projectsSignal.update(projects => projects.filter(p => p.id !== id));
    
    // If deleting current project, clear current project
    if (this.currentProjectIdSignal() === id) {
      this.currentProjectIdSignal.set(null);
    }
    
    await this.saveProjects();
  }

  async archiveProject(id: string): Promise<void> {
    await this.updateProject(id, { isArchived: true });
  }

  async unarchiveProject(id: string): Promise<void> {
    await this.updateProject(id, { isArchived: false });
  }

  setCurrentProject(projectId: string | null): void {
    this.currentProjectIdSignal.set(projectId);
  }

  getProjectById(id: string): Project | undefined {
    return this.projectsSignal().find(p => p.id === id);
  }

  async reorderProjects(fromIndex: number, toIndex: number): Promise<void> {
    const projects = [...this.activeProjects()];
    const [movedProject] = projects.splice(fromIndex, 1);
    projects.splice(toIndex, 0, movedProject);
    
    // Update order values
    const updatedProjects = projects.map((project, index) => ({
      ...project,
      order: index,
      updatedAt: new Date()
    }));
    
    // Update the full projects list
    this.projectsSignal.update(allProjects =>
      allProjects.map(project => {
        const updated = updatedProjects.find(up => up.id === project.id);
        return updated || project;
      })
    );
    
    await this.saveProjects();
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private async saveProjects(): Promise<void> {
    try {
      await this.indexedDBService.saveProjects(this.projectsSignal());
    } catch (error) {
      console.error('Error saving projects to IndexedDB:', error);
    }
  }

  private async loadProjects(): Promise<void> {
    try {
      const projects = await this.indexedDBService.loadProjects();
      this.projectsSignal.set(projects);
    } catch (error) {
      console.error('Error loading projects from IndexedDB:', error);
    }
  }
}