import { Prettify } from "@/helpers/Prettify";
import { DistributionPoint } from "@/models/DistributionPoint";
import { DistributionFilter } from "../../femodels/DistributionFilter";

type Props = {
  data?: DistributionPoint[];
  pageviewsTotal?: number;
  filterKey: DistributionFilter.Key;
  filterValue?: string | null;
  toggleFilter: DistributionFilter.ToggleFn;
};
export function DistributionTable({ data, pageviewsTotal, filterKey, filterValue, toggleFilter }: Props) {
  if (!data || data.length === 0 || typeof pageviewsTotal !== "number") {
    return (
      <div className="py-6 text-center">
        <span className="text-sm font-bold text-c-dark/20 tracking-wide">NO DATA</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {data.slice(0, 10).map((point) => {
        // TODO: fix frontend slicing!
        const isActive = filterValue === point.value;
        const percentage = Math.round((point.count / pageviewsTotal) * 1000) / 10;

        let displayValue = point.value;
        if (displayValue === null) {
          const translatedNullValues: Record<string, string> = {
            [DistributionFilter.Key.source]: "(direct)",
            [DistributionFilter.Key.browser]: "(unknown)",
            [DistributionFilter.Key.os]: "(unknown)",
            [DistributionFilter.Key.country]: "(unknown)",
            [DistributionFilter.Key.city]: "(unknown)",
          };
          displayValue = translatedNullValues[filterKey] || "";
        }

        return (
          <button
            key={point.value}
            onClick={() => toggleFilter(filterKey, point.value)}
            className="flex items-center gap-3 cursor-pointer text-left"
          >
            <div className="text-c-dark w-12">{percentage === 0 ? "<0.1" : percentage}%</div>
            <div className={`relative flex-1 h-7 rounded overflow-hidden ${isActive ? "bg-c-primary/15" : "bg-c-primary/5"}`}>
              <div
                className={`absolute inset-y-0 left-0 rounded ${isActive ? "bg-c-primary/25" : "bg-c-primary/10"}`}
                style={{ width: `${percentage}%` }}
              />
              <span className={`relative px-2 text-sm leading-7 truncate ${isActive ? "font-semibold text-c-primary" : "text-c-dark"}`}>
                {displayValue}
              </span>
            </div>
            <div className="text-xs text-c-dark tabular-nums w-14">{Prettify.number(point.count)} pvs</div>
          </button>
        );
      })}
    </div>
  );
}
