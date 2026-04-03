import { Prettify } from "@/helpers/Prettify";
import { DistributionPoint } from "@/models/DistributionPoint";
import { StatsQuery } from "@/models/StatsQuery";
import { Paper } from "./Paper";

type Props = {
  title: string;
  data?: DistributionPoint[];
  filterKey: StatsQuery.StringFilter;
  activeValue?: string;
  onFilter: (key: StatsQuery.StringFilter, value: string) => void;
};

export function DistributionTable({ title, data, filterKey, activeValue, onFilter }: Props) {
  if (!data || data.length === 0) return null;
  const max = data[0].value;
  return (
    <Paper className="p-5">
      <h3 className="text-sm font-bold text-c-dark/50 tracking-wide mb-4">{title}</h3>
      <div className="flex flex-col gap-2">
        {data.slice(0, 10).map((point) => {
          const isActive = activeValue === point.label;
          return (
            <button
              key={point.label}
              onClick={() => onFilter(filterKey, point.label)}
              className="flex items-center gap-3 cursor-pointer text-left"
            >
              <div className={`relative flex-1 h-7 rounded overflow-hidden ${isActive ? "bg-c-primary/15" : "bg-c-primary/5"}`}>
                <div
                  className={`absolute inset-y-0 left-0 rounded ${isActive ? "bg-c-primary/25" : "bg-c-primary/10"}`}
                  style={{ width: `${(point.value / max) * 100}%` }}
                />
                <span className={`relative px-2 text-sm leading-7 truncate ${isActive ? "font-semibold text-c-primary" : "text-c-dark"}`}>
                  {point.label}
                </span>
              </div>
              <span className="text-sm font-semibold text-c-dark tabular-nums w-14 text-right">{Prettify.number(point.value)}</span>
            </button>
          );
        })}
      </div>
    </Paper>
  );
}
