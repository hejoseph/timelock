export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
  order: number;
}

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  overdueTasks: number;
  highPriorityTasks: number;
}

export const DEFAULT_PROJECT_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Yellow
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16', // Lime
  '#ec4899', // Pink
  '#6b7280'  // Gray
];

export const PROJECT_ICONS = [
  '📋', '💼', '🎯', '🚀', '⭐', '🔥', '💡', '🎨', '🏠', '💻',
  '📱', '🎵', '📚', '🏋️', '🍳', '🌱', '✈️', '🎮', '📷', '🎪'
];