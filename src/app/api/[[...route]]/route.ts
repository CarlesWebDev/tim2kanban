import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { initialTasks } from '../../../data/kanban';
import type { CreateTaskPayload, Task, UpdateTaskPayload } from '../../../types/kanban';


const app = new Hono().basePath('/api');

const globalForTasks = globalThis as unknown as { kanbanTasks?: Task[] };

if (!globalForTasks.kanbanTasks) {
  globalForTasks.kanbanTasks = [...initialTasks];
}

app.get('/tasks', (c) => {
  return c.json({ tasks: globalForTasks.kanbanTasks ?? [] }, 200);
});

app.post('/tasks', async (c) => {
  const body = await c.req.json<CreateTaskPayload>();

  if (!body.title || body.title.trim() === '') {
    return c.json({ error: 'Judul task wajib diisi' }, 400);
  }

  const newTask: Task = {
    id: crypto.randomUUID(),
    title: body.title.trim(),
    description: body.description?.trim() ?? '',
    status: body.status ?? 'todo',
    priority: body.priority ?? 'medium',
    createdAt: new Date().toISOString(),
  };

  globalForTasks.kanbanTasks = [newTask, ...(globalForTasks.kanbanTasks ?? [])];

  return c.json({ task: newTask }, 201);
});

app.patch('/tasks/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<UpdateTaskPayload>();
  const tasks = globalForTasks.kanbanTasks ?? [];

  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) {
    return c.json({ error: 'Task tidak ditemukan' }, 404);
  }

  const updatedTask: Task = {
    ...tasks[index],
    ...(body.title !== undefined && { title: body.title.trim() }),
    ...(body.description !== undefined && { description: body.description.trim() }),
    ...(body.status !== undefined && { status: body.status }),
    ...(body.priority !== undefined && { priority: body.priority }),
  };

  tasks[index] = updatedTask;

  return c.json({ task: updatedTask }, 200);
});

app.delete('/tasks/:id', (c) => {
  const id = c.req.param('id');
  const tasks = globalForTasks.kanbanTasks ?? [];

  const exists = tasks.some((task) => task.id === id);
  if (!exists) {
    return c.json({ error: 'Task tidak ditemukan' }, 404);
  }

  globalForTasks.kanbanTasks = tasks.filter((task) => task.id !== id);

  return c.json({ message: 'Task berhasil dihapus', id }, 200);
});

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);