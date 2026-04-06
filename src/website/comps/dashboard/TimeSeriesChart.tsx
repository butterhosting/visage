import { Prettify } from "@/helpers/Prettify";
import { TimeSeries } from "@/models/TimeSeries";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Spinner } from "../Spinner";
import { TimeSeriesTooltip } from "./TimeSeriesTooltip";

type Props = {
  timeSeries?: TimeSeries;
  minimal?: boolean;
  height?: number | `${number}%`;
  gradientId?: string;
};
export function TimeSeriesChart({ timeSeries, minimal, height = 400, gradientId = "chartGradient" }: Props) {
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
  const chartData = timeSeries.data.map(({ t, y }) => ({
    t,
    y,
    axisLabel: Prettify.chartAxisLabel(t, tUnit),
    tooltipLabel: Prettify.chartTooltipLabel(t, tUnit),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={chartData}
        margin={minimal ? { top: 5, right: 0, left: 0, bottom: 5 } : { top: 5, right: 10, left: 10, bottom: 80 }}
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
            dataKey={({ t }: TimeSeries.Point) => {
              return Prettify.chartAxisLabel(t, tUnit);
            }}
            dy={12}
            angle={-45}
            textAnchor="end"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 13, fontWeight: 600, fill: "#2d2c32" }}
            minTickGap={50}
            interval="preserveStart"
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
          <Tooltip
            content={<TimeSeriesTooltip yUnit={yUnit} />}
            cursor={{
              stroke: "#4647d2",
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
          />
        )}
        <Area
          type="linear"
          dataKey={"y" satisfies keyof TimeSeries["data"][number]}
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
