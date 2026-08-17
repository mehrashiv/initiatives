"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Plus } from "lucide-react";
import { PageContainer } from "@/components/shared/page-container";
import { Toast } from "@/components/shared/toast";
import { createUser, removeUser } from "@/actions/users";
import { AddUserDrawer } from "./add-user-drawer";
import { UserTable } from "./user-table";
import type { NewUserFormValues, UserRow } from "./types";

interface UsersViewProps {
  initialRows: UserRow[];
  currentUserEmail: string;
}

export function UsersView({ initialRows, currentUserEmail }: UsersViewProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const showToast = (message: string, tone: "success" | "error" = "success") => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), tone === "error" ? 4500 : 2600);
  };

  const adminCount = initialRows.filter((r) => r.role === "admin").length;
  const subtitle = `${initialRows.length} ${initialRows.length === 1 ? "user" : "users"} · ${adminCount} ${
    adminCount === 1 ? "administrator" : "administrators"
  }`;

  const handleCreate = async (values: NewUserFormValues) => {
    const result = await createUser(values);
    if (!result.ok) throw new Error(result.error);
    setDrawerOpen(false);
    router.refresh();
    showToast(`${values.role === "admin" ? "Administrator" : "User"} added`);
  };

  const handleRemove = async (row: UserRow) => {
    setPendingRemoveId(row.id);
    try {
      const result = await removeUser({ userId: row.id });
      if (!result.ok) return showToast(result.error, "error");
      router.refresh();
      showToast("User removed");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to remove user.", "error");
    } finally {
      setPendingRemoveId(null);
    }
  };

  return (
    <PageContainer>
      <div className="mb-5.5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="mb-1.5 inline-flex items-center gap-1.75 text-[13px] font-semi text-accent">
            <Lock size={14} />
            Admin only
          </div>
          <h1 className="mb-1.5 text-2xl font-semi tracking-tight text-text-primary">User management</h1>
          <p className="text-base text-text-secondary">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-2.25 rounded-pill px-[20px] py-3 text-sm font-bold text-white shadow-cta-glow [background:var(--gradient-cta)]"
        >
          <Plus size={18} />
          Add user
        </button>
      </div>

      <UserTable
        rows={initialRows}
        currentUserEmail={currentUserEmail}
        pendingRemoveId={pendingRemoveId}
        onRemove={handleRemove}
      />

      <AddUserDrawer
        open={drawerOpen}
        existingEmails={initialRows.map((r) => r.email)}
        onClose={() => setDrawerOpen(false)}
        onCreate={handleCreate}
      />

      {toast && <Toast message={toast.message} tone={toast.tone} />}
    </PageContainer>
  );
}
