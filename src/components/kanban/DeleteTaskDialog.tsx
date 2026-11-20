'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import type { Task } from '../../types/kanban';

interface DeleteTaskDialogProps {
  task: Task | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string) => Promise<void>;
}

export function DeleteTaskDialog({
  task,
  onOpenChange,
  onConfirm,
}: DeleteTaskDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!task) return;
    setIsDeleting(true);
    await onConfirm(task.id);
    setIsDeleting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={Boolean(task)} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 border-border/80 sm:max-w-[400px]">
        <DialogHeader className="space-y-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-destructive/20 bg-destructive/10 text-destructive">
            <Trash2 className="h-4 w-4" />
          </div>
          <DialogTitle className="text-base font-semibold tracking-tight">
            Hapus Task?
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            Task{' '}
            <span className="font-medium text-foreground">
              &ldquo;{task?.title}&rdquo;
            </span>{' '}
            akan dihapus secara permanen dari board. Tindakan ini tidak dapat
            dibatalkan.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="border-t border-border/60 pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => void handleConfirm()}
            disabled={isDeleting}
          >
            {isDeleting ? 'Menghapus...' : 'Hapus Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}