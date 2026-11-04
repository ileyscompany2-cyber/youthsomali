"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  hideClose?: boolean;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  hideClose = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Trap focus and close on Escape
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    };

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
      aria-describedby={description ? "modal-description" : undefined}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`
          relative w-full ${sizeClasses[size]} bg-white dark:bg-surface-card-dark
          rounded-2xl shadow-modal border border-border dark:border-border-dark
          animate-scale-in max-h-[90vh] flex flex-col outline-none
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border dark:border-border-dark shrink-0">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-ink">
              {title}
            </h2>
            {description && (
              <p id="modal-description" className="text-sm text-ink-muted mt-1">
                {description}
              </p>
            )}
          </div>
          {!hideClose && (
            <button
              onClick={onClose}
              className="ml-4 p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-muted
                         transition-colors focus-visible:ring-2 focus-visible:ring-forest"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

/* ─── Delete Confirmation Modal ──────────────────────────────── */
interface DeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  loading?: boolean;
}

export function DeleteModal({
  open,
  onClose,
  onConfirm,
  title = "Delete this item?",
  description = "This action cannot be undone. The item will be permanently removed from the database.",
  confirmLabel = "Yes, delete it",
  loading = false,
}: DeleteModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size="sm">
      <div className="flex gap-3 justify-end pt-2">
        <button className="btn btn-outline" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button
          className="btn btn-danger"
          onClick={onConfirm}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? "Deleting…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
