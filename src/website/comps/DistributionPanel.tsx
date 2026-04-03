import { DistributionPoint } from "@/models/DistributionPoint";
import { StatsQuery } from "@/models/StatsQuery";
import { Stats } from "@/models/Stats";
import { useState } from "react";
import { DistributionTable } from "./DistributionTable";
import { Paper } from "./Paper";

type Tab = {
  title: string;
  field: keyof Stats;
  filterKey: StatsQuery.StringFilter;
};

type Props = {
  tabs: Tab[];
  stats?: Stats;
  filters: Partial<Record<StatsQuery.StringFilter, string>>;
  onFilter: (key: StatsQuery.StringFilter, value: string) => void;
};

export function DistributionPanel({ tabs, stats, filters, onFilter }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeTab = tabs[activeIndex];

  return (
    <Paper>
      {tabs.length > 1 && (
        <div className="flex border-b border-black/10">
          {tabs.map((tab, i) => {
            const isActive = i === activeIndex;
            const hasFilter = filters[tab.filterKey] != null;
            return (
              <button
                key={tab.title}
                onClick={() => setActiveIndex(i)}
                className={`px-5 py-3 text-xs font-bold tracking-wide cursor-pointer transition-colors ${
                  isActive ? "border-b-2 border-c-primary text-c-primary" : "border-b-2 border-transparent text-c-dark/50 hover:text-c-dark/70"
                }`}
              >
                {tab.title}
                {hasFilter && <span className="inline-block w-2 h-2 rounded-full bg-red-500 ml-1.5" />}
              </button>
            );
          })}
        </div>
      )}
      {tabs.length === 1 && (
        <div className="px-5 pt-5">
          <h3 className="text-xs font-bold tracking-wide text-c-dark/50 flex items-center gap-1.5">
            {tabs[0].title}
            {filters[tabs[0].filterKey] != null && <span className="inline-block w-2 h-2 rounded-full bg-red-500" />}
          </h3>
        </div>
      )}
      <div className="p-5">
        <DistributionTable
          data={stats?.[activeTab.field] as DistributionPoint[] | undefined}
          filterKey={activeTab.filterKey}
          activeValue={filters[activeTab.filterKey]}
          onFilter={onFilter}
        />
      </div>
    </Paper>
  );
}
