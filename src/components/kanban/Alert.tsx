import { CheckCircle2Icon, InfoIcon, AlertCircleIcon, AlertTriangleIcon } from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "../../components/ui/alert"
import { useEffect } from "react";

export type AlertType = "none" | "add" | "update" | "delete" | "failed"

interface AlertProps {
  alertType: AlertType;
  onEditAlertType: (open: AlertType) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AlertDemo({ alertType, onEditAlertType, open, onOpenChange }: AlertProps) {
  useEffect(() => {
    if (!open) return;

    const timeout = setTimeout(() => {
      onOpenChange(false);
      onEditAlertType("none");
    }, 5000)

    return () => clearTimeout(timeout);
  }, [open, onOpenChange, onEditAlertType]);
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-none">
      {alertType == "add" ? (
        <Alert>
          <CheckCircle2Icon />
          <AlertTitle>Task created successfully.</AlertTitle>
          <AlertDescription>
            Your new task has been successfully added to the Kanban board.
          </AlertDescription>
        </Alert>
      ) : alertType == "update" ? (
        <Alert>
          <CheckCircle2Icon />
          <AlertTitle>Task updated successfully.</AlertTitle>
          <AlertDescription>
            Your task has been successfully updated on the board.
          </AlertDescription>
        </Alert>
      ) : alertType == "delete" ? (
        <Alert variant="default" className="max-w-md border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-50">
          <CheckCircle2Icon />
          <AlertTitle>Task deleted successfully.</AlertTitle>
          <AlertDescription>
            Your task has been successfully deleted from the board.
          </AlertDescription>
        </Alert>
      ) : alertType == "failed" ? (
        <Alert className="max-w-md border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-50">
          <AlertTriangleIcon />
          <AlertTitle>Failed to create task.</AlertTitle>
          <AlertDescription>
            Something went wrong while creating your task. Please try again.
          </AlertDescription>
        </Alert>) : (
        <div></div>
      )}
    </div>
  )
}

