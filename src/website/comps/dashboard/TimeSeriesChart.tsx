import { Prettify } from "@/helpers/Prettify";
import { TimeSeries } from "@/models/TimeSeries";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Spinner } from "../Spinner";

function sparseTicks(count: number, max: number): Set<number> {
  if (count <= max) return new Set(Array.from({ length: count }, (_, i) => i));
  const indices = new Set<number>();
  indices.add(0);
  indices.add(count - 1);
  const step = (count - 1) / (max - 1);
  for (let i = 1; i < max - 1; i++) {
    indices.add(Math.round(i * step));
  }
  return indices;
}

function CustomTooltip({
  yUnit,
  active,
  payload,
}: {
  yUnit: TimeSeries["yUnit"];
  active?: boolean;
  payload?: { value: number; payload: { tooltipLabel: string } }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-c-dark text-white rounded-xl px-5 py-4 shadow-xl">
      <div className="text-xs font-bold tracking-wide mb-2 text-white/70">{payload[0].payload.tooltipLabel}</div>
      <div className="flex items-center gap-3">
        {Prettify.yValue(payload[0].value, yUnit)} {Prettify.yUnitLabel(yUnit)}
      </div>
    </div>
  );
}

type Props = {
  timeSeries?: TimeSeries;
  gradientId?: string;
  minimal?: boolean;
  height?: number | `${number}%`;
};

export function TimeSeriesChart({ timeSeries, gradientId = "chartGradient", minimal, height = 320 }: Props) {
  if (!timeSeries) {
    return (
      <div style={{ height }} className="flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (timeSeries.data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center">
        <span className="text-sm font-bold text-c-dark/20 tracking-wide">NO DATA</span>
      </div>
    );
  }

  const { tUnit, yUnit } = timeSeries;
  const maxTicks = 10;
  const tickIndices = sparseTicks(timeSeries.data.length, maxTicks);
  const chartData = timeSeries.data.map((d, i) => ({
    axisLabel: Prettify.chartAxisLabel(d.t, tUnit),
    tooltipLabel: Prettify.chartTooltipLabel(d.t, tUnit),
    y: d.y,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={chartData}
        margin={minimal ? { top: 5, right: 0, left: 0, bottom: 0 } : { top: 5, right: 10, left: 10, bottom: 0 }}
        tabIndex={-1}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4647d2" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#4647d2" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        {!minimal && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />}
        {!minimal && (
          <XAxis
            dataKey="axisLabel"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 13, fontWeight: 600, fill: "#2d2c32" }}
            dy={12}
            interval={0}
            tickFormatter={(value: string, index: number) => (tickIndices.has(index) ? value : "")}
          />
        )}
        {!minimal && (
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 13, fontWeight: 600, fill: "#2d2c32" }}
            tickFormatter={(v: number) => Prettify.yValue(v, yUnit)}
            dx={-4}
          />
        )}
        {!minimal && (
          <Tooltip content={<CustomTooltip yUnit={yUnit} />} cursor={{ stroke: "#4647d2", strokeWidth: 1, strokeDasharray: "4 4" }} />
        )}
        <Area
          type="linear"
          dataKey="y"
          stroke="#4647d2"
          strokeWidth={minimal ? 1.5 : 2}
          fill={`url(#${gradientId})`}
          activeDot={minimal ? false : { r: 5, fill: "#4647d2", stroke: "#fff", strokeWidth: 2 }}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
