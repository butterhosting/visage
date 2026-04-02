import { Paper } from "../comps/Paper";
import { Skeleton } from "../comps/Skeleton";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const MOCK_DATA = [
  { date: "3 Mar", visitors: 11200 },
  { date: "4 Mar", visitors: 11000 },
  { date: "5 Mar", visitors: 7200 },
  { date: "6 Mar", visitors: 7100 },
  { date: "7 Mar", visitors: 9800 },
  { date: "8 Mar", visitors: 11500 },
  { date: "9 Mar", visitors: 11800 },
  { date: "10 Mar", visitors: 12000 },
  { date: "11 Mar", visitors: 11200 },
  { date: "12 Mar", visitors: 10800 },
  { date: "13 Mar", visitors: 8200 },
  { date: "14 Mar", visitors: 7200 },
  { date: "15 Mar", visitors: 7100 },
  { date: "16 Mar", visitors: 9500 },
  { date: "17 Mar", visitors: 11500 },
  { date: "18 Mar", visitors: 11800 },
  { date: "19 Mar", visitors: 11200 },
  { date: "20 Mar", visitors: 10200 },
  { date: "21 Mar", visitors: 7000 },
  { date: "22 Mar", visitors: 6800 },
  { date: "23 Mar", visitors: 11200 },
  { date: "24 Mar", visitors: 11500 },
  { date: "25 Mar", visitors: 11000 },
  { date: "26 Mar", visitors: 10800 },
  { date: "27 Mar", visitors: 10200 },
  { date: "28 Mar", visitors: 7200 },
  { date: "29 Mar", visitors: 6200 },
];

const STATS = [
  { label: "VISITS", value: "476k", change: 5, positive: true, active: true },
  { label: "PAGEVIEWS", value: "1.9M", change: 10, positive: true, active: true },
  { label: "DURATION", value: "7m 44s", change: 1, positive: false, active: true },
];

function formatValue(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toString();
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-c-dark text-white rounded-xl px-5 py-4 shadow-xl">
      <div className="text-xs font-bold tracking-wide mb-2 text-white/70">{label}</div>
      <div className="flex items-center gap-3">{formatValue(payload[0].value)} visitors</div>
    </div>
  );
}

export function websites$idPage() {
  useDocumentTitle("example.com | Websites | Visage");
  return (
    <Skeleton className="grid grid-cols-1 gap-5">
      {/* Stats row */}
      <Paper className="col-span-full grid grid-cols-6 divide-x divide-black/10">
        {STATS.map((stat) => (
          <button
            key={stat.label}
            className={`px-5 py-5 text-left cursor-pointer hover:bg-c-primary/5 transition-colors ${stat.active ? "border-b-2 border-c-primary" : ""}`}
          >
            <div className={`text-xs font-bold tracking-wide mb-1 ${stat.active ? "text-c-primary" : "text-c-dark/50"}`}>{stat.label}</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-c-dark">{stat.value}</span>
              {stat.change !== 0 && (
                <span className={`text-sm font-bold ${stat.positive ? "text-green-600" : "text-red-500"}`}>
                  {stat.positive ? "\u2197" : "\u2198"} {stat.change}%
                </span>
              )}
              {stat.change === 0 && <span className="text-sm font-bold text-c-dark/40">0%</span>}
            </div>
          </button>
        ))}
      </Paper>

      {/* Chart */}
      <Paper className="col-span-full p-6 pt-8">
        <ResponsiveContainer width="100%" height={380}>
          <AreaChart data={MOCK_DATA} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
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
              tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
              dx={-4}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#4647d2", strokeWidth: 1, strokeDasharray: "4 4" }} />
            <Area
              type="linear"
              dataKey="visitors"
              stroke="#4647d2"
              strokeWidth={2}
              fill="url(#visitorsGradient)"
              activeDot={{ r: 5, fill: "#4647d2", stroke: "#fff", strokeWidth: 2 }}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Paper>
    </Skeleton>
  );
}
