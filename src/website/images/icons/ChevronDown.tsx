import { ComponentProps } from "react";

export function ChevronDown(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 12 12" fill="none" {...props}>
      <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
