import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};
export function CodeSnippet({ children, className }: Props) {
  return (
    <code className={`px-1.5 py-0.5 rounded-md text-c-primary bg-c-dark/6 text-[0.92em] break-all ${className ?? ""}`}>{children}</code>
  );
}
