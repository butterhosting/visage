import { Stats } from "@/models/Stats";
import { Website } from "@/models/Website";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { StatsClient } from "../clients/StatsClient";
import { useRegistry } from "../hooks/useRegistry";
import { useYesQuery } from "../hooks/useYesQuery";
import { Paper } from "./Paper";

type Props = {
  website: Website;
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

export function WebsiteCard({ website }: Props) {
  const statsClient = useRegistry(StatsClient);
  const { data: stats } = useYesQuery({
    queryFn: () =>
      statsClient.query({
        website: website.hostname,
        fields: [Stats.Field.visitorsTotal, Stats.Field.pageviewsTotal, Stats.Field.visitorsTimeSeries],
      }),
  });

  const chartData = stats?.visitorsTimeSeries?.data.map((d) => ({ v: d.y })) ?? [];

  return (
    <Paper className="overflow-hidden hover:shadow-lg">
      <div className="px-5 pt-5 pb-3">
        <div className="text-sm font-semibold text-c-dark tracking-wide">{website.hostname}</div>
      </div>
      <div className="h-30 pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`miniGradient-${website.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4647d2" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#4647d2" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <Area
              type="linear"
              dataKey="v"
              stroke="#4647d2"
              strokeWidth={1.5}
              fill={`url(#miniGradient-${website.id})`}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="px-5 pb-4 pt-2 flex items-center gap-5 text-sm text-c-dark/50">
        {stats?.visitorsTotal != null && (
          <div>
            <span className="font-semibold text-c-dark">{formatNumber(stats.visitorsTotal)}</span> visitors
          </div>
        )}
        {stats?.pageviewsTotal != null && (
          <div>
            <span className="font-semibold text-c-dark">{formatNumber(stats.pageviewsTotal)}</span> pageviews
          </div>
        )}
        <div className="ml-auto text-xs text-c-dark/40">all time</div>
      </div>
    </Paper>
  );
}
