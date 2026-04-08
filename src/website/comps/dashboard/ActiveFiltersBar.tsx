import { DistributionFilter } from "@/website/femodels/DistributionFilter";
import { ReactNode } from "react";

type Props = {
  filters: DistributionFilter[];
  toggle: DistributionFilter.ToggleFn;
  reset: () => unknown;
};
export function ActiveFiltersBar({ filters, toggle, reset }: Props): ReactNode[] {
  return [
    ...filters.map(({ key, value }) => (
      <button
        key={key}
        onClick={() => toggle(key, value)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-c-primary text-sm cursor-pointer hover:bg-black/5 transition-colors border border-black/20 border-dashed"
      >
        {/* TODO: this `value` should also account for NULL --- see the DistributionTable component for how to construct a displayValue */}
        {/* TODO: nicer UX if we also show the country's full name here */}
        <span className="text-c-dark/50">{key}:</span> {value}
        <span className="ml-1 text-c-primary/50">&times;</span>
      </button>
    )),
    ...(filters.length > 0
      ? [
          <button
            key="resetbtn"
            onClick={() => reset()}
            className="py-2 rounded-lg text-sm font-semibold text-c-dark/50 hover:text-c-dark cursor-pointer transition-colors border border-transparent"
          >
            Clear filters
          </button>,
        ]
      : []),
  ];
}
