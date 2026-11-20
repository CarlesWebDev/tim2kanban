'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import type {
  CreateTaskPayload,
  Task,
  TaskPriority,
  TaskStatus,
} from '../../types/kanban';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTask?: Task | null;
  defaultStatus?: TaskStatus;
  onSubmit: (payload: CreateTaskPayload) => Promise<void>;
}

export function TaskDialog({
  open,
  onOpenChange,
  initialTask,
  defaultStatus = 'todo',
  onSubmit,
}: TaskDialogProps) {
  const [title, setTitle] = useState(initialTask?.title ?? '');
  const [description, setDescription] = useState(
    initialTask?.description ?? ''
  );
  const [status, setStatus] = useState<TaskStatus>(
    initialTask?.status ?? defaultStatus
  );
  const [priority, setPriority] = useState<TaskPriority>(
    initialTask?.priority ?? 'medium'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 border-border/80 sm:max-w-[440px]">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-semibold tracking-tight">
            {initialTask ? 'Edit Task' : 'New Task'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {initialTask
              ? 'Perbarui detail tugas dan sinkronkan ke board.'
              : 'Tambahkan item pekerjaan baru ke kolom yang dipilih.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="task-title"
              className="text-xs font-medium text-foreground/80"
            >
              Title
            </label>
            <Input
              id="task-title"
              placeholder="Misal: Refactor endpoint PATCH /api/tasks"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="task-desc"
              className="text-xs font-medium text-foreground/80"
            >
              Description
            </label>
            <Input
              id="task-desc"
              placeholder="Catatan singkat atau konteks pekerjaan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-foreground/80">
                Status
              </span>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as TaskStatus)}
              >
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
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
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-foreground/80">
                Priority
              </span>
              <Select
                value={priority}
                onValueChange={(val) => setPriority(val as TaskPriority)}
              >
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue placeholder="Pilih prioritas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low" className="text-xs">
                    Low
                  </SelectItem>
                  <SelectItem value="medium" className="text-xs">
                    Medium
                  </SelectItem>
                  <SelectItem value="high" className="text-xs">
                    High
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="border-t border-border/60 pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !title.trim()}
            >
              {isSubmitting
                ? 'Menyimpan...'
                : initialTask
                  ? 'Simpan Perubahan'
                  : 'Buat Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}