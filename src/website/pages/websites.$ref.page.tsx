import { WebsiteError } from "@/errors/WebsiteError";
import { Prettify } from "@/helpers/Prettify";
import { Stats } from "@/models/Stats";
import { StatsQuery } from "@/models/StatsQuery";
import { ServerMessage } from "@/socket/ServerMessage";
import clsx from "clsx";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Period } from "../../models/Period";
import { SocketClient } from "../clients/SocketClient";
import { StatsClient } from "../clients/StatsClient";
import { WebsiteClient } from "../clients/WebsiteClient";
import { ActiveFiltersBar } from "../comps/dashboard/ActiveFiltersBar";
import { DistributionPanel } from "../comps/dashboard/DistributionPanel";
import { PeriodPicker } from "../comps/dashboard/PeriodPicker";
import { TimeSeriesChart } from "../comps/dashboard/TimeSeriesChart";
import { Paper } from "../comps/Paper";
import { Skeleton } from "../comps/Skeleton";
import { DistributionFilter } from "../femodels/DistributionFilter";
import { Graph } from "../femodels/Graph";
import { PanelTab } from "../femodels/PanelTab";
import { useDashboardUrlState } from "../hooks/dashboard/useDashboardUrlState";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useRegistry } from "../hooks/useRegistry";
import { useYesQuery } from "../hooks/useYesQuery";
import { Route } from "../Route";

export function websites$refPage() {
  const { ref } = useParams();
  const navigate = useNavigate();
  const { O_VISAGE_TIMEZONE } = useRegistry("env");
  const { graph, graphTimeSeriesField, setGraph, period, setPeriod, filters, setFilters } = useDashboardUrlState();

  const websiteClient = useRegistry(WebsiteClient);
  const {
    data: website,
    getData: getWebsite,
    setData: setWebsite,
  } = useYesQuery({
    queryFn: () =>
      websiteClient.find(ref!).catch((e) => {
        if (WebsiteError.not_found.matches(e)) {
          navigate(Route.websites());
        }
        throw e;
      }),
  });

  const statsClient = useRegistry(StatsClient);
  const {
    data: stats,
    setData: setStats,
    getData: getStats,
    reload,
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
    [graph, period.from?.toString(), period.to?.toString(), JSON.stringify(filters)],
  );

  const socketClient = useRegistry(SocketClient);
  useEffect(() => {
    if (website?.id) {
      const token = socketClient.subscribe({
        type: ServerMessage.Type.website_stats_update,
        callback: ({ websiteId }) => {
          if (websiteId === website.id && typeof stats?.pageviewsTotal === "number") {
            if (stats.pageviewsTotal < 10_000) {
              reload();
            } else {
              statsClient.query({ website: ref!, fields: [Stats.Field.livePageviewsTotal] }).then(({ livePageviewsTotal }) => {
                setStats({ ...getStats(), livePageviewsTotal });
              });
            }
            setWebsite({ ...getWebsite()!, hasData: true });
          }
        },
      });
      return () => socketClient.unsubscribe(token);
    }
  }, [website?.id, stats?.pageviewsTotal]);

  const hasLiveVisitors = Boolean(stats?.livePageviewsTotal);
  useEffect(() => {
    if (hasLiveVisitors) {
      const interval = setInterval(() => {
        statsClient.query({ website: ref!, fields: [Stats.Field.livePageviewsTotal] }).then(({ livePageviewsTotal }) => {
          setStats({ ...getStats(), livePageviewsTotal });
        });
      }, 30_000);
      return () => clearInterval(interval);
    }
  }, [hasLiveVisitors]);

  useDocumentTitle(website ? `${website.hostname} | Websites | Visage` : "Websites | Visage");

  function toggleFilter(targetKey: DistributionFilter.Key, targetValue: string | null) {
    setFilters((previous) => {
      if (previous.some(({ key }) => key === targetKey)) {
        return previous.filter(({ key }) => key !== targetKey);
      }
      return [...previous, { key: targetKey, value: targetValue }];
    });
  }

  function resetPeriodAndFilters() {
    setPeriod(Period.forPreset(Period.defaultPreset(), O_VISAGE_TIMEZONE));
    setFilters([]);
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
      [{ label: "TRAFFIC SOURCES", field: Stats.Field.sourceDistribution, filterKey: StatsQuery.Filter.source }],
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
    <Skeleton className="flex flex-col gap-5">
      {/* Instructions */}
      {website && !website.hasData && (
        <Paper className="p-4 bg-amber-100! flex flex-col items-center gap-4">
          <p>Please add the following script to your website.</p>
          <code className="text-lg">&lt;script async src="{window.location.origin}/vis.js"&gt;&lt;/script&gt;</code>
        </Paper>
      )}
      {/* Stats */}
      <Paper className="overflow-hidden rounded-b-none flex md:grid md:grid-cols-2">
        {aggregateStats().map(({ label, value, prettyValue, correspondingGraph, live }) => (
          <button
            key={label}
            onClick={() => (correspondingGraph ? setGraph(correspondingGraph) : null)}
            className={clsx(
              "group px-6 py-5 text-left transition-colors -mb-px",
              live
                ? "ml-auto md:ml-0"
                : correspondingGraph === graph
                  ? "cursor-pointer hover:bg-c-accent/5 border-b-3 border-c-accent bg-c-accent/5"
                  : "cursor-pointer hover:bg-c-accent/5 border-b-3 border-black/20",
            )}
          >
            <div
              className={clsx(
                "text-xs font-bold tracking-wide mb-1",
                correspondingGraph === graph ? "text-c-accent" : "text-c-dark-half",
                live ? "" : "group-hover:text-c-accent",
              )}
            >
              {label}
            </div>
            <span className={clsx("text-3xl font-extrabold", live && "flex items-center gap-2")} data-testid="aggregate-stat">
              {live && (
                <span className={clsx("size-3 rounded-full", typeof value === "number" && value > 0 ? "bg-green-500" : "bg-c-error")} />
              )}
              {prettyValue}
            </span>
          </button>
        ))}
      </Paper>

      {/* Chart + filters */}
      <Paper className="rounded-t-none">
        <div className="mt-6 px-6 pb-5 flex items-start gap-3 flex-wrap">
          <PeriodPicker period={period} onChange={setPeriod} />
          <ActiveFiltersBar period={period} filters={filters} toggle={toggleFilter} reset={() => resetPeriodAndFilters()} />
        </div>
        <div className="mt-6 px-6">
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
