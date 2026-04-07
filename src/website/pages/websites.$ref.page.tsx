import { Prettify } from "@/helpers/Prettify";
import { Stats } from "@/models/Stats";
import { StatsQuery } from "@/models/StatsQuery";
import { useParams } from "react-router";
import { StatsClient } from "../clients/StatsClient";
import { WebsiteClient } from "../clients/WebsiteClient";
import { ActiveFiltersBar } from "../comps/dashboard/ActiveFiltersBar";
import { DistributionPanel } from "../comps/dashboard/DistributionPanel";
import { PeriodDropdown } from "../comps/dashboard/PeriodDropdown";
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
import clsx from "clsx";

export function websites$refPage() {
  const { ref } = useParams();
  const { graph, graphTimeSeriesField, setGraph, period, setPeriod, filters, setFilters } = useDashboardStateWithUrlSynchronization();

  const websiteClient = useRegistry(WebsiteClient);
  const { data: website } = useYesQuery({
    queryFn: () => websiteClient.find(ref!),
  });

  const statsClient = useRegistry(StatsClient);
  const {
    data: stats,
    setData: setStats,
    getData: getStats,
  } = useYesQuery(
    {
      queryFn: () =>
        statsClient.query({
          website: ref!,
          fields: [
            Stats.Field.visitorsTotal,
            Stats.Field.pageviewsTotal,
            Stats.Field.pagetimeMedian,
            Stats.Field.livePageviewsTotal,
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

  function toggleFilter(targetKey: DistributionFilter.Key, targetValue: string | null) {
    setFilters((previous) => {
      if (previous.some(({ key }) => key === targetKey)) {
        return previous.filter(({ key }) => key !== targetKey);
      }
      return [...previous, { key: targetKey, value: targetValue }];
    });
  }

  async function loadDistributionPage(field: Stats.Field, offset: number) {
    const result = await statsClient.query({
      website: ref!,
      fields: [field],
      from: period.from,
      to: period.to,
      ...filters.reduce((prev, { key, value }) => ({ ...prev, [key]: value }), {}),
      [`${field}Offset`]: offset,
    });
    setStats({ ...getStats(), [field]: result[field] });
  }

  function aggregateStats(): Array<{ label: string; value?: number; prettyValue: string; correspondingGraph?: Graph; live?: boolean }> {
    return [
      {
        label: "TOTAL VISITORS",
        value: stats?.visitorsTotal,
        prettyValue: typeof stats?.visitorsTotal === "number" ? Prettify.number(stats.visitorsTotal) : "\u2014",
        correspondingGraph: Graph.visitors,
      },
      {
        label: "TOTAL PAGEVIEWS",
        value: stats?.pageviewsTotal,
        prettyValue: typeof stats?.pageviewsTotal === "number" ? Prettify.number(stats.pageviewsTotal) : "\u2014",
        correspondingGraph: Graph.pageviews,
      },
      {
        label: "MEDIAN TIME ON PAGE",
        value: stats?.pagetimeMedian,
        prettyValue: typeof stats?.pagetimeMedian === "number" ? Prettify.duration(stats.pagetimeMedian) : "\u2014",
        correspondingGraph: Graph.pagetime,
      },
      {
        label: "LIVE PAGEVIEWS",
        value: stats?.livePageviewsTotal,
        prettyValue: typeof stats?.livePageviewsTotal === "number" ? Prettify.number(stats.livePageviewsTotal) : "\u2014",
        live: true,
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
      {/* Stats */}
      <Paper className="flex overflow-hidden rounded-b-none">
        {aggregateStats().map(({ label, value, prettyValue, correspondingGraph, live }) => (
          <button
            key={label}
            onClick={() => (correspondingGraph ? setGraph(correspondingGraph) : null)}
            className={clsx(
              "group px-6 py-5 text-left transition-colors -mb-px",
              live
                ? "ml-auto border-l border-black/10"
                : correspondingGraph === graph
                  ? "cursor-pointer hover:bg-c-primary/5 border-b-3 border-c-primary bg-c-primary/5"
                  : "cursor-pointer hover:bg-c-primary/5 border-b-3 border-black/20",
            )}
          >
            <div
              className={clsx(
                "text-xs font-bold tracking-wide mb-1",
                correspondingGraph === graph ? "text-c-primary" : "text-c-dark/50",
                live ? "" : "group-hover:text-c-primary",
              )}
            >
              {label}
            </div>
            <span className={clsx("text-3xl font-extrabold text-c-dark", live && "flex items-center gap-2")}>
              {live && (
                <span className={clsx("size-3 rounded-full", typeof value === "number" && value > 0 ? "bg-green-500" : "bg-red-500")} />
              )}
              {prettyValue}
            </span>
          </button>
        ))}
      </Paper>

      {/* Chart + filters */}
      <Paper className="rounded-t-none">
        <div className="mt-6 px-6 pb-5 flex items-start gap-3 flex-wrap">
          <PeriodDropdown period={period} onChange={setPeriod} />
          <ActiveFiltersBar filters={filters} toggle={toggleFilter} reset={() => setFilters([])} />
        </div>
        <div className="mt-6 p-6">
          <TimeSeriesChart timeSeries={stats?.[graphTimeSeriesField]} />
        </div>
      </Paper>

      {/* Distribution panels */}
      <div className="grid grid-cols-2 sm:grid-cols-1 gap-5">
        {panels().map((panel, i) => (
          <DistributionPanel
            key={i}
            panel={panel}
            stats={stats}
            filters={filters}
            toggleFilter={toggleFilter}
            onPageChange={loadDistributionPage}
          />
        ))}
      </div>
    </Skeleton>
  );
}
