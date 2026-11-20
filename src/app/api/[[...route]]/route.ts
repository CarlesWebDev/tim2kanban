// import { Hono } from 'hono';
// import { handle } from 'hono/vercel';
// import { initialTasks } from '../../../data/kanban';
// import type { CreateTaskPayload, Task, UpdateTaskPayload } from '../../../types/kanban';

// const app = new Hono().basePath('/api');

// const globalForTasks = globalThis as unknown as { kanbanTasks?: Task[] };

// if (!globalForTasks.kanbanTasks) {
//   globalForTasks.kanbanTasks = [...initialTasks];
// }

// app.get('/tasks', (c) => {
//   return c.json({ tasks: globalForTasks.kanbanTasks ?? [] }, 200);
// });

// app.post('/tasks', async (c) => {
//   const body = await c.req.json<CreateTaskPayload>();

//   if (!body.title || body.title.trim() === '') {
//     return c.json({ error: 'Judul task wajib diisi' }, 400);
//   }

//   const newTask: Task = {
//     id: crypto.randomUUID(),
//     title: body.title.trim(),
//     description: body.description?.trim() ?? '',
//     status: body.status ?? 'todo',
//     priority: body.priority ?? 'medium',
//     createdAt: new Date().toISOString(),
//   };

//   globalForTasks.kanbanTasks = [newTask, ...(globalForTasks.kanbanTasks ?? [])];

//   return c.json({ task: newTask }, 201);
// });

// app.patch('/tasks/:id', async (c) => {
//   const id = c.req.param('id');
//   const body = await c.req.json<UpdateTaskPayload>();
//   const tasks = globalForTasks.kanbanTasks ?? [];

//   const index = tasks.findIndex((task) => task.id === id);
//   if (index === -1) {
//     return c.json({ error: 'Task tidak ditemukan' }, 404);
//   }

//   const updatedTask: Task = {
//     ...tasks[index],
//     ...(body.title !== undefined && { title: body.title.trim() }),
//     ...(body.description !== undefined && { description: body.description.trim() }),
//     ...(body.status !== undefined && { status: body.status }),
//     ...(body.priority !== undefined && { priority: body.priority }),
//   };

//   tasks[index] = updatedTask;

//   return c.json({ task: updatedTask }, 200);
// });

// app.delete('/tasks/:id', (c) => {
//   const id = c.req.param('id');
//   const tasks = globalForTasks.kanbanTasks ?? [];

//   const exists = tasks.some((task) => task.id === id);
//   if (!exists) {
//     return c.json({ error: 'Task tidak ditemukan' }, 404);
//   }

//   globalForTasks.kanbanTasks = tasks.filter((task) => task.id !== id);

//   return c.json({ message: 'Task berhasil dihapus', id }, 200);
// });

// export const GET = handle(app);
// export const POST = handle(app);
// export const PATCH = handle(app);
// export const DELETE = handle(app);

import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { handle } from "hono/vercel";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { initialTasks } from "../../../data/kanban";
import type { Task } from "../../../types/kanban";

const taskStatusSchema = z.enum(["todo", "in-progress", "done"]);
const taskPrioritySchema = z.enum(["low", "medium", "high"]);

const createTaskSchema = z.object({
  title: z
    .string({ message: "Judul task wajib diisi" })
    .trim()
    .min(1, "Judul task tidak boleh kosong")
    .max(120, "Judul task maksimal 120 karakter"),
  description: z
    .string()
    .trim()
    .min(1, 'Deskripsi task tidak boleh kosong')
    .max(1000, "Deskripsi maksimal 1000 karakter")
    .optional()
    .default(""),
  status: taskStatusSchema.optional().default("todo"),
  priority: taskPrioritySchema.optional().default("medium"),
});

const updateTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Judul task tidak boleh kosong")
      .max(120, "Judul task maksimal 120 karakter")
      .optional(),
    description: z
      .string()
      .trim()
      .max(1000, "Deskripsi maksimal 1000 karakter")
      .optional(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Minimal satu field harus dikirim untuk update",
  });

function formatZodIssues(issues: z.ZodIssue[]) {
  return issues.map((issue) => ({
    field: issue.path.join(".") || "body",
    message: issue.message,
  }));
}

const globalForTasks = globalThis as unknown as { kanbanTasks?: Task[] };

if (!globalForTasks.kanbanTasks) {
  globalForTasks.kanbanTasks = [...initialTasks];
}

const app = new Hono().basePath("/api");

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json(
      {
        error: err.message || "Permintaan tidak valid",
      },
      err.status,
    );
  }

  if (err instanceof SyntaxError) {
    return c.json(
      {
        error: "Format JSON pada request body tidak valid",
      },
      400,
    );
  }

  console.error("[API Tasks Error]:", err);
  return c.json(
    {
      error: "Terjadi kesalahan pada server",
    },
    500,
  );
});

app.notFound((c) => {
  return c.json({ error: `Route ${c.req.path} tidak ditemukan` }, 404);
});

const routes = app
  .get("/tasks", (c) => {
    return c.json({ tasks: globalForTasks.kanbanTasks ?? [] }, 200);
  })
  .post(
    "/tasks",
    zValidator("json", createTaskSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          {
            error: "Validasi gagal",
            details: formatZodIssues(result.error.issues),
          },
          400,
        );
      }
    }),
    (c) => {
      const body = c.req.valid("json");

      const newTask: Task = {
        id: crypto.randomUUID(),
        title: body.title,
        description: body.description,
        status: body.status,
        priority: body.priority,
        createdAt: new Date().toISOString(),
      };

      globalForTasks.kanbanTasks = [
        newTask,
        ...(globalForTasks.kanbanTasks ?? []),
      ];

      return c.json({ task: newTask }, 201);
    },
  )
  .patch(
    "/tasks/:id",
    zValidator("json", updateTaskSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          {
            error: "Validasi gagal",
            details: formatZodIssues(result.error.issues),
          },
          400,
        );
      }
    }),
    (c) => {
      const id = c.req.param("id");
      const body = c.req.valid("json");
      const tasks = globalForTasks.kanbanTasks ?? [];

      const index = tasks.findIndex((task) => task.id === id);
      if (index === -1) {
        return c.json({ error: "Task tidak ditemukan" }, 404);
      }

      const updatedTask: Task = {
        ...tasks[index],
        ...body,
      };

      tasks[index] = updatedTask;

      return c.json({ task: updatedTask }, 200);
    },
  )
  .delete("/tasks/:id", (c) => {
    const id = c.req.param("id");
    const tasks = globalForTasks.kanbanTasks ?? [];

    const exists = tasks.some((task) => task.id === id);
    if (!exists) {
      return c.json({ error: "Task tidak ditemukan" }, 404);
    }

    globalForTasks.kanbanTasks = tasks.filter((task) => task.id !== id);

    return c.json({ message: "Task berhasil dihapus", id }, 200);
  });

export type AppType = typeof routes;

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
