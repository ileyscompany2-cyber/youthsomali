"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="btn btn-ghost btn-sm disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-2 py-1 text-ink-muted text-sm">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            aria-current={p === page ? "page" : undefined}
            className={`
              w-9 h-9 rounded-lg text-sm font-medium transition-colors
              ${p === page
                ? "bg-forest text-white"
                : "text-ink-muted hover:bg-surface-muted hover:text-ink"
              }
            `}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="btn btn-ghost btn-sm disabled:opacity-40"
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────── */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`skeleton ${className}`}
      aria-hidden="true"
      style={{
        background: "linear-gradient(90deg, #E8F2EC 25%, #F5F7F5 50%, #E8F2EC 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite linear",
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card space-y-3">
      <Skeleton className="h-5 w-3/4 rounded" />
      <Skeleton className="h-4 w-full rounded" />
      <Skeleton className="h-4 w-5/6 rounded" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-7 w-16 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className={`h-4 rounded ${i === 0 ? "w-3/4" : "w-1/2"}`} />
        </td>
      ))}
    </tr>
  );
}

/* ─── Empty State ────────────────────────────────────────────── */
export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-full bg-surface-muted flex items-center justify-center mb-4 text-ink-muted">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-ink mb-2">{title}</h3>
      {description && <p className="text-sm text-ink-muted max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ─── Status Badge ───────────────────────────────────────────── */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PUBLISHED: "status-published",
    DRAFT:     "status-draft",
    ARCHIVED:  "status-archived",
    UNREAD:    "status-unread",
    READ:      "status-read",
    REPLIED:   "status-replied",
  };
  const labels: Record<string, string> = {
    PUBLISHED: "Published",
    DRAFT:     "Draft",
    ARCHIVED:  "Archived",
    UNREAD:    "Unread",
    READ:      "Read",
    REPLIED:   "Replied",
  };
  return (
    <span className={`badge ${map[status] ?? "badge-gray"}`}>
      {labels[status] ?? status}
    </span>
  );
}
