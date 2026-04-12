import { Prettify } from "@/helpers/Prettify";
import { Distribution } from "@/models/Distribution";
import { StatsQuery } from "@/models/StatsQuery";
import clsx from "clsx";
import { DistributionFilter } from "../../femodels/DistributionFilter";
import { Icon } from "../../images/Icon";
import { CountryFlag } from "../CountryFlag";

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
        <span className="text-sm font-bold text-c-dark-half tracking-wide">NO DATA</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {distribution.data.map((point) => {
        const isActive = filterValue === point.value;
        const percentage = Math.round((point.count / pageviewsTotal) * 1000) / 10;

        return (
          <button
            key={point.value}
            onClick={() => toggleFilter(filterKey, point.value)}
            className="flex items-center gap-3 cursor-pointer text-left"
          >
            <div className="w-18">{Prettify.percentage(percentage)}</div>
            <div className={clsx("relative flex-1 h-7 rounded overflow-hidden", isActive ? "bg-c-accent/15" : "bg-c-accent/5")}>
              <div
                className={clsx("absolute inset-y-0 left-0 rounded", isActive ? "bg-c-accent/25" : "bg-c-accent/10")}
                style={{ width: `${percentage}%` }}
              />
              <span
                className={clsx(
                  "relative px-2 text-sm leading-7 truncate flex items-center gap-1.5",
                  isActive && "font-semibold text-c-accent",
                )}
              >
                {filterKey === StatsQuery.Filter.country && point.value && (
                  <CountryFlag countryCode={point.value} className="h-3.5 rounded-[1px] shrink-0" />
                )}
                {filterKey === StatsQuery.Filter.city && point.value && typeof point.meta?.country === "string" && (
                  <CountryFlag countryCode={point.meta.country} className="h-3.5 rounded-[1px] shrink-0" />
                )}
                {DistributionFilter.renderValue(filterKey, point.value)}
              </span>
            </div>
            <div className="text-xs tabular-nums w-18">{Prettify.number(point.count)} pvs</div>
          </button>
        );
      })}
      {(distribution.offset > 0 || distribution.hasMore) && (
        <div className="flex justify-center gap-2 pt-2">
          <button
            disabled={distribution.offset === 0}
            onClick={() => onPageChange(Math.max(0, distribution.offset - distribution.limit))}
            className="p-1.5 rounded text-c-dark-half hover:text-c-dark-full hover:bg-c-accent/5 disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <Icon.ChevronLeft className="size-4" />
          </button>
          <button
            disabled={!distribution.hasMore}
            onClick={() => onPageChange(distribution.offset + distribution.limit)}
            className="p-1.5 rounded text-c-dark-half hover:text-c-dark-full hover:bg-c-accent/5 disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <Icon.ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
