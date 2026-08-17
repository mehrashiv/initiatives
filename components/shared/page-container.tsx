import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return <main className="mx-auto w-full max-w-360 px-4 py-6 pb-18 md:px-6">{children}</main>;
}
