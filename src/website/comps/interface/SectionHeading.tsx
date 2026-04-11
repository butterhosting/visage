import { ReactNode } from "react";

export function SectionHeading({ children }: { children: ReactNode }) {
  return <h2 className="text-xs font-bold tracking-wide mb-4">{children}</h2>;
}
