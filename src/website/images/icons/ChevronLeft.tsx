import { ComponentProps } from "react";

export function ChevronLeft(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
