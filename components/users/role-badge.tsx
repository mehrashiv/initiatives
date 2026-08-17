import type { Role } from "@/types";

interface RoleBadgeProps {
  role: Role;
}

const TONE: Record<Role, { bg: string; fg: string; dot: string; label: string }> = {
  admin: { bg: "bg-accent-lightest", fg: "text-accent", dot: "bg-accent", label: "Administrator" },
  user: { bg: "bg-surface-subtle", fg: "text-text-secondary", dot: "bg-text-faint", label: "User" },
};

export function RoleBadge({ role }: RoleBadgeProps) {
  const tone = TONE[role];
  return (
    <span
      className={`inline-flex items-center gap-1.75 whitespace-nowrap rounded-pill px-2.75 py-1.25 text-xs font-semi ${tone.bg} ${tone.fg}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {tone.label}
    </span>
  );
}
