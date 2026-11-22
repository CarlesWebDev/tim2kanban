import { Column, Task } from "../types/kanban";

export const columns: Column[] = [
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

export const tasks: Task[] = [
  {
    id: "1",
    title: "Task 1",
    description: "Ini adalah task 1",
    status: "todo",
    priority: "low",
    createdAt: new Date("2024-06-01T10:00:00Z"),
    updatedAt: new Date("2024-06-01T10:00:00Z"),
  },
  {
    id: "2",
    title: "Task 2",
    description: "Ini adalah task 2",
    status: "in-progress",
    priority: "medium",
    createdAt: new Date("2024-06-01T10:00:00Z"),
    updatedAt: new Date("2024-06-01T10:00:00Z"),
  },
  {
    id: "3",
    title: "Task 3",
    description: "Ini adalah task 3",
    status: "done",
    priority: "high",
    createdAt: new Date("2024-06-01T10:00:00Z"),
    updatedAt: new Date("2024-06-01T10:00:00Z"),
  },
];