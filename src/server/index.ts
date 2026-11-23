import { Hono } from "hono";
import { handle } from "hono/vercel"
import { tasks } from "@/data/kanban";
import { Task, TaskPriority, TaskStatus } from "@/types/kanban";

const app = new Hono().basePath("/api");

const ALLOWED_STATUSES: TaskStatus[] = ["todo", "in-progress", "done"];
const ALLOWED_PRIORITIES: TaskPriority[] = ["low", "medium", "high"];


const routes = app
  .get("/tasks", (c) => {
    return c.json(tasks, 200);
  })
  .post("/tasks", async (c) => {
    const body = await c.req.json();

    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      return c.json({ error: "Title wajib diisi" }, 400);
    }

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
      description: typeof body.description === "string" ? body.description : "",
      status,
      priority,
      createdAt: now,
      updatedAt: now,
    };

    tasks.push(newTask);
    return c.json(newTask, 201);
  })
  .patch("/tasks", async (c) => {
    const body = await c.req.json();

    if (!body.id) {
      return c.json({ error: "ID task wajib diisi" }, 400);
    }

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
        typeof body.description === "string"
          ? body.description
          : current.description,
      status: nextStatus,
      priority: nextPriority,
      updatedAt: new Date(),
    };

    return c.json(tasks[idx], 200);
  })
  .delete("/tasks", async (c) => {
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
