"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Users } from "lucide-react";
import posthog from "posthog-js";
import { getInitials } from "@/lib/dates";
import { logout } from "@/actions/profile";
import { useViewAs } from "@/components/layout/view-as-context";
import type { AuthUser } from "@/types";

const ROLE_OPTIONS = [
  { key: "user" as const, label: "User" },
  { key: "admin" as const, label: "Administrator" },
];

interface AvatarMenuProps {
  user: AuthUser;
}

export function AvatarMenu({ user }: AvatarMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { viewAsRole, isAdmin, setViewAsRole } = useViewAs();

  const initials = getInitials(user.name);
  const realRoleLabel = ROLE_OPTIONS.find((option) => option.key === user.role)?.label ?? "User";

  async function handleLogout() {
    posthog.capture("user_logged_out", { email: user.email });
    posthog.reset();
    await logout();
    router.push("/login");
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-pill border-none bg-transparent p-0.5"
      >
        <span className="flex h-9.5 w-9.5 items-center justify-center rounded-full text-sm font-bold text-white [background:var(--gradient-logo-mark-linear)]">
          {initials}
        </span>
        <ChevronDown size={16} className="text-text-faint" strokeWidth={2.5} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-45" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-13.5 z-46 w-62 overflow-hidden rounded-md border border-border bg-surface p-2 shadow-lg">
            <div className="flex items-center gap-2.5 px-2.5 pb-3 pt-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full text-[15px] font-bold text-white [background:var(--gradient-logo-mark-linear)]">
                {initials}
              </span>
              <div className="flex flex-col leading-tight">
                <strong className="text-sm font-semi text-text-primary">{user.name}</strong>
                <span className="text-xs text-text-faint">{realRoleLabel}</span>
              </div>
            </div>
            {isAdmin && (
              <>
                <div className="my-0.5 h-px bg-border" />
                <div className="px-2.5 pt-2 pb-2 text-[11px] font-bold uppercase tracking-wide text-text-faint">
                  View as
                </div>
                <div className="flex gap-1.5 px-2 pb-2">
                  {ROLE_OPTIONS.map((option) => {
                    const active = viewAsRole === option.key;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => {
                          if (option.key !== viewAsRole) {
                            posthog.capture("role_view_switched", { from: viewAsRole, to: option.key });
                          }
                          setViewAsRole(option.key);
                        }}
                        className={`flex-1 rounded-sm border px-2.5 py-2 text-[13px] font-semi transition-colors duration-(--duration-fast) ${
                          active
                            ? "border-accent bg-accent text-white"
                            : "border-border bg-surface text-text-secondary"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <div className="px-2.5 pb-2 text-xs leading-body text-text-faint">
                  {viewAsRole === "admin"
                    ? "Seeing every owner's records across your team."
                    : "Seeing only the records assigned to you."}
                </div>
              </>
            )}
            {user.role === "admin" && (
              <>
                <div className="my-0.5 h-px bg-border" />
                <Link
                  href="/users"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2.5 text-sm font-med text-text-primary hover:bg-surface-subtle"
                >
                  <Users size={17} />
                  User management
                </Link>
              </>
            )}
            <div className="my-0.5 h-px bg-border" />
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2.5 text-sm font-med text-text-primary hover:bg-surface-subtle"
            >
              <LogOut size={17} />
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
