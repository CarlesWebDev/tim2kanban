import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { tasks } from '@/data/kanban';
import { Task, TaskStatus } from '@/types/kanban';

const app = new Hono().basePath('/api');

const ALLOWED_STATUSES: TaskStatus[] = ['todo', 'in-progress', 'done'];


app.get('/tasks', (c) => {
  return c.json(tasks, 200);
});

app.post('/tasks', async (c) => {
  const body = await c.req.json();

  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    return c.json({ error: 'Title wajib diisi' }, 400);
  }

  const status: TaskStatus = ALLOWED_STATUSES.includes(body.status)
    ? body.status
    : 'todo';

  const now = new Date();
  const newTask: Task = {
    id: crypto.randomUUID(),
    title: body.title.trim(),
    description: typeof body.description === 'string' ? body.description : '',
    status,
    createdAt: now,
    updatedAt: now,
  };

  tasks.push(newTask);
  return c.json(newTask, 201);
});

app.patch('/tasks', async (c) => {
  const body = await c.req.json();

  if (!body.id) {
    return c.json({ error: 'ID task wajib diisi' }, 400);
  }

  const idx = tasks.findIndex((t) => t.id === body.id);
  if (idx === -1) {
    return c.json({ error: 'Task tidak ditemukan' }, 404);
  }

  const current = tasks[idx];
  const nextStatus: TaskStatus =
    body.status && ALLOWED_STATUSES.includes(body.status)
      ? body.status
      : current.status;

  tasks[idx] = {
    ...current,
    title:
      typeof body.title === 'string' && body.title.trim()
        ? body.title.trim()
        : current.title,
    description:
      typeof body.description === 'string'
        ? body.description
        : current.description,
    status: nextStatus,
    updatedAt: new Date(),
  };

  return c.json(tasks[idx], 200);
});

app.delete('/tasks', async (c) => {
  const queryId = c.req.query('id');
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
    return c.json({ error: 'ID task wajib diisi' }, 400);
  }

  const idx = tasks.findIndex((t) => t.id === targetId);
  if (idx === -1) {
    return c.json({ error: 'Task tidak ditemukan' }, 404);
  }

  const [deleted] = tasks.splice(idx, 1);
  return c.json({ message: 'Task dihapus', task: deleted }, 200);
});

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);