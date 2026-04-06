import { Prettify } from "@/helpers/Prettify";
import { Distribution } from "@/models/Distribution";
import { DistributionFilter } from "../../femodels/DistributionFilter";

type Props = {
  distribution?: Distribution;
  pageviewsTotal?: number;
  filterKey: DistributionFilter.Key;
  filterValue?: string | null;
  toggleFilter: DistributionFilter.ToggleFn;
  onPageChange: (offset: number) => void;
};
export function DistributionTable({ distribution, pageviewsTotal, filterKey, filterValue, toggleFilter, onPageChange }: Props) {
  if (!distribution || distribution.data.length === 0 || typeof pageviewsTotal !== "number") {
    return (
      <div className="py-6 text-center">
        <span className="text-sm font-bold text-c-dark/20 tracking-wide">NO DATA</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {distribution.data.map((point) => {
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
            <div className="text-xs text-c-dark tabular-nums w-18">{Prettify.number(point.count)} pvs</div>
          </button>
        );
      })}
      {(distribution.offset > 0 || distribution.hasMore) && (
        <div className="flex justify-end gap-2 pt-2">
          <button
            disabled={distribution.offset === 0}
            onClick={() => onPageChange(Math.max(0, distribution.offset - distribution.limit))}
            className="p-1.5 rounded text-c-dark/50 hover:text-c-dark hover:bg-c-primary/5 disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            disabled={!distribution.hasMore}
            onClick={() => onPageChange(distribution.offset + distribution.limit)}
            className="p-1.5 rounded text-c-dark/50 hover:text-c-dark hover:bg-c-primary/5 disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
