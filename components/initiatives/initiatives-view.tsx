"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/shared/page-container";
import { Toast } from "@/components/shared/toast";
import { createInitiative, deleteInitiative, toggleInitiativeStatus, updateInitiative } from "@/actions/initiatives";
import { canDeleteInitiative, canEditInitiative } from "@/lib/permissions";
import { useViewAs } from "@/components/layout/view-as-context";
import type { Role } from "@/types";
import { InitiativeCard } from "./initiative-card";
import { InitiativeDrawer } from "./initiative-drawer";
import type { InitiativeCardData, InitiativeFormValues } from "./types";

interface InitiativesViewProps {
  initialInitiatives: InitiativeCardData[];
  categories: string[];
  people: { id: string; name: string }[];
  currentUserId: string;
  currentUserRole: Role;
}

type FilterKey = "all" | "active" | "inactive";

const CHIPS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
];

function emptyForm(ownerId: string): InitiativeFormValues {
  return { name: "", goal: "", category: "", status: "active", ownerId };
}

export function InitiativesView({ initialInitiatives, categories, people, currentUserId, currentUserRole }: InitiativesViewProps) {
  const router = useRouter();
  const { viewAsRole } = useViewAs();
  const initiatives = useMemo(
    () => (viewAsRole === "admin" ? initialInitiatives : initialInitiatives.filter((it) => it.ownerId === currentUserId)),
    [initialInitiatives, viewAsRole, currentUserId],
  );
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const today = useMemo(() => new Date(), []);

  const flash = (id: string, message: string) => {
    setHighlightId(id);
    setToast({ message, tone: "success" });
    setTimeout(() => setToast(null), 2600);
    setTimeout(() => setHighlightId(null), 2800);
  };

  const showToast = (message: string, tone: "success" | "error" = "success") => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), tone === "error" ? 4500 : 2600);
  };

  const matched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return initiatives;
    return initiatives.filter(
      (it) => it.name.toLowerCase().includes(q) || it.goal.toLowerCase().includes(q) || it.category.toLowerCase().includes(q),
    );
  }, [initiatives, search]);

  const counts = useMemo(
    () => ({
      all: matched.length,
      active: matched.filter((it) => it.status === "active").length,
      inactive: matched.filter((it) => it.status === "inactive").length,
    }),
    [matched],
  );

  const filtered = useMemo(() => {
    if (filter === "all") return matched;
    return matched.filter((it) => it.status === filter);
  }, [matched, filter]);

  const activeCount = initiatives.filter((it) => it.status === "active").length;
  const subtitle =
    initiatives.length === 0
      ? "No initiatives yet — create your first to group projects and tasks."
      : `${activeCount} ${activeCount === 1 ? "active initiative" : "active initiatives"} across your team.`;

  const editing = editId ? initiatives.find((it) => it.id === editId) ?? null : null;
  const initialValues: InitiativeFormValues = editing
    ? { name: editing.name, goal: editing.goal, category: editing.category, status: editing.status, ownerId: editing.ownerId }
    : emptyForm(currentUserId);

  // Always checked against every Initiative in the org, ignoring the View As scope —
  // this guards against genuine org-wide name collisions, not a display preference.
  const similarNames = initialInitiatives.filter((it) => it.id !== editId).map((it) => it.name);

  const openCreate = () => {
    setEditId(null);
    setDrawerOpen(true);
  };

  const openEdit = (id: string) => {
    setMenuId(null);
    setEditId(id);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditId(null);
  };

  const handleSave = async (values: InitiativeFormValues) => {
    const category = values.category || "Uncategorized";
    try {
      if (editId) {
        const result = await updateInitiative({ id: editId, name: values.name, goal: values.goal, category, status: values.status, ownerId: values.ownerId });
        if (!result.ok) return showToast(result.error, "error");
        closeDrawer();
        router.refresh();
        flash(editId, "Initiative updated");
      } else {
        const result = await createInitiative({ name: values.name, goal: values.goal, category, status: values.status, ownerId: values.ownerId });
        if (!result.ok) return showToast(result.error, "error");
        closeDrawer();
        setFilter("all");
        setSearch("");
        router.refresh();
        flash(result.id, "Initiative created");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save initiative.", "error");
    }
  };

  const handleToggleStatus = async (initiative: InitiativeCardData) => {
    setMenuId(null);
    const nextStatus = initiative.status === "active" ? "inactive" : "active";
    try {
      const result = await toggleInitiativeStatus({ id: initiative.id, status: nextStatus });
      if (!result.ok) return showToast(result.error, "error");
      router.refresh();
      flash(initiative.id, nextStatus === "active" ? "Initiative set active" : "Initiative set inactive");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update status.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    setMenuId(null);
    try {
      const result = await deleteInitiative({ id });
      if (!result.ok) return showToast(result.error, "error");
      router.refresh();
      showToast("Initiative deleted");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete initiative.", "error");
    }
  };

  return (
    <PageContainer>
      <div className="mb-5.5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="mb-1.25 text-2xl font-semi tracking-tight text-text-primary">Initiatives</h1>
          <p className="text-base text-text-secondary">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2.25 rounded-pill px-[20px] py-3 text-sm font-bold text-white shadow-cta-glow [background:var(--gradient-cta)]"
        >
          <Plus size={18} />
          New initiative
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        {CHIPS.map((c) => {
          const active = filter === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setFilter(c.key)}
              className={`inline-flex items-center gap-2 rounded-pill border px-3.5 py-2 text-[13.5px] font-semi ${
                active ? "border-accent bg-accent text-white" : "border-border bg-surface text-text-secondary"
              }`}
            >
              {c.label}
              <span
                className={`inline-flex h-4.75 min-w-5 items-center justify-center rounded-pill px-1.5 text-[11.5px] font-bold ${
                  active ? "bg-white/22 text-white" : "bg-surface-inset text-text-secondary"
                }`}
              >
                {counts[c.key]}
              </span>
            </button>
          );
        })}
        <div className="ml-auto flex w-67.5 max-w-full items-center gap-2 rounded-pill border border-border bg-surface px-3.5 py-2">
          <Search size={16} className="text-text-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search initiatives"
            className="w-full border-none bg-transparent text-[13.5px] text-text-primary outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface">
          <EmptyState
            title="No initiatives here"
            description="Create an initiative to group related projects and tasks."
            action={
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-pill px-4.5 py-2.5 text-sm font-bold text-white shadow-cta-glow [background:var(--gradient-cta)]"
              >
                <Plus size={16} />
                New initiative
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(330px,1fr))] gap-4.5">
          {filtered.map((it) => {
            const permUser = { id: currentUserId, role: currentUserRole };
            const ownable = { created_by: it.createdBy, owner: it.ownerId };
            return (
              <InitiativeCard
                key={it.id}
                initiative={it}
                today={today}
                menuOpen={menuId === it.id}
                highlighted={highlightId === it.id}
                canEdit={canEditInitiative(permUser, ownable)}
                canDelete={canDeleteInitiative(permUser, ownable)}
                onOpen={() => openEdit(it.id)}
                onToggleMenu={() => setMenuId((cur) => (cur === it.id ? null : it.id))}
                onEdit={() => openEdit(it.id)}
                onToggleStatus={() => handleToggleStatus(it)}
                onDelete={() => handleDelete(it.id)}
              />
            );
          })}
        </div>
      )}

      {drawerOpen && (
        <InitiativeDrawer
          key={editId ?? "create"}
          mode={editId ? "edit" : "create"}
          initialValues={initialValues}
          categories={categories}
          people={people}
          currentUserId={currentUserId}
          similarNames={similarNames}
          onClose={closeDrawer}
          onSave={handleSave}
        />
      )}

      {toast && <Toast message={toast.message} tone={toast.tone} />}
    </PageContainer>
  );
}
