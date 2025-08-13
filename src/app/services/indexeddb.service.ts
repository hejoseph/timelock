import { Injectable } from '@angular/core';
import { Todo } from '../models/todo.model';
import { Project } from '../models/project.model';

@Injectable({
  providedIn: 'root'
})
export class IndexedDBService {
  private dbName = 'TaskFlowProDB';
  private dbVersion = 2;
  private todosStoreName = 'todos';
  private projectsStoreName = 'projects';
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Error opening IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store for todos
        if (!db.objectStoreNames.contains(this.todosStoreName)) {
          const todosStore = db.createObjectStore(this.todosStoreName, { keyPath: 'id' });
          
          // Create indexes for better querying
          todosStore.createIndex('completed', 'completed', { unique: false });
          todosStore.createIndex('priority', 'priority', { unique: false });
          todosStore.createIndex('dueDate', 'dueDate', { unique: false });
          todosStore.createIndex('createdAt', 'createdAt', { unique: false });
          todosStore.createIndex('category', 'category', { unique: false });
          todosStore.createIndex('projectId', 'projectId', { unique: false });
          
          console.log('Todos object store created');
        }

        // Create object store for projects
        if (!db.objectStoreNames.contains(this.projectsStoreName)) {
          const projectsStore = db.createObjectStore(this.projectsStoreName, { keyPath: 'id' });
          
          // Create indexes for projects
          projectsStore.createIndex('isArchived', 'isArchived', { unique: false });
          projectsStore.createIndex('createdAt', 'createdAt', { unique: false });
          projectsStore.createIndex('order', 'order', { unique: false });
          
          console.log('Projects object store created');
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB');
    }
    return this.db;
  }

  async saveTodos(todos: Todo[]): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.todosStoreName], 'readwrite');
      const store = transaction.objectStore(this.todosStoreName);

      // Clear existing data
      await new Promise<void>((resolve, reject) => {
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
      });

      // Add all todos
      const promises = todos.map(todo => {
        return new Promise<void>((resolve, reject) => {
          const request = store.add(this.serializeTodo(todo));
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });

      await Promise.all(promises);
      console.log('Todos saved to IndexedDB');
    } catch (error) {
      console.error('Error saving todos to IndexedDB:', error);
      throw error;
    }
  }

  async loadTodos(): Promise<Todo[]> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.todosStoreName], 'readonly');
      const store = transaction.objectStore(this.todosStoreName);

      return new Promise<Todo[]>((resolve, reject) => {
        const request = store.getAll();
        
        request.onsuccess = () => {
          const todos = request.result.map(todo => this.deserializeTodo(todo));
          console.log('Todos loaded from IndexedDB:', todos.length);
          resolve(todos);
        };
        
        request.onerror = () => {
          console.error('Error loading todos from IndexedDB:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error loading todos from IndexedDB:', error);
      return [];
    }
  }

  async addTodo(todo: Todo): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.todosStoreName], 'readwrite');
      const store = transaction.objectStore(this.todosStoreName);

      return new Promise<void>((resolve, reject) => {
        const request = store.add(this.serializeTodo(todo));
        request.onsuccess = () => {
          console.log('Todo added to IndexedDB:', todo.id);
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error adding todo to IndexedDB:', error);
      throw error;
    }
  }

  async updateTodo(todo: Todo): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.todosStoreName], 'readwrite');
      const store = transaction.objectStore(this.todosStoreName);

      return new Promise<void>((resolve, reject) => {
        const request = store.put(this.serializeTodo(todo));
        request.onsuccess = () => {
          console.log('Todo updated in IndexedDB:', todo.id);
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error updating todo in IndexedDB:', error);
      throw error;
    }
  }

  async deleteTodo(id: string): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.todosStoreName], 'readwrite');
      const store = transaction.objectStore(this.todosStoreName);

      return new Promise<void>((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => {
          console.log('Todo deleted from IndexedDB:', id);
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error deleting todo from IndexedDB:', error);
      throw error;
    }
  }

  async clearAllTodos(): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.todosStoreName], 'readwrite');
      const store = transaction.objectStore(this.todosStoreName);

      return new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => {
          console.log('All todos cleared from IndexedDB');
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error clearing todos from IndexedDB:', error);
      throw error;
    }
  }

  private serializeTodo(todo: Todo): any {
    return {
      ...todo,
      createdAt: todo.createdAt.toISOString(),
      updatedAt: todo.updatedAt.toISOString(),
      dueDate: todo.dueDate ? todo.dueDate.toISOString() : undefined,
      subtasks: todo.subtasks.map(subtask => this.serializeTodo(subtask))
    };
  }

  private deserializeTodo(data: any): Todo {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      subtasks: data.subtasks ? data.subtasks.map((subtask: any) => this.deserializeTodo(subtask)) : [],
      isExpanded: data.isExpanded ?? false,
      order: data.order || 0
    };
  }

  // Project methods
  async saveProjects(projects: Project[]): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.projectsStoreName], 'readwrite');
      const store = transaction.objectStore(this.projectsStoreName);

      // Clear existing data
      await new Promise<void>((resolve, reject) => {
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
      });

      // Add all projects
      const promises = projects.map(project => {
        return new Promise<void>((resolve, reject) => {
          const request = store.add(this.serializeProject(project));
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });

      await Promise.all(promises);
      console.log('Projects saved to IndexedDB');
    } catch (error) {
      console.error('Error saving projects to IndexedDB:', error);
      throw error;
    }
  }

  async loadProjects(): Promise<Project[]> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.projectsStoreName], 'readonly');
      const store = transaction.objectStore(this.projectsStoreName);

      return new Promise<Project[]>((resolve, reject) => {
        const request = store.getAll();
        
        request.onsuccess = () => {
          const projects = request.result.map(project => this.deserializeProject(project));
          console.log('Projects loaded from IndexedDB:', projects.length);
          resolve(projects);
        };
        
        request.onerror = () => {
          console.error('Error loading projects from IndexedDB:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error loading projects from IndexedDB:', error);
      return [];
    }
  }

  async addProject(project: Project): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.projectsStoreName], 'readwrite');
      const store = transaction.objectStore(this.projectsStoreName);

      return new Promise<void>((resolve, reject) => {
        const request = store.add(this.serializeProject(project));
        request.onsuccess = () => {
          console.log('Project added to IndexedDB:', project.id);
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error adding project to IndexedDB:', error);
      throw error;
    }
  }

  async updateProject(project: Project): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.projectsStoreName], 'readwrite');
      const store = transaction.objectStore(this.projectsStoreName);

      return new Promise<void>((resolve, reject) => {
        const request = store.put(this.serializeProject(project));
        request.onsuccess = () => {
          console.log('Project updated in IndexedDB:', project.id);
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error updating project in IndexedDB:', error);
      throw error;
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.projectsStoreName], 'readwrite');
      const store = transaction.objectStore(this.projectsStoreName);

      return new Promise<void>((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => {
          console.log('Project deleted from IndexedDB:', id);
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error deleting project from IndexedDB:', error);
      throw error;
    }
  }

  private serializeProject(project: Project): any {
    return {
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString()
    };
  }

  private deserializeProject(data: any): Project {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    };
  }
}