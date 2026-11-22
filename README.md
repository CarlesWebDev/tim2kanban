# Next Kanban

Aplikasi **Kanban Board**: tambah, edit, hapus, cari, filter prioritas, dan pindah status task (To Do → In Progress → Done).

**Stack:** Next.js 16 (App Router) · React 19 · Hono (API) · Zustand (state) · shadcn/ui + Radix · Tailwind CSS v4 · lucide-react · TypeScript

```bash
npm install
npm run dev   # http://localhost:3000
```

> `AGENTS.md` Gua Juga Gak tau ini apaan otomatis generate.

---

## 1. Struktur Folder

```
src/
├── app/
│   ├── globals.css               # Tailwind + token warna (light/dark)
│   ├── layout.tsx                # Root layout (font, <html>, <body>)
│   ├── page.tsx                  # Halaman "/"
│   ├── api/[[...route]]/route.ts  # Backend Hono (CRUD /api/tasks)
│   └── lib/utils.ts              # re-export cn()
├── components/
│   ├── kanban/
│   │   ├── KanbanBoard.tsx       # Komponen utama papan
│   │   ├── TaskCard.tsx          # Kartu 1 task
│   │   └── TaskDialog.tsx        # Dialog buat/edit task
│   └── ui/                       # shadcn: badge, button, card, dialog, input, select
├── data/kanban.ts                # KANBAN_COLUMNS + initialTasks
├── store/useKanbanStore.ts       # Zustand store
└── types/kanban.ts               # Type TypeScript
```

---

## 2. Peta Import (File → File)

```
page.tsx
 └─ KanbanBoard.tsx
     ├─ ui/badge · ui/button · ui/input · ui/select
     ├─ data/kanban.ts            → KANBAN_COLUMNS
     ├─ store/useKanbanStore.ts   → useKanbanStore   ──► types/kanban.ts
     ├─ types/kanban.ts
     ├─ TaskCard.tsx    ─► ui/badge · ui/button · ui/card · ui/select · types/kanban.ts
     └─ TaskDialog.tsx  ─► ui/button · ui/dialog · ui/input · ui/select · types/kanban.ts

useKanbanStore.ts ══ fetch('/api/tasks') ══►  api/[[...route]]/route.ts
                                                ├─ data/kanban.ts   → initialTasks
                                                └─ types/kanban.ts
```

Ada **2 jalur**:

1. **Jalur UI:** `page.tsx` → `KanbanBoard` → `TaskCard` / `TaskDialog` → komponen `ui/*`.
2. **Jalur data:** `KanbanBoard` → `useKanbanStore` → `fetch` (HTTP) → `route.ts` (Hono). UI **tidak** import `route.ts`; nyambungnya lewat request HTTP.

`types/kanban.ts` dipakai hampir semua file sebagai "kontrak" bentuk data.

---

## 3. `src/types/kanban.ts` (kontrak data)

```ts
export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}
```

- `TaskStatus` & `TaskPriority` = *union type*, nilainya cuma boleh salah satu string itu (typo langsung error).
- `Task` = bentuk lengkap task.
- `CreateTaskPayload` = data buat bikin task: cuma `title` yang wajib.
- `UpdateTaskPayload` = semua opsional, karena PATCH cuma ngirim field yang berubah.

---

## 4. `src/data/kanban.ts` (konstanta + data awal)

```ts
import type { Task, TaskStatus } from '../types/kanban';

export const KANBAN_COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

export const initialTasks: Task[] = [ /* 3 task contoh: task-1, task-2, task-3 */ ];
```

- `import type` = import yang cuma buat tipe, dihapus saat build.
- `KANBAN_COLUMNS` dipakai `KanbanBoard` buat `.map()` bikin 3 kolom.
- `initialTasks` dipakai backend (`route.ts`) sebagai isi awal "database".

---

## 5. `src/app/api/[[...route]]/route.ts` (backend Hono)

Folder `[[...route]]` = *optional catch-all*: semua request `/api/...` ditangkap file ini, lalu Hono yang ngatur route-nya.

```ts
import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { initialTasks } from '../../../data/kanban';
import type { CreateTaskPayload, Task, UpdateTaskPayload } from '../../../types/kanban';

const app = new Hono().basePath('/api');
```

- `Hono` = framework web ringan. `basePath('/api')` bikin semua route otomatis berawalan `/api`.
- `handle` dari `hono/vercel` = adapter biar app Hono jalan sebagai route handler Next.js.

```ts
const globalForTasks = globalThis as unknown as { kanbanTasks?: Task[] };

if (!globalForTasks.kanbanTasks) {
  globalForTasks.kanbanTasks = [...initialTasks];
}
```

"Database" disimpan di memori lewat `globalThis` (biar nggak ke-reset tiap hot reload di dev). Isi awal di-copy dari `initialTasks`.

```ts
app.get('/tasks', (c) => {
  return c.json({ tasks: globalForTasks.kanbanTasks ?? [] }, 200);
});
```

**GET** `/api/tasks` → balikin semua task. `c` = context Hono, `c.json(data, status)` kirim response JSON.

```ts
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
```

**POST** `/api/tasks`:
- Baca body, validasi `title` (kosong → 400).
- Bikin task baru: id `crypto.randomUUID()`, default `status = 'todo'`, `priority = 'medium'`.
- Task baru ditaruh **paling depan** array, balikin status `201 Created`.

```ts
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
```

**PATCH** `/api/tasks/:id`:
- `:id` diambil lewat `c.req.param('id')`.
- Cari index task; nggak ada → 404.
- `...(kondisi && { field })` = spread bersyarat: field cuma ditimpa kalau dikirim di body (`!== undefined`). Sisanya tetap dari task lama.

```ts
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
```

**DELETE** `/api/tasks/:id`: cek ada atau nggak (`some`), lalu buang pakai `filter`.
Di akhir, tiap HTTP method harus di-export terpisah supaya Next.js mau menjalankannya.

> ⚠️ Data di memori server hilang kalau server restart, dan di Vercel (serverless) bisa beda antar instance. Untuk produksi ganti ke database (Supabase, Postgres, dll).

---

## 6. `src/store/useKanbanStore.ts` (Zustand, jembatan UI ↔ API)

```ts
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
```

`KanbanState` = bentuk store: **state** (`tasks`, `isLoading`, `error`) + **action** (4 fungsi async).

```ts
export const useKanbanStore = create<KanbanState>((set) => ({
  tasks: [],
  isLoading: false,
  error: null,
  ...
}));
```

`create` bikin hook `useKanbanStore`. `set` dipakai buat ngubah state; komponen yang pakai store otomatis re-render.

```ts
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
```

Pola: nyalain loading → `fetch` (`no-store` = selalu ambil data terbaru) → cek `res.ok` → simpan ke state. Kalau gagal, isi `error`.

```ts
addTask: async (payload) => {
  ...
  const data: { task: Task } = await res.json();
  set((state) => ({ tasks: [data.task, ...state.tasks] }));
},
```

`POST`, lalu task dari server ditaruh paling depan. `set((state) => ...)` = update berdasarkan state sebelumnya.

```ts
updateTask: async (id, payload) => {
  ...
  set((state) => ({
    tasks: state.tasks.map((task) => (task.id === id ? data.task : task)),
  }));
},
```

`PATCH`, lalu `map` mengganti task dengan id yang sama pakai hasil dari server.

```ts
deleteTask: async (id) => {
  ...
  set((state) => ({
    tasks: state.tasks.filter((task) => task.id !== id),
  }));
},
```

`DELETE`, lalu `filter` buang task itu dari state.

Semua action punya pola sama: `set({ error: null })` → `try { fetch → cek res.ok → update state } catch { set({ error }) }`.

---

## 7. `src/app/layout.tsx` & `src/app/page.tsx`

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

- Font Geist di-load lewat `next/font/google` (dioptimasi otomatis) dan dipasang sebagai CSS variable di `<html>`.
- `import "./globals.css"` bikin Tailwind aktif di seluruh app.
- `metadata` = judul tab (masih default, bisa kamu ganti).
- `LayoutProps<"/">` = helper type global dari Next, nggak perlu di-import.

```tsx
import { KanbanBoard } from '../components/kanban/KanbanBoard';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <KanbanBoard />
    </main>
  );
}
```

`page.tsx` = halaman `/`. Ini **Server Component** (default), sedangkan `KanbanBoard` adalah **Client Component** karena ada `'use client'`.

---

## 8. `src/components/kanban/KanbanBoard.tsx` (komponen utama)

### 8.1 Import

```tsx
'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { CheckCircle2, Circle, CircleDot, Plus, RefreshCw, Search, X } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { KANBAN_COLUMNS } from '../../data/kanban';
import { useKanbanStore } from '../../store/useKanbanStore';
import type { CreateTaskPayload, Task, TaskPriority, TaskStatus } from '../../types/kanban';
import { TaskCard } from './TaskCard';
import { TaskDialog } from './TaskDialog';
```

| Import | Dari | Dipakai buat |
| --- | --- | --- |
| `'use client'` | - | Wajib karena pakai hook (`useState`, `useEffect`, Zustand) |
| `useEffect`, `useState`, `ReactNode` | `react` | State lokal, ambil data saat mount, tipe untuk icon |
| icon (`Plus`, `Search`, dll) | `lucide-react` | Icon di header dan kolom |
| `Badge`, `Button`, `Input`, `Select*` | `components/ui/*` | Komponen UI shadcn |
| `KANBAN_COLUMNS` | `data/kanban` | Daftar kolom |
| `useKanbanStore` | `store` | Ambil `tasks` dan action CRUD |
| type `...` | `types/kanban` | Tipe TypeScript |
| `TaskCard`, `TaskDialog` | file sebelah (`./`) | Anak komponen |

### 8.2 Icon kolom

```tsx
const columnIcons: Record<TaskStatus, ReactNode> = {
  todo: <Circle className="h-3.5 w-3.5 text-muted-foreground" />,
  'in-progress': <CircleDot className="h-3.5 w-3.5 text-amber-500" />,
  done: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
};
```

Objek mapping status → icon berwarna. `Record<TaskStatus, ReactNode>` memastikan semua status punya icon.

### 8.3 State & ambil data

```tsx
export function KanbanBoard() {
  const { tasks, isLoading, error, fetchTasks, addTask, updateTask, deleteTask } = useKanbanStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo');

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);
```

- Data **server** (`tasks`, `isLoading`, `error`, action) datang dari Zustand.
- State **UI** disimpan lokal pakai `useState`: teks pencarian, filter prioritas, dialog kebuka atau nggak, task yang lagi diedit (`null` = mode buat baru), dan status default saat tambah dari kolom tertentu.
- `useEffect` + `fetchTasks` = ambil data sekali saat komponen pertama muncul. `void` dipakai biar ESLint nggak protes soal promise yang nggak di-`await`.

### 8.4 Filter

```tsx
const filteredTasks = tasks.filter((task) => {
  const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
  const keyword = searchQuery.toLowerCase().trim();
  const matchesQuery =
    !keyword ||
    task.title.toLowerCase().includes(keyword) ||
    task.description.toLowerCase().includes(keyword);
  return matchesPriority && matchesQuery;
});
```

Task lolos kalau **prioritasnya cocok** dan **keyword cocok** di title atau description (huruf kecil semua biar nggak case-sensitive). Keyword kosong = semua lolos.

### 8.5 Handler

```tsx
const handleOpenCreate = (status: TaskStatus = 'todo') => {
  setEditingTask(null);
  setDefaultStatus(status);
  setDialogOpen(true);
};

const handleOpenEdit = (task: Task) => {
  setEditingTask(task);
  setDefaultStatus(task.status);
  setDialogOpen(true);
};

const handleDialogSubmit = async (payload: CreateTaskPayload) => {
  if (editingTask) {
    await updateTask(editingTask.id, payload);
  } else {
    await addTask(payload);
  }
};

const handleStatusChange = (id: string, status: TaskStatus) => {
  void updateTask(id, { status });
};

const handleDelete = (id: string) => {
  void deleteTask(id);
};
```

- `handleOpenCreate`: reset `editingTask`, set status default (sesuai kolom yang diklik), buka dialog.
- `handleOpenEdit`: isi `editingTask`, buka dialog.
- `handleDialogSubmit`: kalau lagi edit → `updateTask`, kalau nggak → `addTask`. Ini yang dikirim ke `TaskDialog` sebagai `onSubmit`.
- `handleStatusChange` dan `handleDelete` diteruskan ke `TaskCard`.

### 8.6 Header

```tsx
<header className="sticky top-0 z-10 border-b border-border/60 bg-background/85 backdrop-blur-md">
  ...
  <span>{tasks.length} total tasks</span>
  ...
  <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
  {searchQuery && (<button onClick={() => setSearchQuery('')}><X /></button>)}
  ...
  <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val as 'all' | TaskPriority)}>...</Select>
  ...
  <Button onClick={() => void fetchTasks()} disabled={isLoading}>
    <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
  </Button>
  <Button onClick={() => handleOpenCreate('todo')}><Plus /> New Task</Button>
</header>
```

- `sticky top-0` + `backdrop-blur` = header nempel di atas dengan efek blur.
- Input search itu **controlled input** (`value` + `onChange`). Tombol X cuma muncul kalau `searchQuery` ada isinya (`{searchQuery && ...}`).
- `Select` buat filter prioritas, `val as ...` karena nilai dari Radix bertipe `string`.
- Tombol refresh manggil `fetchTasks`, di-disable dan ikonnya muter saat `isLoading`.

### 8.7 Banner error

```tsx
{error && (
  <div className="... border-destructive/30 bg-destructive/5 ... text-destructive">
    <span>{error}</span>
    <Button onClick={() => void fetchTasks()}>Coba lagi</Button>
  </div>
)}
```

Muncul kalau `error` ada isinya, ada tombol "Coba lagi".

### 8.8 Kolom & isi kolom

```tsx
{KANBAN_COLUMNS.map((column) => {
  const columnTasks = filteredTasks.filter((task) => task.status === column.id);

  return (
    <section key={column.id} className="...">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {columnIcons[column.id]}
          <h2>{column.title}</h2>
          <Badge variant="secondary">{columnTasks.length}</Badge>
        </div>
        <Button onClick={() => handleOpenCreate(column.id)}><Plus /></Button>
      </div>

      <div className="flex flex-1 flex-col gap-2.5">
        {isLoading && tasks.length === 0 ? (
          /* skeleton */
        ) : columnTasks.length === 0 ? (
          /* empty state */
        ) : (
          columnTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>
    </section>
  );
})}
```

- Tiap kolom di-generate dari `KANBAN_COLUMNS.map(...)`, dan `columnTasks` = task hasil filter yang `status`-nya sama dengan kolom itu.
- `key` wajib unik di tiap item list (`column.id`, `task.id`).
- Badge di header = jumlah task di kolom. Tombol `+` bikin task dengan status kolom itu.
- Isi kolom ada **3 kemungkinan** (ternary berantai):
  1. `isLoading && tasks.length === 0` → skeleton (`animate-pulse`)
  2. `columnTasks.length === 0` → empty state "Tidak ada task" + tombol tambah
  3. selain itu → daftar `<TaskCard />` dengan callback dari handler di atas

### 8.9 Dialog

```tsx
<TaskDialog
  key={
    editingTask
      ? editingTask.id
      : dialogOpen
        ? `create-${defaultStatus}`
        : 'create-closed'
  }
  open={dialogOpen}
  onOpenChange={setDialogOpen}
  initialTask={editingTask}
  defaultStatus={defaultStatus}
  onSubmit={handleDialogSubmit}
/>
```

**Trik `key`:** kalau `key` berubah, React membuang dan membuat ulang `TaskDialog` dari nol. Jadi `useState` di dalam dialog otomatis ke-reset pakai `initialTask`/`defaultStatus` yang baru, tanpa perlu `useEffect` buat sinkronisasi form.

---

## 9. `src/components/kanban/TaskCard.tsx` (kartu task)

### 9.1 Import & props

```tsx
"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import type { Task, TaskPriority, TaskStatus } from "../../types/kanban";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}
```

`TaskCard` itu komponen **presentational**: nggak tau soal store/API, cuma nampilin data dari `task` dan manggil callback dari parent (`KanbanBoard`).

### 9.2 Meta prioritas & ID pendek

```tsx
const priorityMeta: Record<TaskPriority, { label: string; dotClass: string }> = {
  low: { label: "Low", dotClass: "bg-emerald-500" },
  medium: { label: "Medium", dotClass: "bg-amber-500" },
  high: { label: "High", dotClass: "bg-rose-500" },
};

const priority = priorityMeta[task.priority];
const shortId = task.id.replace("task-", "TSK-").slice(0, 7).toUpperCase();
```

- `priorityMeta` = mapping prioritas → label + warna titik (hijau/kuning/merah).
- `shortId`: `task-1` jadi `TSK-1`. Untuk task baru (id UUID, nggak ada `task-`), hasilnya 7 karakter pertama UUID dalam huruf besar.

### 9.3 Header kartu

```tsx
<div className="flex items-center justify-between gap-2">
  <span className="font-mono text-[11px] ...">{shortId}</span>

  <div className="flex items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
    <Button onClick={() => onEdit(task)} aria-label="Edit task"><Pencil /></Button>
    <Button onClick={() => onDelete(task.id)} aria-label="Hapus task"><Trash2 /></Button>
  </div>
</div>
<CardTitle>{task.title}</CardTitle>
```

- Tombol edit/hapus selalu kelihatan di HP, tapi di layar `sm` ke atas baru muncul saat kartu di-hover (`group` di `Card` + `sm:group-hover:opacity-100`) atau fokus keyboard (`group-focus-within`).
- `aria-label` buat aksesibilitas karena tombolnya cuma icon.

### 9.4 Deskripsi, badge, dan ganti status

```tsx
{task.description && (
  <CardContent className="px-3.5 py-0">
    <p className="line-clamp-2 ...">{task.description}</p>
  </CardContent>
)}

<CardFooter className="... border-t ...">
  <Badge variant="outline">
    <span className={`h-1.5 w-1.5 rounded-full ${priority.dotClass}`} />
    {priority.label}
  </Badge>

  <Select value={task.status} onValueChange={(val) => onStatusChange(task.id, val as TaskStatus)}>
    <SelectTrigger><SelectValue /></SelectTrigger>
    <SelectContent align="end">
      <SelectItem value="todo">To Do</SelectItem>
      <SelectItem value="in-progress">In Progress</SelectItem>
      <SelectItem value="done">Done</SelectItem>
    </SelectContent>
  </Select>
</CardFooter>
```

- Deskripsi cuma dirender kalau ada, dibatasi 2 baris (`line-clamp-2`).
- Badge nampilin titik warna + label prioritas.
- `Select` di footer = cara pindah kolom: ganti status → `onStatusChange` → `updateTask` → kartu pindah ke kolom lain.

> Di bawah file ada versi lama yang **di-comment** (drag & drop pakai `draggable`, `onDragStart`, `onDragEnd`, `GripVertical`). Kalau mau drag & drop dihidupkan lagi, pakai versi itu dan tambahkan handler `onDragOver`/`onDrop` di kolom `KanbanBoard`.

---

## 10. `src/components/kanban/TaskDialog.tsx` (form buat/edit)

### 10.1 Props

```tsx
interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTask?: Task | null;
  defaultStatus?: TaskStatus;
  onSubmit: (payload: CreateTaskPayload) => Promise<void>;
}
```

`initialTask` ada → mode **edit**, `null`/kosong → mode **buat baru**. `open` dan `onOpenChange` dikontrol dari parent.

### 10.2 State form

```tsx
const [title, setTitle] = useState(initialTask?.title ?? '');
const [description, setDescription] = useState(initialTask?.description ?? '');
const [status, setStatus] = useState<TaskStatus>(initialTask?.status ?? defaultStatus);
const [priority, setPriority] = useState<TaskPriority>(initialTask?.priority ?? 'medium');
const [isSubmitting, setIsSubmitting] = useState(false);
```

Nilai awal diambil dari `initialTask` kalau ada (`?.` + `??`), kalau nggak pakai default. Nilai awal ini cuma dihitung **sekali** saat komponen dibuat, makanya `KanbanBoard` memakai trik `key` di atas.

### 10.3 Submit

```tsx
const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (!title.trim()) return;

  setIsSubmitting(true);
  await onSubmit({
    title: title.trim(),
    description: description.trim(),
    status,
    priority,
  });
  setIsSubmitting(false);
  onOpenChange(false);
};
```

1. `e.preventDefault()` biar halaman nggak reload.
2. Stop kalau title kosong.
3. Nyalain `isSubmitting`, `await onSubmit(...)` (ini `handleDialogSubmit` dari `KanbanBoard`), matiin `isSubmitting`, lalu tutup dialog.

### 10.4 Tampilan

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{initialTask ? 'Edit Task' : 'New Task'}</DialogTitle>
      <DialogDescription>
        {initialTask
          ? 'Perbarui detail tugas dan sinkronkan ke board.'
          : 'Tambahkan item pekerjaan baru ke kolom yang dipilih.'}
      </DialogDescription>
    </DialogHeader>

    <form onSubmit={handleSubmit}>
      <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <Input id="task-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
      <Select value={status} onValueChange={(val) => setStatus(val as TaskStatus)}>...</Select>
      <Select value={priority} onValueChange={(val) => setPriority(val as TaskPriority)}>...</Select>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Batal</Button>
        <Button type="submit" disabled={isSubmitting || !title.trim()}>
          {isSubmitting ? 'Menyimpan...' : initialTask ? 'Simpan Perubahan' : 'Buat Task'}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

- Judul, deskripsi, dan teks tombol berubah sesuai mode edit/buat (`initialTask ? ... : ...`).
- Semua field **controlled** (`value` + `onChange`).
- `<label htmlFor="task-title">` nyambung ke `<Input id="task-title">` (aksesibilitas).
- Tombol "Batal" pakai `type="button"` biar **tidak** men-submit form. Tombol submit di-disable saat lagi menyimpan atau title kosong.

---

## 11. `src/components/ui/*` (komponen shadcn)

Hasil generate shadcn (style `radix-nova`), bukan buatan sendiri. Ciri-cirinya:

- `cva` (class-variance-authority) buat bikin **variant** (contoh `Button`: `variant` default/outline/ghost/..., `size` default/sm/icon/...).
- `cn()` (dari package `cn`) buat gabungin class Tailwind.
- `Slot` dari `radix-ui` biar bisa `asChild`.
- Tiap komponen punya `data-slot` buat keperluan styling.

| File | Isi |
| --- | --- |
| `badge.tsx` | Label kecil bulat (jumlah task, prioritas) |
| `button.tsx` | Tombol + variant dan size |
| `card.tsx` | `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`, dll |
| `dialog.tsx` | Modal (overlay, content, header, footer, title, description, tombol X) |
| `input.tsx` | Input teks |
| `select.tsx` | Dropdown (Trigger, Content, Item, dll) |

`dialog.tsx` meng-import `Button` dari `button.tsx` untuk tombol close.
`src/app/lib/utils.ts` cuma `export { cn } from "cn"`, sedangkan komponen `ui/*` meng-import `cn` langsung dari package `"cn"`.

---

## 12. Konfigurasi

- **`globals.css`**: `@import` Tailwind + `tw-animate-css` + `shadcn/tailwind.css`; `@theme inline` mendaftarkan variabel CSS ke Tailwind (jadi bisa `bg-background`, `text-muted-foreground`, dst); `:root` dan `.dark` berisi warna (format `oklch`) tema terang/gelap.
- **`next.config.ts`**: opsi `experimental.agentFeedback`, `cacheComponents`, `partialPrefetching`, dan rule Turbopack buat memproses CSS lewat `@tailwindcss/turbopack`.
- **`components.json`**: konfigurasi shadcn (style `radix-nova`, base color `neutral`, icon `lucide`).
- **`tsconfig.json`**: ada alias `@/*` → `./*`, tapi di kode semua import pakai **path relatif**, jadi alias ini belum kepakai.
- **`eslint.config.mjs`**: preset `core-web-vitals` dan `typescript` dari Next.

---

## 13. Contoh Alur Lengkap: Nambah Task Baru

1. Klik **New Task** → `handleOpenCreate('todo')` → `dialogOpen = true`.
2. `TaskDialog` kebuka, isi form, klik **Buat Task**.
3. `handleSubmit` (TaskDialog) → `onSubmit(payload)` = `handleDialogSubmit` (KanbanBoard).
4. `editingTask` masih `null` → jalan `addTask(payload)` dari Zustand.
5. Store `fetch('/api/tasks', { method: 'POST', ... })`.
6. Hono (`route.ts`) validasi → bikin task (UUID + `createdAt`) → simpan ke `globalThis.kanbanTasks` → balas `201`.
7. Store menerima `data.task` → `set({ tasks: [data.task, ...state.tasks] })`.
8. Zustand memicu re-render → kartu baru muncul di kolom **To Do**.
9. Dialog menutup otomatis.

---
