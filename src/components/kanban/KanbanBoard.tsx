"use client";
import { useState, type ReactNode } from "react";
import {
  CheckCircle2,
  Circle,
  CircleDot,
  Plus,
  Search,
  X,
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import type {
  CreateTaskPayload,
  Task,
  TaskPriority,
  TaskStatus,
} from "../../types/kanban";
import { TaskCard } from "./TaskCard";
import { TaskDialog } from "./TaskDialog";
import { DeleteTaskDialog } from "./DeleteTaskDialog";
import { AlertDemo, AlertType } from "./Alert";

const KANBAN_COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

const INITIAL_TASKS: Task[] = [
  {
    id: "task-a1b2c3",
    title: "Setup project Next.js",
    description: "Inisialisasi project, Tailwind v4, dan shadcn/ui.",
    status: "done",
    priority: "high",
  },
  {
    id: "task-d4e5f6",
    title: "Bikin komponen TaskCard",
    description: "Card task dengan badge priority dan select status.",
    status: "in-progress",
    priority: "medium",
  },
  {
    id: "task-g7h8i9",
    title: "Tambah fitur drag and drop",
    description: "Pindahin task antar kolom dengan drag and drop.",
    status: "todo",
    priority: "low",
  },
];

const generateId = () =>
  `task-${crypto.randomUUID().replace(/-/g, "").slice(0, 6)}`;

const columnIcons: Record<TaskStatus, ReactNode> = {
  todo: <Circle className="h-3.5 w-3.5 text-muted-foreground" />,
  "in-progress": <CircleDot className="h-3.5 w-3.5 text-amber-500" />,
  done: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
};

export function KanbanBoard() {
  // Data lokal (FE only), tanpa store dan tanpa backend
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | TaskPriority>(
    "all",
  );

  const [alertMsg, setAlertMsg] = useState<boolean>(true);
  const [alertType, setAlertType] = useState<AlertType>("none");

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("todo");
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const filteredTasks = tasks.filter((task) => {
    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;
    const keyword = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !keyword ||
      task.title.toLowerCase().includes(keyword) ||
      task.description.toLowerCase().includes(keyword);
    return matchesPriority && matchesQuery;
  });

  const handleOpenCreate = (status: TaskStatus = "todo") => {
    setEditingTask(null);
    setDefaultStatus(status);
    setDialogOpen(true);
  };

  const handleRequestDelete = (id: string) => {
    const target = tasks.find((task) => task.id === id) ?? null;
    setDeletingTask(target);
  };

  const handleConfirmDelete = async (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setDefaultStatus(task.status);
    setDialogOpen(true);
  };

  const handleDialogSubmit = async (payload: CreateTaskPayload) => {
    if (editingTask) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === editingTask.id ? { ...task, ...payload } : task,
        ),
      );
    } else {
      setTasks((prev) => [{ id: generateId(), ...payload }, ...prev]);
    }
    return { ok: true };
  };

  const handleStatusChange = (id: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, status } : task)),
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold tracking-tight text-foreground">
              Board
            </h1>
            <span className="text-border">/</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {tasks.length} total tasks
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-52 sm:flex-none">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari task..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 bg-muted/40 pr-7 pl-8 text-xs shadow-none focus-visible:bg-background"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Hapus pencarian"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <Select
              value={priorityFilter}
              onValueChange={(val) =>
                setPriorityFilter(val as "all" | TaskPriority)
              }
            >
              <SelectTrigger className="h-8 w-[116px] bg-muted/40 text-xs shadow-none">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all" className="text-xs">
                  All Priority
                </SelectItem>
                <SelectItem value="high" className="text-xs">
                  High
                </SelectItem>
                <SelectItem value="medium" className="text-xs">
                  Medium
                </SelectItem>
                <SelectItem value="low" className="text-xs">
                  Low
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              size="sm"
              className="h-8 gap-1.5 px-3 text-xs shadow-none"
              onClick={() => handleOpenCreate("todo")}
            >
              <Plus className="h-3.5 w-3.5" />
              New Task
            </Button>
          </div>
        </div>
      </header>

      {/* Main Board Canvas */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
        <div className="grid flex-1 grid-cols-1 gap-5 md:grid-cols-3">
          {KANBAN_COLUMNS.map((column) => {
            const columnTasks = filteredTasks.filter(
              (task) => task.status === column.id,
            );

            return (
              <section
                key={column.id}
                className="flex flex-col rounded-xl border border-border/60 bg-muted/25 p-3"
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    {columnIcons[column.id]}
                    <h2 className="text-xs font-semibold tracking-wide text-foreground/90">
                      {column.title}
                    </h2>
                    <Badge
                      variant="secondary"
                      className="h-5 min-w-5 justify-center rounded-md px-1.5 text-[11px] font-medium tabular-nums"
                    >
                      {columnTasks.length}
                    </Badge>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={() => handleOpenCreate(column.id)}
                    aria-label={`Tambah task ke ${column.title}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="flex flex-1 flex-col gap-2.5">
                  {columnTasks.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border/60 px-4 py-10 text-center">
                      <p className="text-xs text-muted-foreground">
                        Tidak ada task
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenCreate(column.id)}
                        className="mt-1.5 text-xs font-medium text-foreground/75 underline-offset-4 hover:text-foreground hover:underline"
                      >
                        Tambah ke {column.title}
                      </button>
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={handleOpenEdit}
                        onDelete={handleRequestDelete}
                        onStatusChange={handleStatusChange}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
      <TaskDialog
        key={
          editingTask
            ? editingTask.id
            : dialogOpen
              ? `create-${defaultStatus}`
              : "create-closed"
        }
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialTask={editingTask}
        defaultStatus={defaultStatus}
        onSubmit={handleDialogSubmit}
        onOpenAlert={setAlertMsg}
        onEditAlertType={setAlertType}
      />
      <DeleteTaskDialog
        task={deletingTask}
        onOpenChange={(open) => {
          if (!open) setDeletingTask(null);
        }}
        onConfirm={handleConfirmDelete}
        onOpenAlert={setAlertMsg}
        onEditAlertType={setAlertType}
      />
      {alertMsg ? (
        <AlertDemo
          alertType={alertType}
          onEditAlertType={setAlertType}
          open={alertMsg}
          onOpenChange={setAlertMsg} />
      ) : (
        <div></div>
      )}
    </div >
  );
}
