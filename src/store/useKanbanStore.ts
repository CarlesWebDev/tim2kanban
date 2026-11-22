// import { create } from "zustand";
// import type {
//   CreateTaskPayload,
//   Task,
//   UpdateTaskPayload,
// } from "../types/kanban";

// export interface TaskActionResult {
//   ok: boolean;
//   error?: string;
//   fieldErrors?: Record<string, string>;
// }

// interface ApiErrorResponse {
//   error?: string;
//   details?: Array<{ field: string; message: string }>;
// }

// function parseApiError(
//   data: ApiErrorResponse | null,
//   fallbackMessage: string,
// ): TaskActionResult {
//   const fieldErrors: Record<string, string> = {};

//   if (Array.isArray(data?.details)) {
//     for (const issue of data.details) {
//       if (issue.field && !fieldErrors[issue.field]) {
//         fieldErrors[issue.field] = issue.message;
//       }
//     }
//   }

//   return {
//     ok: false,
//     error: data?.error ?? fallbackMessage,
//     fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
//   };
// }

// async function safeJson<T>(res: Response): Promise<T | null> {
//   try {
//     return (await res.json()) as T;
//   } catch {
//     return null;
//   }
// }

// interface KanbanState {
//   tasks: Task[];
//   isLoading: boolean;
//   error: string | null;
//   fetchTasks: () => Promise<void>;
//   addTask: (payload: CreateTaskPayload) => Promise<TaskActionResult>;
//   updateTask: (
//     id: string,
//     payload: UpdateTaskPayload,
//   ) => Promise<TaskActionResult>;
//   deleteTask: (id: string) => Promise<void>;
// }

// export const useKanbanStore = create<KanbanState>((set) => ({
//   tasks: [],
//   isLoading: false,
//   error: null,

//   fetchTasks: async () => {
//     set({ isLoading: true, error: null });
//     try {
//       const res = await fetch("/api/tasks", { cache: "no-store" });
//       if (!res.ok) throw new Error("Gagal memuat daftar task");
//       const data: { tasks: Task[] } = await res.json();
//       set({ tasks: data.tasks, isLoading: false });
//     } catch (err) {
//       set({
//         error: err instanceof Error ? err.message : "Terjadi kesalahan",
//         isLoading: false,
//       });
//     }
//   },

//   addTask: async (payload) => {
//     set({ error: null });
//     try {
//       const res = await fetch("/api/tasks", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       if (!res.ok) {
//         const errorData = await safeJson<ApiErrorResponse>(res);
//         return parseApiError(errorData, "Gagal menambahkan task");
//       }

//       const data: { task: Task } = await res.json();
//       set((state) => ({ tasks: [data.task, ...state.tasks] }));
//       return { ok: true };
//     } catch (err) {
//       const message =
//         err instanceof Error ? err.message : "Gagal terhubung ke server";
//       return { ok: false, error: message };
//     }
//   },

//   updateTask: async (id, payload) => {
//     set({ error: null });
//     try {
//       const res = await fetch(`/api/tasks/${id}`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       if (!res.ok) {
//         const errorData = await safeJson<ApiErrorResponse>(res);
//         const result = parseApiError(errorData, "Gagal memperbarui task");
//         if (!result.fieldErrors && result.error) {
//           set({ error: result.error });
//         }
//         return result;
//       }

//       const data: { task: Task } = await res.json();
//       set((state) => ({
//         tasks: state.tasks.map((task) => (task.id === id ? data.task : task)),
//       }));
//       return { ok: true };
//     } catch (err) {
//       const message =
//         err instanceof Error ? err.message : "Gagal terhubung ke server";
//       set({ error: message });
//       return { ok: false, error: message };
//     }
//   },

//   deleteTask: async (id) => {
//     set({ error: null });
//     try {
//       const res = await fetch(`/api/tasks/${id}`, {
//         method: "DELETE",
//       });
//       if (!res.ok) throw new Error("Gagal menghapus task");
//       set((state) => ({
//         tasks: state.tasks.filter((task) => task.id !== id),
//       }));
//     } catch (err) {
//       set({ error: err instanceof Error ? err.message : "Terjadi kesalahan" });
//     }
//   },
// }));
