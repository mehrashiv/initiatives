"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/shared/page-container";
import { Toast } from "@/components/shared/toast";
import { createProject, deleteProject, toggleProjectStatus, updateProject } from "@/actions/projects";
import { canDeleteProject, canEditProject } from "@/lib/permissions";
import { useViewAs } from "@/components/layout/view-as-context";
import type { Role } from "@/types";
import { ProjectCard } from "./project-card";
import { ProjectDrawer } from "./project-drawer";
import type { ProjectCardData, ProjectFormValues } from "./types";

interface ProjectsViewProps {
  initialProjects: ProjectCardData[];
  initiatives: { id: string; name: string }[];
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

function emptyForm(ownerId: string): ProjectFormValues {
  return { name: "", description: "", initiativeId: "", status: "active", ownerId };
}

export function ProjectsView({ initialProjects, initiatives, people, currentUserId, currentUserRole }: ProjectsViewProps) {
  const router = useRouter();
  const { viewAsRole } = useViewAs();
  const projects = useMemo(
    () => (viewAsRole === "admin" ? initialProjects : initialProjects.filter((p) => p.ownerId === currentUserId)),
    [initialProjects, viewAsRole, currentUserId],
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
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.initiativeName.toLowerCase().includes(q),
    );
  }, [projects, search]);

  const counts = useMemo(
    () => ({
      all: matched.length,
      active: matched.filter((p) => p.status === "active").length,
      inactive: matched.filter((p) => p.status === "inactive").length,
    }),
    [matched],
  );

  const filtered = useMemo(() => {
    if (filter === "all") return matched;
    return matched.filter((p) => p.status === filter);
  }, [matched, filter]);

  const activeCount = projects.filter((p) => p.status === "active").length;
  const subtitle =
    projects.length === 0
      ? "No projects yet — create one inside an initiative to start adding tasks."
      : `${activeCount} ${activeCount === 1 ? "active project" : "active projects"} across your initiatives.`;

  const editing = editId ? projects.find((p) => p.id === editId) ?? null : null;
  const initialValues: ProjectFormValues = editing
    ? {
        name: editing.name,
        description: editing.description,
        initiativeId: editing.initiativeId,
        status: editing.status,
        ownerId: editing.ownerId,
      }
    : emptyForm(currentUserId);

  // Always checked against every Project in the org, ignoring the View As scope —
  // this guards against genuine org-wide name collisions, not a display preference.
  const similarNames = initialProjects.filter((p) => p.id !== editId).map((p) => p.name);

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

  const handleSave = async (values: ProjectFormValues) => {
    try {
      if (editId) {
        const result = await updateProject({
          id: editId,
          name: values.name,
          description: values.description,
          initiativeId: values.initiativeId,
          status: values.status,
          ownerId: values.ownerId,
        });
        if (!result.ok) return showToast(result.error, "error");
        closeDrawer();
        router.refresh();
        flash(editId, "Project updated");
      } else {
        const result = await createProject({
          name: values.name,
          description: values.description,
          initiativeId: values.initiativeId,
          status: values.status,
          ownerId: values.ownerId,
        });
        if (!result.ok) return showToast(result.error, "error");
        closeDrawer();
        setFilter("all");
        setSearch("");
        router.refresh();
        flash(result.id, "Project created");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save project.", "error");
    }
  };

  const handleToggleStatus = async (project: ProjectCardData) => {
    setMenuId(null);
    const nextStatus = project.status === "active" ? "inactive" : "active";
    try {
      const result = await toggleProjectStatus({ id: project.id, status: nextStatus });
      if (!result.ok) return showToast(result.error, "error");
      router.refresh();
      flash(project.id, nextStatus === "active" ? "Project set active" : "Project set inactive");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update status.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    setMenuId(null);
    try {
      const result = await deleteProject({ id });
      if (!result.ok) return showToast(result.error, "error");
      router.refresh();
      showToast("Project deleted");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete project.", "error");
    }
  };

  return (
    <PageContainer>
      <div className="mb-5.5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="mb-1.25 text-2xl font-semi tracking-tight text-text-primary">Projects</h1>
          <p className="text-base text-text-secondary">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2.25 rounded-pill px-[20px] py-3 text-sm font-bold text-white shadow-cta-glow [background:var(--gradient-cta)]"
        >
          <Plus size={18} />
          New project
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
            placeholder="Search projects"
            className="w-full border-none bg-transparent text-[13.5px] text-text-primary outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface">
          <EmptyState
            title="No projects here"
            description="Create a project inside an initiative, then add tasks to it."
            action={
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-pill px-4.5 py-2.5 text-sm font-bold text-white shadow-cta-glow [background:var(--gradient-cta)]"
              >
                <Plus size={16} />
                New project
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(330px,1fr))] gap-4.5">
          {filtered.map((p) => {
            const permUser = { id: currentUserId, role: currentUserRole };
            const ownable = { created_by: p.createdBy, owner: p.ownerId };
            return (
              <ProjectCard
                key={p.id}
                project={p}
                today={today}
                menuOpen={menuId === p.id}
                highlighted={highlightId === p.id}
                canEdit={canEditProject(permUser, ownable)}
                canDelete={canDeleteProject(permUser, ownable)}
                onOpen={() => openEdit(p.id)}
                onToggleMenu={() => setMenuId((cur) => (cur === p.id ? null : p.id))}
                onEdit={() => openEdit(p.id)}
                onToggleStatus={() => handleToggleStatus(p)}
                onDelete={() => handleDelete(p.id)}
              />
            );
          })}
        </div>
      )}

      {drawerOpen && (
        <ProjectDrawer
          key={editId ?? "create"}
          mode={editId ? "edit" : "create"}
          initialValues={initialValues}
          initiatives={initiatives}
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
