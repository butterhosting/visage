import { useRegistry } from "../hooks/useRegistry";

export function DemoBanner() {
  const { VISAGE_DEMO } = useRegistry("env");
  if (VISAGE_DEMO) {
    return (
      <div className="mb-10">
        <div className="absolute w-full left-0 flex flex-col items-center gap-2 bg-c-accent px-4 py-2 text-sm text-white">
          <span className="font-bold">This is a DEMO: the website and all of its analytics are invented</span>
          <a href="https://www.butterhost.ing/visage" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
            www.butterhost.ing/visage
          </a>
        </div>
      </div>
    );
  }
  return null;
}
