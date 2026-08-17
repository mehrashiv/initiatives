import { Trash2 } from "lucide-react";
import { getInitials } from "@/lib/dates";
import { RoleBadge } from "./role-badge";
import type { UserRow } from "./types";

interface UserTableProps {
  rows: UserRow[];
  currentUserEmail: string;
  pendingRemoveId: string | null;
  onRemove: (row: UserRow) => void;
}

const GRID_COLS = "grid-cols-[1.7fr_1.7fr_150px_44px]";

export function UserTable({ rows, currentUserEmail, pendingRemoveId, onRemove }: UserTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-xs">
      <div className={`grid ${GRID_COLS} items-center gap-4 border-b border-border bg-surface-subtle px-5.5 py-3.25`}>
        <span className="text-[11px] font-bold uppercase tracking-wide text-text-faint">User</span>
        <span className="text-[11px] font-bold uppercase tracking-wide text-text-faint">Email</span>
        <span className="text-[11px] font-bold uppercase tracking-wide text-text-faint">Role</span>
        <span />
      </div>
      {rows.map((row) => {
        const isYou = row.email.toLowerCase() === currentUserEmail.toLowerCase();
        return (
          <div
            key={row.id}
            className={`grid ${GRID_COLS} items-center gap-4 border-b border-border px-5.5 py-3.5 last:border-b-0`}
          >
            <div className="flex min-w-0 items-center gap-2.75">
              <span
                className={`flex h-[36px] w-[36px] flex-none items-center justify-center rounded-full text-[13px] font-bold ${
                  row.role === "admin"
                    ? "text-white [background:var(--gradient-logo-mark-linear)]"
                    : "bg-accent-lightest text-accent"
                }`}
              >
                {getInitials(row.name)}
              </span>
              <div className="flex min-w-0 items-center gap-2">
                <strong className="truncate text-sm font-semi text-text-primary">{row.name}</strong>
                {isYou && (
                  <span className="flex-none rounded-pill bg-accent-lightest px-1.75 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-accent">
                    You
                  </span>
                )}
              </div>
            </div>
            <span className="truncate text-[13.5px] text-text-secondary">{row.email}</span>
            <span className="justify-self-start">
              <RoleBadge role={row.role} />
            </span>
            {!isYou && (
              <button
                type="button"
                aria-label="Remove user"
                disabled={pendingRemoveId === row.id}
                onClick={() => onRemove(row)}
                className="flex h-[34px] w-[34px] flex-none items-center justify-center justify-self-end rounded-sm border border-border bg-surface text-text-faint hover:border-danger-cta hover:bg-danger-light hover:text-danger-cta disabled:opacity-50"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
