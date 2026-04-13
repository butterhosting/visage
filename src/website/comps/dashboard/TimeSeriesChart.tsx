import { Prettify } from "@/helpers/Prettify";
import { TimeSeries } from "@/models/TimeSeries";
import { Color } from "@/website/Color";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Spinner } from "../Spinner";
import { useRegistry } from "@/website/hooks/useRegistry";

type Props = {
  timeSeries?: TimeSeries;
  minimal?: boolean;
  height?: number | `${number}%`;
};
export function TimeSeriesChart({ timeSeries, minimal, height = 400 }: Props) {
  const gradientId = useMemo(() => Math.random().toString(), []);
  const { O_VISAGE_TIMEZONE } = useRegistry("env");

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
        <span className="text-sm font-bold text-c-dark-half tracking-wide">NO DATA</span>
      </div>
    );
  }

  const { tUnit, yUnit } = timeSeries;
  const chartData = timeSeries.data.map(({ t, y }) => ({
    t,
    y,
    axisLabel: Internal.Format.tValue(t, tUnit, O_VISAGE_TIMEZONE),
    tooltipLabel: Internal.Format.tooltipLabel(t, tUnit, O_VISAGE_TIMEZONE),
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
            <stop offset="0%" stopColor={Color.accent()} stopOpacity={0.15} />
            <stop offset="100%" stopColor={Color.accent()} stopOpacity={0.01} />
          </linearGradient>
        </defs>
        {!minimal && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />}
        {!minimal && (
          <XAxis
            dataKey={({ t }: TimeSeries.Point) => Internal.Format.tValue(t, tUnit, O_VISAGE_TIMEZONE)}
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
            tickFormatter={(v: number) => Internal.Format.yValue(v, yUnit, "without extension")}
            dx={-4}
          />
        )}
        {!minimal && (
          <Tooltip
            content={<Internal.Tooltip yUnit={yUnit} />}
            cursor={{
              stroke: Color.accent(),
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
          />
        )}
        <Area
          type="linear"
          dataKey={"y" satisfies keyof TimeSeries["data"][number]}
          stroke={Color.accent()}
          strokeWidth={minimal ? 1.5 : 2}
          fill={`url(#${gradientId})`}
          activeDot={minimal ? false : { r: 5, fill: Color.accent(), stroke: "#fff", strokeWidth: 2 }}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

namespace Internal {
  type Props = {
    yUnit: TimeSeries["yUnit"];
    active?: boolean;
    payload?: Array<{ value: number; payload: { tooltipLabel: string } }>;
  };
  export function Tooltip({ yUnit, active, payload }: Props) {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-c-dark-full text-white rounded-xl px-5 py-4 shadow-xl">
        <div className="text-xs font-bold tracking-wide mb-2 text-white/70">{payload[0].payload.tooltipLabel}</div>
        <div className="flex items-center gap-3">{Format.yValue(payload[0].value, yUnit, "with extension")}</div>
      </div>
    );
  }

  export namespace Format {
    export function yValue(value: number, yUnit: TimeSeries["yUnit"], ext: "with extension" | "without extension"): string {
      if (yUnit === "second") return Prettify.duration(value);
      const formattedValue = Prettify.number(value);

      if (ext === "with extension") {
        if (yUnit === "visitor") {
          return `${formattedValue} visitor${value === 1 ? "" : "s"}`;
        }
        if (yUnit === "pageview") {
          return `${formattedValue} pageview${value === 1 ? "" : "s"}`;
        }
      }
      return formattedValue;
    }

    export function tValue(timestamp: TimeSeries.Point["t"], tUnit: TimeSeries["tUnit"], timezone: string): string {
      if (tUnit === "month") return Prettify.month("short", timestamp, timezone);
      if (tUnit === "day") return Prettify.date("short", timestamp, timezone);
      return Prettify.time(timestamp, timezone);
    }

    export function tooltipLabel(timestamp: TimeSeries.Point["t"], tUnit: TimeSeries["tUnit"], timezone: string): string {
      if (tUnit === "month") return Prettify.month("long", timestamp, timezone);
      if (tUnit === "day") return Prettify.date("long", timestamp, timezone);
      return Prettify.time(timestamp, timezone);
    }
  }
}
