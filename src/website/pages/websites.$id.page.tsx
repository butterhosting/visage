import { DistributionPoint } from "@/models/DistributionPoint";
import { Stats } from "@/models/Stats";
import { StatsQuery } from "@/models/StatsQuery";
import { TimeSeries } from "@/models/TimeSeries";
import { Temporal } from "@js-temporal/polyfill";
import { useState } from "react";
import { useParams } from "react-router";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { StatsClient } from "../clients/StatsClient";
import { WebsiteClient } from "../clients/WebsiteClient";
import { Paper } from "../comps/Paper";
import { Skeleton } from "../comps/Skeleton";
import { Spinner } from "../comps/Spinner";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useRegistry } from "../hooks/useRegistry";
import { useYesQuery } from "../hooks/useYesQuery";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function formatY(value: number, yUnit: TimeSeries["yUnit"]): string {
  if (yUnit === "second") return formatDuration(value);
  return formatNumber(value);
}

function yUnitLabel(yUnit: TimeSeries["yUnit"]): string {
  if (yUnit === "visitor") return "visitors";
  if (yUnit === "pageview") return "pageviews";
  return "";
}

function formatTimestamp(t: Temporal.Instant, tUnit: TimeSeries["tUnit"]): string {
  const d = new Date(t.epochMilliseconds);
  if (tUnit === "month") return d.toLocaleDateString("en", { month: "short", year: "2-digit" });
  if (tUnit === "day") return d.toLocaleDateString("en", { day: "numeric", month: "short" });
  return d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
}

function CustomTooltip({
  yUnit,
  active,
  payload,
  label,
}: {
  yUnit: TimeSeries["yUnit"];
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-c-dark text-white rounded-xl px-5 py-4 shadow-xl">
      <div className="text-xs font-bold tracking-wide mb-2 text-white/70">{label}</div>
      <div className="flex items-center gap-3">
        {formatY(payload[0].value, yUnit)} {yUnitLabel(yUnit)}
      </div>
    </div>
  );
}

function TimeSeriesChart({ timeSeries }: { timeSeries?: TimeSeries }) {
  if (!timeSeries) {
    return (
      <div className="h-[320px] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }
  const { tUnit, yUnit } = timeSeries;
  const chartData = timeSeries.data.map((d) => ({
    date: formatTimestamp(d.t, tUnit),
    y: d.y,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }} tabIndex={-1}>
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4647d2" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#4647d2" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 13, fontWeight: 600, fill: "#2d2c32" }} dy={12} />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 13, fontWeight: 600, fill: "#2d2c32" }}
          tickFormatter={(v: number) => formatY(v, yUnit)}
          dx={-4}
        />
        <Tooltip content={<CustomTooltip yUnit={yUnit} />} cursor={{ stroke: "#4647d2", strokeWidth: 1, strokeDasharray: "4 4" }} />
        <Area
          type="linear"
          dataKey="y"
          stroke="#4647d2"
          strokeWidth={2}
          fill="url(#chartGradient)"
          activeDot={{ r: 5, fill: "#4647d2", stroke: "#fff", strokeWidth: 2 }}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

type DistributionTableProps = {
  title: string;
  data?: DistributionPoint[];
  filterKey: StringFilter;
  activeValue?: string;
  onFilter: (key: StringFilter, value: string) => void;
};

function DistributionTable({ title, data, filterKey, activeValue, onFilter }: DistributionTableProps) {
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
              <span className="text-sm font-semibold text-c-dark tabular-nums w-14 text-right">{formatNumber(point.value)}</span>
            </button>
          );
        })}
      </div>
    </Paper>
  );
}

type ActiveStat = "visitors" | "pageviews" | "duration";

const STAT_TO_TIME_SERIES: Record<ActiveStat, Stats.Field> = {
  visitors: Stats.Field.visitorsTimeSeries,
  pageviews: Stats.Field.pageviewsTimeSeries,
  duration: Stats.Field.durationTimeSeries,
};

type StringFilter = Exclude<StatsQuery.Filter, StatsQuery.Filter.from | StatsQuery.Filter.to>;
type Filters = Partial<Record<StringFilter, string>>;

export function websites$idPage() {
  const { id } = useParams();
  const websiteClient = useRegistry(WebsiteClient);
  const statsClient = useRegistry(StatsClient);
  const [activeStat, setActiveStat] = useState<ActiveStat>("visitors");
  const [filters, setFilters] = useState<Filters>({});

  const { data: websites } = useYesQuery({ queryFn: () => websiteClient.query() });
  const website = websites?.find((w) => w.id === id);

  const { data: stats } = useYesQuery(
    {
      queryFn: () =>
        website
          ? statsClient.query({
              website: website.hostname,
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
            })
          : undefined,
    },
    [website?.id, activeStat, JSON.stringify(filters)],
  );

  useDocumentTitle(website ? `${website.hostname} | Visage` : "Visage");

  function toggleFilter(key: StringFilter, value: string) {
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
    { key: "duration", label: "VISIT DURATION", value: stats?.durationMedian, format: formatDuration },
  ];

  const activeTimeSeries = stats?.[STAT_TO_TIME_SERIES[activeStat] as keyof Stats] as TimeSeries | undefined;

  const distributions: { title: string; field: keyof Stats; filterKey: StringFilter }[] = [
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
              onClick={() => toggleFilter(key as StringFilter, value!)}
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
                {stat.value != null ? (stat.format ? stat.format(stat.value) : formatNumber(stat.value)) : "\u2014"}
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
