import { Prettify } from "@/helpers/Prettify";
import { Stats } from "@/models/Stats";
import { StatsQuery } from "@/models/StatsQuery";
import { useParams } from "react-router";
import { StatsClient } from "../clients/StatsClient";
import { WebsiteClient } from "../clients/WebsiteClient";
import { ActiveFiltersBar } from "../comps/dashboard/ActiveFiltersBar";
import { PeriodPicker } from "../comps/dashboard/PeriodPicker";
import { DistributionPanel } from "../comps/dashboard/DistributionPanel";
import { TimeSeriesChart } from "../comps/dashboard/TimeSeriesChart";
import { Paper } from "../comps/Paper";
import { Skeleton } from "../comps/Skeleton";
import { DistributionFilter } from "../femodels/DistributionFilter";
import { Graph } from "../femodels/Graph";
import { PanelTab } from "../femodels/PanelTab";
import { useDashboardStateWithUrlSynchronization } from "../hooks/dashboard/useDashboardStateWithUrlSynchronization";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useRegistry } from "../hooks/useRegistry";
import { useYesQuery } from "../hooks/useYesQuery";

export function websites$refPage() {
  const { ref } = useParams();
  const { graph, graphTimeSeriesField, setGraph, period, setPeriod, filters, setFilters } = useDashboardStateWithUrlSynchronization();

  const websiteClient = useRegistry(WebsiteClient);
  const { data: website } = useYesQuery({
    queryFn: () => websiteClient.find(ref!),
  });

  const statsClient = useRegistry(StatsClient);
  const { data: stats } = useYesQuery(
    {
      queryFn: () =>
        statsClient.query({
          website: ref!,
          fields: [
            Stats.Field.visitorsTotal,
            Stats.Field.pageviewsTotal,
            Stats.Field.durationMedian,
            graphTimeSeriesField,
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
    [website?.id, graph, period.from?.toString(), period.to?.toString(), JSON.stringify(filters)], // TODO: sort by keys alphabetically?
  );

  useDocumentTitle(website ? `${website.hostname} | Websites | Visage` : "Websites | Visage");

  function toggleFilter(targetKey: DistributionFilter.Key, targetValue: string) {
    setFilters((previous) => {
      if (previous.some(({ key }) => key === targetKey)) {
        return previous.filter(({ key }) => key !== targetKey);
      }
      return [...previous, { key: targetKey, value: targetValue }];
    });
  }

  function aggregateStats() {
    return [
      {
        label: "TOTAL VISITORS",
        value: typeof stats?.visitorsTotal === "number" ? Prettify.number(stats.visitorsTotal) : "\u2014",
        correspondingGraph: Graph.visitors,
      },
      {
        label: "TOTAL PAGEVIEWS",
        value: typeof stats?.pageviewsTotal === "number" ? Prettify.number(stats.pageviewsTotal) : "\u2014",
        correspondingGraph: Graph.pageviews,
      },
      {
        label: "MEDIAN TIME ON PAGE",
        value: typeof stats?.durationMedian === "number" ? Prettify.duration(stats.durationMedian) : "\u2014",
        correspondingGraph: Graph.duration,
      },
    ];
  }

  function panels(): PanelTab[][] {
    return [
      [{ label: "PAGES", field: Stats.Field.pageDistribution, filterKey: StatsQuery.Filter.page }],
      [{ label: "SOURCES", field: Stats.Field.sourceDistribution, filterKey: StatsQuery.Filter.source }],
      [
        { label: "COUNTRIES", field: Stats.Field.countryDistribution, filterKey: StatsQuery.Filter.country },
        { label: "CITIES", field: Stats.Field.cityDistribution, filterKey: StatsQuery.Filter.city },
      ],
      [
        { label: "SCREENS", field: Stats.Field.screenDistribution, filterKey: StatsQuery.Filter.screen },
        { label: "BROWSERS", field: Stats.Field.browserDistribution, filterKey: StatsQuery.Filter.browser },
        { label: "OPERATING SYSTEMS", field: Stats.Field.osDistribution, filterKey: StatsQuery.Filter.os },
      ],
    ];
  }

  return (
    <Skeleton className="grid grid-cols-1 gap-5">
      {/* Active filters section */}
      <ActiveFiltersBar filters={filters} toggle={toggleFilter} reset={() => setFilters([])} />

      {/* Aggregate stats + chart */}
      <Paper className="col-span-full">
        <div className="flex divide-x divide-black/10">
          {aggregateStats().map(({ label, value, correspondingGraph }) => (
            <button
              key={correspondingGraph}
              onClick={() => setGraph(correspondingGraph)}
              className={`px-6 py-5 text-left cursor-pointer hover:bg-c-primary/5 transition-colors ${correspondingGraph === graph ? "border-b-2 border-c-primary" : "border-b-2 border-transparent"}`}
            >
              <div className={`text-xs font-bold tracking-wide mb-1 ${correspondingGraph === graph ? "text-c-primary" : "text-c-dark/50"}`}>
                {label}
              </div>
              <span className="text-3xl font-extrabold text-c-dark">{value}</span>
            </button>
          ))}
          <div className="ml-auto flex items-center px-5">
            <PeriodPicker period={period} onChange={setPeriod} />
          </div>
        </div>
        <div className="p-6 pt-4">
          <TimeSeriesChart timeSeries={stats?.[graphTimeSeriesField]} />
        </div>
      </Paper>

      {/* Distribution panels */}
      <div className="col-span-full grid grid-cols-2 gap-5">
        {panels().map((panel, i) => (
          <DistributionPanel key={i} panel={panel} stats={stats} filters={filters} toggleFilter={toggleFilter} />
        ))}
      </div>
    </Skeleton>
  );
}
