"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Role } from "@/types";

interface ViewAsContextValue {
  viewAsRole: Role;
  isAdmin: boolean;
  setViewAsRole: (role: Role) => void;
}

const ViewAsContext = createContext<ViewAsContextValue | null>(null);

export function ViewAsProvider({ realRole, children }: { realRole: Role; children: ReactNode }) {
  const [viewAsRole, setViewAsRole] = useState<Role>(realRole);

  const value: ViewAsContextValue = {
    viewAsRole: realRole === "admin" ? viewAsRole : "user",
    isAdmin: realRole === "admin",
    setViewAsRole,
  };

  return <ViewAsContext.Provider value={value}>{children}</ViewAsContext.Provider>;
}

export function useViewAs(): ViewAsContextValue {
  const ctx = useContext(ViewAsContext);
  if (!ctx) throw new Error("useViewAs must be used within a ViewAsProvider");
  return ctx;
}
