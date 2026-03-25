export type TaskType = 'task' | 'milestone' | 'deliverable';
export type TaskStatus = 'not-started' | 'in-progress' | 'completed' | 'blocked';
export type ViewType = 'list' | 'calendar' | 'gantt';

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  description: string;
  type: TaskType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  progress: number;  // 0-100
  assignee: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  projects: Project[];
  tasks: Task[];
  connectedUsers: number;
  activeView: ViewType;
  selectedProjectId: string | null;
}

export type CreateProjectPayload = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProjectPayload = Partial<Omit<Project, 'createdAt'>> & { id: string };
export type CreateTaskPayload = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTaskPayload = Partial<Omit<Task, 'createdAt'>> & { id: string };
