"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import type { Task, TaskPriority, TaskStatus } from "../../types/kanban";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

const priorityMeta: Record<TaskPriority, { label: string; dotClass: string }> =
  {
    low: { label: "Low", dotClass: "bg-emerald-500" },
    medium: { label: "Medium", dotClass: "bg-amber-500" },
    high: { label: "High", dotClass: "bg-rose-500" },
  };

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
}: TaskCardProps) {
  const priority = priorityMeta[task.priority];
  const shortId = task.id.replace("task-", "TSK-").slice(0, 7).toUpperCase();

  return (
    <Card className="group gap-3 rounded-lg border-border/70 bg-card py-3.5 shadow-none transition-colors hover:border-foreground/25">
      <CardHeader className="gap-1.5 px-3.5 pb-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] tracking-tight text-muted-foreground">
            {shortId}
          </span>

          <div className="flex items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(task)}
              aria-label="Edit task"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(task.id)}
              aria-label="Hapus task"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <CardTitle className="text-[13.5px] font-medium leading-snug text-foreground">
          {task.title}
        </CardTitle>
      </CardHeader>

      {task.description && (
        <CardContent className="px-3.5 py-0">
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {task.description}
          </p>
        </CardContent>
      )}

      <CardFooter className="flex items-center justify-between gap-2 border-t border-border/50 px-3.5 pt-2.5">
        <Badge
          variant="outline"
          className="h-6 gap-1.5 rounded-md border-border/70 bg-muted/40 px-2 text-[11px] font-normal text-foreground/80"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${priority.dotClass}`} />
          {priority.label}
        </Badge>

        <Select
          value={task.status}
          onValueChange={(val) => onStatusChange(task.id, val as TaskStatus)}
        >
          <SelectTrigger className="h-6 w-auto gap-1.5 rounded-md border-transparent bg-transparent px-2 text-[11px] text-muted-foreground shadow-none hover:bg-muted/60 hover:text-foreground focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="todo" className="text-xs">
              To Do
            </SelectItem>
            <SelectItem value="in-progress" className="text-xs">
              In Progress
            </SelectItem>
            <SelectItem value="done" className="text-xs">
              Done
            </SelectItem>
          </SelectContent>
        </Select>
      </CardFooter>
    </Card>
  );
}
