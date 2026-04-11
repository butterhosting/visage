import { ComponentProps } from "react";

export function ChevronRight(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
