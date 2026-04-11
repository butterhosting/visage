import clsx from "clsx";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};
export function CodeSnippet({ children, className }: Props) {
  return (
    <code className={clsx("px-1.5 py-0.5 rounded-md text-c-accent bg-c-dark-full/6 text-[0.92em] break-all", className)}>{children}</code>
  );
}
