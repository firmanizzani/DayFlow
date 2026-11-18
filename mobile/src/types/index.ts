export type Status = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: string;
  name: string;
  email: string;
  timezone: string;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  priority: Priority;
  status: Status;
  dueAt: string | null;
  completedAt: string | null;
  totalSubtasks: number;
  completedSubtasks: number;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Plan {
  id: string;
  taskId: string;
  occurrenceId: string | null;
  startAt: string;
  endAt: string;
  status: 'PLANNED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  reminderMinutesBefore: number | null;
  previousSessionId: string | null;
}

export interface Preferences {
  theme: 'LIGHT' | 'DARK' | 'SYSTEM';
  notificationsEnabled: boolean;
  defaultReminder: number;
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
}

export interface Overview {
  completedTasks: number;
  plannedTasks: number;
  completedPlannedTasks: number;
  totalFocusSeconds: number;
  completionRate: number;
}

export interface Dashboard {
  date: string;
  overview: Overview;
  sessions: Plan[];
  unscheduledTasks: Task[];
}

export interface Rule {
  id: string;
  taskId: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  repeatInterval: number;
  weekdays: string;
  startDate: string;
  endDate: string | null;
  active: boolean;
}

export interface Occurrence {
  id: string;
  ruleId: string;
  taskId: string;
  occurrenceDate: string;
  title: string;
  status: Status | 'SKIPPED';
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  last: boolean;
}
