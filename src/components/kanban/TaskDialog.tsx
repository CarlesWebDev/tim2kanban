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

export interface TaskSubmitResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTask?: Task | null;
  defaultStatus?: TaskStatus;
  onSubmit: (payload: CreateTaskPayload) => Promise<TaskSubmitResult>;
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    // Validasi cepat di client sebelum hit API
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) {
      nextErrors.title = 'Judul task tidak boleh kosong';
    }
    if (!description.trim()) {
      nextErrors.description = 'Deskripsi task tidak boleh kosong';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    const result = await onSubmit({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
    });
    setIsSubmitting(false);

    // Kalau backend Hono nolak (400 / 500), tampilkan error & jangan tutup modal
    if (!result.ok) {
      if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
        setFieldErrors(result.fieldErrors);
      } else {
        setFormError(result.error ?? 'Gagal menyimpan task');
      }
      return;
    }

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

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
              onChange={(e) => {
                setTitle(e.target.value);
                if (fieldErrors.title) {
                  setFieldErrors((prev) => ({ ...prev, title: '' }));
                }
              }}
              aria-invalid={Boolean(fieldErrors.title)}
              className={`h-9 text-sm ${
                fieldErrors.title
                  ? 'border-destructive focus-visible:ring-destructive'
                  : ''
              }`}
            />
            {fieldErrors.title && (
              <p className="text-xs text-destructive">{fieldErrors.title}</p>
            )}
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
              onChange={(e) => {
                setDescription(e.target.value);
                if (fieldErrors.description) {
                  setFieldErrors((prev) => ({ ...prev, description: '' }));
                }
              }}
              aria-invalid={Boolean(fieldErrors.description)}
              className={`h-9 text-sm ${
                fieldErrors.description
                  ? 'border-destructive focus-visible:ring-destructive'
                  : ''
              }`}
            />
            {fieldErrors.description && (
              <p className="text-xs text-destructive">
                {fieldErrors.description}
              </p>
            )}
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

          {formError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {formError}
            </p>
          )}

          <DialogFooter className="border-t border-border/60 pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
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