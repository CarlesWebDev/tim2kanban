import type { Task, TaskStatus } from '../types/kanban';

export const KANBAN_COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

export const initialTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Setup Next.js & Shadcn/UI',
    description: 'Inisialisasi proyek App Router, Tailwind CSS, dan komponen UI.',
    status: 'done',
    priority: 'high',
    createdAt: '2026-11-19T08:00:00.000Z',
  },
  {
    id: 'task-2',
    title: 'Bangun Backend Hono',
    description: 'Buat endpoint CRUD GET, POST, PATCH, dan DELETE di /api/tasks.',
    status: 'in-progress',
    priority: 'high',
    createdAt: '2026-11-19T09:00:00.000Z',
  },
  {
    id: 'task-3',
    title: 'Integrasi Store Zustand',
    description: 'Hubungkan useKanbanStore ke endpoint API Hono dan cek tab Network.',
    status: 'todo',
    priority: 'medium',
    createdAt: '2026-11-19T10:00:00.000Z',
  },
];