import { Demo } from "@/models/copy/Demo";
import { useRegistry } from "../hooks/useRegistry";

export function DemoBanner() {
  const { INTERACTIVE_DEMO } = useRegistry("env");
  if (INTERACTIVE_DEMO) {
    return (
      <div className="mb-5">
        <div className="absolute w-full left-0 flex flex-col items-center gap-2 bg-c-accent px-4 py-2 text-white">{Demo.description}</div>
      </div>
    );
  }
  return null;
}
