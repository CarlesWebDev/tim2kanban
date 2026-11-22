import { create } from "zustand";
import { columns } from "@/data/kanban";
import { Column, Task, TaskPriority, TaskStatus } from "@/types/kanban";

interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

interface KanbanStore {
  tasks: Task[];
  columns: Column[];
  isLoading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  addTask: (input: CreateTaskInput) => Promise<void>;
  updateTask: (input: UpdateTaskInput) => Promise<void>;
  moveTask: (id: string, status: TaskStatus) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

type TaskApiPayload = Omit<Task, "createdAt" | "updatedAt"> & {
  createdAt: string | Date;
  updatedAt: string | Date;
};

const normalizeTask = (raw: TaskApiPayload): Task => ({
  ...raw,
  createdAt: new Date(raw.createdAt),
  updatedAt: new Date(raw.updatedAt),
});

export const useKanbanStore = create<KanbanStore>((set, get) => ({
  tasks: [],
  columns,
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/tasks", { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal mengambil data tasks");
      const data = await res.json();
      set({ tasks: data.map(normalizeTask), isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Terjadi kesalahan",
        isLoading: false,
      });
    }
  },

  addTask: async (input) => {
    set({ error: null });
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Gagal menambah task");
    }
    const created = normalizeTask(await res.json());
    set({ tasks: [created, ...get().tasks] });
  },

  updateTask: async (input) => {
    set({ error: null });
    const res = await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Gagal mengupdate task");
    }
    const updated = normalizeTask(await res.json());
    set({
      tasks: get().tasks.map((t) => (t.id === updated.id ? updated : t)),
    });
  },

  moveTask: async (id, status) => {
    await get().updateTask({ id, status });
  },

  deleteTask: async (id) => {
    set({ error: null });
    const res = await fetch(`/api/tasks?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Gagal menghapus task");
    }
    set({ tasks: get().tasks.filter((t) => t.id !== id) });
  },
}));