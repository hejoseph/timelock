import { Injectable } from '@angular/core';
import { Todo } from '../models/todo.model';

@Injectable({
  providedIn: 'root'
})
export class IndexedDBService {
  private dbName = 'TaskFlowProDB';
  private dbVersion = 1;
  private storeName = 'todos';
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
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          
          // Create indexes for better querying
          store.createIndex('completed', 'completed', { unique: false });
          store.createIndex('priority', 'priority', { unique: false });
          store.createIndex('dueDate', 'dueDate', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('category', 'category', { unique: false });
          
          console.log('Object store created');
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
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

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
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

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
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

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
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

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
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

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
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

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
}