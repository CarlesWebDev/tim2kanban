import { create } from 'zustand';
import type { CreateTaskPayload, Task, UpdateTaskPayload } from '../types/kanban';

interface KanbanState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  addTask: (payload: CreateTaskPayload) => Promise<void>;
  updateTask: (id: string, payload: UpdateTaskPayload) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useKanbanStore = create<KanbanState>((set) => ({
  tasks: [],
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/tasks', { cache: 'no-store' });
      if (!res.ok) throw new Error('Gagal memuat daftar task');
      const data: { tasks: Task[] } = await res.json();
      set({ tasks: data.tasks, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Terjadi kesalahan',
        isLoading: false,
      });
    }
  },

  addTask: async (payload) => {
    set({ error: null });
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Gagal menambahkan task');
      const data: { task: Task } = await res.json();
      set((state) => ({ tasks: [data.task, ...state.tasks] }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Terjadi kesalahan' });
    }
  },

  updateTask: async (id, payload) => {
    set({ error: null });
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Gagal memperbarui task');
      const data: { task: Task } = await res.json();
      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === id ? data.task : task)),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Terjadi kesalahan' });
    }
  },

  deleteTask: async (id) => {
    set({ error: null });
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Gagal menghapus task');
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Terjadi kesalahan' });
    }
  },
}));