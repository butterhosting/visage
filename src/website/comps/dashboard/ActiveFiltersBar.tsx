import { DistributionFilter } from "@/website/femodels/DistributionFilter";

type Props = {
  filters: DistributionFilter[];
  toggle: DistributionFilter.ToggleFn;
  reset: () => unknown;
};
export function ActiveFiltersBar({ filters, toggle, reset }: Props) {
  if (Object.entries(filters).length === 0) {
    return null;
  }
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map(({ key, value }) => (
        <button
          key={key}
          onClick={() => toggle(key, value)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-c-primary/10 text-c-primary text-sm font-semibold cursor-pointer hover:bg-c-primary/20 transition-colors"
        >
          {/* TODO: this `value` should also account for NULL --- see the DistributionTable component for how to construct a displayValue */}
          {/* TODO: nicer UX if we also show the country's full name here */}
          <span className="text-c-dark/50">{key}:</span> {value}
          <span className="ml-1 text-c-primary/50">&times;</span>
        </button>
      ))}
      <button
        onClick={() => reset()}
        className="px-3 py-1.5 rounded-lg text-sm font-semibold text-c-dark/50 hover:text-c-dark cursor-pointer transition-colors"
      >
        Clear all
      </button>
    </div>
  );
}
