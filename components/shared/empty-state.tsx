import type { ReactNode } from "react";

interface EmptyStateProps {
  title?: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="px-[20px] py-12 text-center">
      {title && <div className="mb-1.25 text-[15px] font-semi text-text-primary">{title}</div>}
      <div className="text-sm text-text-faint">{description}</div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
