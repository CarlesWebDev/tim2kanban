import { create } from "zustand";
import { columns } from "@/data/kanban";
import { hc } from "hono/client";
import type { AppType } from "@/server";
import { Column, Task, TaskPriority, TaskStatus } from "@/types/kanban";
import type { TaskSubmitResult } from "@/components/kanban/TaskDialog";

interface CreateTaskInput {
  title: string;
  description: string;
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
  addTask: (input: CreateTaskInput) => Promise<TaskSubmitResult>;
  updateTask: (input: UpdateTaskInput) => Promise<TaskSubmitResult>;
  moveTask: (id: string, status: TaskStatus) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

type TaskApiPayload = Omit<Task, "createdAt" | "updatedAt"> & {
  createdAt: string | Date;
  updatedAt: string | Date;
};

const client = hc<AppType>("/");

const normalizeTask = (raw: TaskApiPayload): Task => ({
  ...raw,
  createdAt: new Date(raw.createdAt),
  updatedAt: new Date(raw.updatedAt),
});

const parseErrorResponse = async (
  res: Response,
  fallback: string
): Promise<TaskSubmitResult> => {
  const errData = await res.json().catch(() => ({}));
  return {
    ok: false,
    error:
      "error" in errData && typeof errData.error === "string"
        ? errData.error
        : fallback,
    fieldErrors:
      "fieldErrors" in errData && typeof errData.fieldErrors === "object"
        ? (errData.fieldErrors as Record<string, string>)
        : undefined,
  };
};

export const useKanbanStore = create<KanbanStore>((set, get) => ({
  tasks: [],
  columns,
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await client.api.tasks.$get({}, {
        init: { cache: "no-store" },
      });
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
    const res = await client.api.tasks.$post({ json: input });
    if (!res.ok) {
      return parseErrorResponse(res, "Gagal menambah task");
    }
    const created = normalizeTask(await res.json());
    set({ tasks: [created, ...get().tasks] });
    return { ok: true };
  },

  updateTask: async (input) => {
    set({ error: null });
    const res = await client.api.tasks.$patch({ json: input });
    if (!res.ok) {
      return parseErrorResponse(res, "Gagal mengupdate task");
    }
    const updated = normalizeTask(await res.json());
    set({
      tasks: get().tasks.map((t) => (t.id === updated.id ? updated : t)),
    });
    return { ok: true };
  },

  moveTask: async (id, status) => {
    const result = await get().updateTask({ id, status });
    if (!result.ok) {
      set({ error: result.error ?? "Gagal memindahkan task" });
    }
  },

  deleteTask: async (id) => {
    set({ error: null });
    const res = await client.api.tasks.$delete({
      query: { id },
    });
    if (!res.ok) {
      const errResult = await parseErrorResponse(res, "Gagal menghapus task");
      throw new Error(errResult.error);
    }
    set({ tasks: get().tasks.filter((t) => t.id !== id) });
  },
}));