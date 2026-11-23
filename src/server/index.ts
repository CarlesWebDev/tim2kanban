import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { tasks } from "@/data/kanban";
import { Task, TaskPriority, TaskStatus } from "@/types/kanban";

const app = new Hono().basePath("/api");

const ALLOWED_STATUSES: TaskStatus[] = ["todo", "in-progress", "done"];
const ALLOWED_PRIORITIES: TaskPriority[] = ["low", "medium", "high"];

const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Judul task tidak boleh kosong"),
  description: z.string().trim().min(1, "Deskripsi task tidak boleh kosong"),
  status: z.enum(["todo", "in-progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
});

const updateTaskSchema = z.object({
  id: z.string().min(1, "ID task wajib diisi"),
  title: z.string().trim().min(1, "Judul task tidak boleh kosong").optional(),
  description: z.string().trim().min(1, "Deskripsi task tidak boleh kosong").optional(),
  status: z.enum(["todo", "in-progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
});

const deleteTaskQuerySchema = z.object({
  id: z.string().optional(),
});

const formatZodErrors = (issues: z.ZodIssue[]) => {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const field = String(issue.path[0] ?? "");
    if (field && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }
  return fieldErrors;
};

const routes = app
  .get("/tasks", (c) => {
    return c.json(tasks, 200);
  })
  .post(
    "/tasks",
    zValidator("json", createTaskSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          {
            error: "Validasi gagal",
            fieldErrors: formatZodErrors(result.error.issues),
          },
          400
        );
      }
    }),
    async (c) => {
      const body = await c.req.json();

      const status: TaskStatus = ALLOWED_STATUSES.includes(body.status)
        ? body.status
        : "todo";

      const priority: TaskPriority = ALLOWED_PRIORITIES.includes(body.priority)
        ? body.priority
        : "medium";

      const now = new Date();
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: body.title.trim(),
        description: body.description.trim(),
        status,
        priority,
        createdAt: now,
        updatedAt: now,
      };

      tasks.push(newTask);
      return c.json(newTask, 201);
    }
  )
  .patch(
    "/tasks",
    zValidator("json", updateTaskSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          {
            error: "Validasi gagal",
            fieldErrors: formatZodErrors(result.error.issues),
          },
          400
        );
      }
    }),
    async (c) => {
      const body = await c.req.json();

      const idx = tasks.findIndex((t) => t.id === body.id);
      if (idx === -1) {
        return c.json({ error: "Task tidak ditemukan" }, 404);
      }

      const current = tasks[idx];
      const nextStatus: TaskStatus =
        body.status && ALLOWED_STATUSES.includes(body.status)
          ? body.status
          : current.status;

      const nextPriority: TaskPriority =
        body.priority && ALLOWED_PRIORITIES.includes(body.priority)
          ? body.priority
          : current.priority;

      tasks[idx] = {
        ...current,
        title:
          typeof body.title === "string" && body.title.trim()
            ? body.title.trim()
            : current.title,
        description:
          typeof body.description === "string" && body.description.trim()
            ? body.description.trim()
            : current.description,
        status: nextStatus,
        priority: nextPriority,
        updatedAt: new Date(),
      };

      return c.json(tasks[idx], 200);
    }
  )
  .delete("/tasks", zValidator("query", deleteTaskQuerySchema), async (c) => {
    const queryId = c.req.query("id");
    let targetId = queryId;

    if (!targetId) {
      try {
        const body = await c.req.json();
        targetId = body?.id;
      } catch {
        targetId = undefined;
      }
    }

    if (!targetId) {
      return c.json({ error: "ID task wajib diisi" }, 400);
    }

    const idx = tasks.findIndex((t) => t.id === targetId);
    if (idx === -1) {
      return c.json({ error: "Task tidak ditemukan" }, 404);
    }

    const [deleted] = tasks.splice(idx, 1);
    return c.json({ message: "Task dihapus", task: deleted }, 200);
  });

export type AppType = typeof routes;
export default app;