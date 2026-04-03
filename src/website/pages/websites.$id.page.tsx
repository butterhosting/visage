import { Prettify } from "@/helpers/Prettify";
import { DistributionPoint } from "@/models/DistributionPoint";
import { Stats } from "@/models/Stats";
import { StatsQuery } from "@/models/StatsQuery";
import { TimeSeries } from "@/models/TimeSeries";
import { useState } from "react";
import { useParams } from "react-router";
import { StatsClient } from "../clients/StatsClient";
import { WebsiteClient } from "../clients/WebsiteClient";
import { DistributionTable } from "../comps/DistributionTable";
import { Paper } from "../comps/Paper";
import { Skeleton } from "../comps/Skeleton";
import { TimeSeriesChart } from "../comps/TimeSeriesChart";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useRegistry } from "../hooks/useRegistry";
import { useYesQuery } from "../hooks/useYesQuery";

type ActiveStat = "visitors" | "pageviews" | "duration";

const STAT_TO_TIME_SERIES: Record<ActiveStat, Stats.Field> = {
  visitors: Stats.Field.visitorsTimeSeries,
  pageviews: Stats.Field.pageviewsTimeSeries,
  duration: Stats.Field.durationTimeSeries,
};

type Filters = Partial<Record<StatsQuery.StringFilter, string>>;

export function websites$idPage() {
  const { id } = useParams();
  const websiteClient = useRegistry(WebsiteClient);
  const statsClient = useRegistry(StatsClient);
  const [activeStat, setActiveStat] = useState<ActiveStat>("visitors");
  const [filters, setFilters] = useState<Filters>({});

  const { data: website } = useYesQuery({
    queryFn: () => websiteClient.find(id!),
  });

  const { data: stats } = useYesQuery(
    {
      queryFn: () =>
        statsClient.query({
          website: id!,
          fields: [
            Stats.Field.visitorsTotal,
            Stats.Field.pageviewsTotal,
            Stats.Field.durationMedian,
            STAT_TO_TIME_SERIES[activeStat],
            Stats.Field.sourceDistribution,
            Stats.Field.pageDistribution,
            Stats.Field.screenDistribution,
            Stats.Field.browserDistribution,
            Stats.Field.countryDistribution,
          ],
          ...filters,
        }),
    },
    [website?.id, activeStat, JSON.stringify(filters)],
  );

  useDocumentTitle(website ? `${website.hostname} | Websites | Visage` : "Websites | Visage");

  function toggleFilter(key: StatsQuery.StringFilter, value: string) {
    setFilters((prev) => {
      if (prev[key] === value) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
  }

  const activeFilterCount = Object.keys(filters).length;

  const statCards: { key: ActiveStat; label: string; value?: number; format?: (n: number) => string }[] = [
    { key: "visitors", label: "VISITORS", value: stats?.visitorsTotal },
    { key: "pageviews", label: "PAGEVIEWS", value: stats?.pageviewsTotal },
    { key: "duration", label: "VISIT DURATION", value: stats?.durationMedian, format: Prettify.duration },
  ];

  const activeTimeSeries = stats?.[STAT_TO_TIME_SERIES[activeStat] as keyof Stats] as TimeSeries | undefined;

  const distributions: { title: string; field: keyof Stats; filterKey: StatsQuery.StringFilter }[] = [
    { title: "PAGES", field: Stats.Field.pageDistribution, filterKey: StatsQuery.Filter.page },
    { title: "SOURCES", field: Stats.Field.sourceDistribution, filterKey: StatsQuery.Filter.source },
    { title: "BROWSERS", field: Stats.Field.browserDistribution, filterKey: StatsQuery.Filter.browser },
    { title: "SCREENS", field: Stats.Field.screenDistribution, filterKey: StatsQuery.Filter.screen },
    { title: "COUNTRIES", field: Stats.Field.countryDistribution, filterKey: StatsQuery.Filter.country },
  ];

  return (
    <Skeleton className="grid grid-cols-1 gap-5">
      {/* Active filters bar */}
      {activeFilterCount > 0 && (
        <div className="col-span-full flex items-center gap-2 flex-wrap">
          {Object.entries(filters).map(([key, value]) => (
            <button
              key={key}
              onClick={() => toggleFilter(key as StatsQuery.StringFilter, value!)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-c-primary/10 text-c-primary text-sm font-semibold cursor-pointer hover:bg-c-primary/20 transition-colors"
            >
              <span className="text-c-dark/50">{key}:</span> {value}
              <span className="ml-1 text-c-primary/50">&times;</span>
            </button>
          ))}
          <button
            onClick={() => setFilters({})}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold text-c-dark/50 hover:text-c-dark cursor-pointer transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Stats + Chart */}
      <Paper className="col-span-full">
        <div className="flex divide-x divide-black/10">
          {statCards.map((stat) => (
            <button
              key={stat.key}
              onClick={() => setActiveStat(stat.key)}
              className={`px-6 py-5 text-left cursor-pointer hover:bg-c-primary/5 transition-colors ${activeStat === stat.key ? "border-b-2 border-c-primary" : "border-b-2 border-transparent"}`}
            >
              <div className={`text-xs font-bold tracking-wide mb-1 ${activeStat === stat.key ? "text-c-primary" : "text-c-dark/50"}`}>
                {stat.label}
              </div>
              <span className="text-3xl font-extrabold text-c-dark">
                {stat.value != null ? (stat.format ? stat.format(stat.value) : Prettify.number(stat.value)) : "\u2014"}
              </span>
            </button>
          ))}
        </div>
        <div className="p-6 pt-4">
          <TimeSeriesChart timeSeries={activeTimeSeries} />
        </div>
      </Paper>

      {/* Distribution tables */}
      <div className="col-span-full grid grid-cols-2 gap-5">
        {distributions.map((dist) => (
          <DistributionTable
            key={dist.title}
            title={dist.title}
            data={stats?.[dist.field] as DistributionPoint[] | undefined}
            filterKey={dist.filterKey}
            activeValue={filters[dist.filterKey]}
            onFilter={toggleFilter}
          />
        ))}
      </div>
    </Skeleton>
  );
}
