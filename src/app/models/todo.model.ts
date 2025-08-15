export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  archived: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  startDateTime?: Date;
  endDateTime?: Date;
  createdAt: Date;
  updatedAt: Date;
  category?: string;
  parentId?: string;
  projectId?: string;
  subtasks: Todo[];
  isExpanded: boolean;
  order: number;
}

export type FilterType = 'all' | 'active' | 'completed' | 'archived';
export type SortType = 'created' | 'priority' | 'dueDate' | 'alphabetical';