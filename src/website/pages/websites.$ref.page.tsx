import { Prettify } from "@/helpers/Prettify";
import { Stats } from "@/models/Stats";
import { StatsQuery } from "@/models/StatsQuery";
import { TimeSeries } from "@/models/TimeSeries";
import { useParams } from "react-router";
import { StatsClient } from "../clients/StatsClient";
import { WebsiteClient } from "../clients/WebsiteClient";
import { DateRangePicker } from "../comps/DateRangePicker";
import { DistributionPanel } from "../comps/DistributionPanel";
import { Paper } from "../comps/Paper";
import { Skeleton } from "../comps/Skeleton";
import { TimeSeriesChart } from "../comps/TimeSeriesChart";
import { useDashboardStateWithUrlSynchronization } from "../hooks/useDashboardStateWithUrlSynchronization";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useRegistry } from "../hooks/useRegistry";
import { useYesQuery } from "../hooks/useYesQuery";
import { DistributionFilter } from "./tempmodels/DistributionFilter";
import { Graph } from "./tempmodels/Graph";

const STAT_TO_TIME_SERIES: Record<Graph, Stats.Field> = {
  visitors: Stats.Field.visitorsTimeSeries,
  pageviews: Stats.Field.pageviewsTimeSeries,
  duration: Stats.Field.durationTimeSeries,
};

export function websites$refPage() {
  const { ref } = useParams();
  const { graph, setGraph, period, setPeriod, filters, setFilters } = useDashboardStateWithUrlSynchronization();

  const websiteClient = useRegistry(WebsiteClient);
  const statsClient = useRegistry(StatsClient);

  const { data: website } = useYesQuery({
    queryFn: () => websiteClient.find(ref!),
  });

  const { data: stats } = useYesQuery(
    {
      queryFn: () =>
        statsClient.query({
          website: ref!,
          fields: [
            Stats.Field.visitorsTotal,
            Stats.Field.pageviewsTotal,
            Stats.Field.durationMedian,
            STAT_TO_TIME_SERIES[graph],
            Stats.Field.sourceDistribution,
            Stats.Field.pageDistribution,
            Stats.Field.screenDistribution,
            Stats.Field.browserDistribution,
            Stats.Field.osDistribution,
            Stats.Field.countryDistribution,
            Stats.Field.cityDistribution,
          ],
          from: period.from,
          to: period.to,
          ...filters.reduce((previous, { key, value }) => ({ ...previous, [key]: value }), {}),
        }),
    },
    [website?.id, graph, period.from?.toString(), period.to?.toString(), JSON.stringify(filters)],
  );

  useDocumentTitle(website ? `${website.hostname} | Websites | Visage` : "Websites | Visage");

  function toggleFilter(targetKey: DistributionFilter.Key, targetValue: string) {
    setFilters((previous) => {
      if (previous.some(({ key, value }) => key === targetKey)) {
        return previous.filter(({ key }) => key !== targetKey);
      }
      return [...previous, { key: targetKey, value: targetValue }];
    });
  }

  const activeFilterCount = Object.keys(filters).length;

  const statCards: { key: Graph; label: string; value?: number; format?: (n: number) => string }[] = [
    { key: Graph.visitors, label: "TOTAL VISITORS", value: stats?.visitorsTotal },
    { key: Graph.pageviews, label: "TOTAL PAGEVIEWS", value: stats?.pageviewsTotal },
    { key: Graph.duration, label: "MEDIAN TIME ON PAGE", value: stats?.durationMedian, format: Prettify.duration },
  ];

  const activeTimeSeries = stats?.[STAT_TO_TIME_SERIES[graph] as keyof Stats] as TimeSeries | undefined;

  type Tab = { title: string; field: keyof Stats; filterKey: DistributionFilter.Key };
  const panels: Tab[][] = [
    [{ title: "PAGES", field: Stats.Field.pageDistribution, filterKey: StatsQuery.Filter.page }],
    [{ title: "SOURCES", field: Stats.Field.sourceDistribution, filterKey: StatsQuery.Filter.source }],
    [
      { title: "COUNTRIES", field: Stats.Field.countryDistribution, filterKey: StatsQuery.Filter.country },
      { title: "CITIES", field: Stats.Field.cityDistribution, filterKey: StatsQuery.Filter.city },
    ],
    [
      { title: "SCREENS", field: Stats.Field.screenDistribution, filterKey: StatsQuery.Filter.screen },
      { title: "BROWSERS", field: Stats.Field.browserDistribution, filterKey: StatsQuery.Filter.browser },
      { title: "OPERATING SYSTEMS", field: Stats.Field.osDistribution, filterKey: StatsQuery.Filter.os },
    ],
  ];

  return (
    <Skeleton className="grid grid-cols-1 gap-5">
      {/* Active filters bar */}
      {activeFilterCount > 0 && (
        <div className="col-span-full flex items-center gap-2 flex-wrap">
          {filters.map(({ key, value }) => (
            <button
              key={key}
              onClick={() => toggleFilter(key, value)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-c-primary/10 text-c-primary text-sm font-semibold cursor-pointer hover:bg-c-primary/20 transition-colors"
            >
              <span className="text-c-dark/50">{key}:</span> {value}
              <span className="ml-1 text-c-primary/50">&times;</span>
            </button>
          ))}
          <button
            onClick={() => setFilters([])}
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
              onClick={() => setGraph(stat.key)}
              className={`px-6 py-5 text-left cursor-pointer hover:bg-c-primary/5 transition-colors ${graph === stat.key ? "border-b-2 border-c-primary" : "border-b-2 border-transparent"}`}
            >
              <div className={`text-xs font-bold tracking-wide mb-1 ${graph === stat.key ? "text-c-primary" : "text-c-dark/50"}`}>
                {stat.label}
              </div>
              <span className="text-3xl font-extrabold text-c-dark">
                {stat.value != null ? (stat.format ? stat.format(stat.value) : Prettify.number(stat.value)) : "\u2014"}
              </span>
            </button>
          ))}
          <div className="ml-auto flex items-center px-5">
            <DateRangePicker period={period} onChange={setPeriod} />
          </div>
        </div>
        <div className="p-6 pt-4">
          <TimeSeriesChart timeSeries={activeTimeSeries} />
        </div>
      </Paper>

      {/* Distribution panels */}
      <div className="col-span-full grid grid-cols-2 gap-5">
        {panels.map((tabs, i) => (
          <DistributionPanel key={i} tabs={tabs} stats={stats} filters={filters} toggleFilter={toggleFilter} />
        ))}
      </div>
    </Skeleton>
  );
}
