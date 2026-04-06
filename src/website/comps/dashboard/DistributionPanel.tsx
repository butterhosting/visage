import { Distribution } from "@/models/Distribution";
import { Stats } from "@/models/Stats";
import { useState } from "react";
import { DistributionFilter } from "../../femodels/DistributionFilter";
import { PanelTab } from "../../femodels/PanelTab";
import { Paper } from "../Paper";
import { DistributionTable } from "./DistributionTable";

type Props = {
  panel: PanelTab[];
  stats?: Stats;
  filters: DistributionFilter[];
  toggleFilter: DistributionFilter.ToggleFn;
  onPageChange: (field: Stats.Field, offset: number) => void;
};
export function DistributionPanel({ panel, stats, filters, toggleFilter, onPageChange }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeTab = panel[activeIndex];
  return (
    <Paper>
      {panel.length > 1 && (
        <div className="flex justify-center border-b border-black/10">
          {panel.map((tab, i) => {
            const isActive = i === activeIndex;
            const hasFilter = filters.some(({ key }) => key === tab.filterKey);
            return (
              <button
                key={tab.label}
                onClick={() => setActiveIndex(i)}
                className={`px-5 py-3 text-xs font-bold tracking-wide cursor-pointer transition-colors ${
                  isActive
                    ? "border-b-2 border-c-primary text-c-primary"
                    : "border-b-2 border-transparent text-c-dark/50 hover:text-c-dark/70"
                }`}
              >
                {tab.label}
                {hasFilter && <span className="inline-block w-2 h-2 rounded-full bg-red-500 ml-1.5" />}
              </button>
            );
          })}
        </div>
      )}
      {panel.length === 1 && (
        <div className="px-5 pt-5">
          <h3 className="text-xs font-bold tracking-wide text-c-dark/50 flex items-center gap-1.5">
            {panel[0].label}
            {filters.some(({ key }) => key === panel[0].filterKey) && <span className="inline-block w-2 h-2 rounded-full bg-red-500" />}
          </h3>
        </div>
      )}
      <div className="p-5">
        <DistributionTable
          distribution={stats?.[activeTab.field] as Distribution}
          pageviewsTotal={stats?.pageviewsTotal}
          filterKey={activeTab.filterKey}
          filterValue={filters.find(({ key }) => key === activeTab.filterKey)?.value}
          toggleFilter={toggleFilter}
          onPageChange={(offset) => onPageChange(activeTab.field, offset)}
        />
      </div>
    </Paper>
  );
}
