import { Prettify } from "@/helpers/Prettify";
import { TimeSeries } from "@/models/TimeSeries";

export function TimeSeriesTooltip({
  yUnit,
  active,
  payload,
}: {
  yUnit: TimeSeries["yUnit"];
  active?: boolean;
  payload?: { value: number; payload: { tooltipLabel: string } }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-c-darkgray text-white rounded-xl px-5 py-4 shadow-xl">
      <div className="text-xs font-bold tracking-wide mb-2 text-white/70">{payload[0].payload.tooltipLabel}</div>
      <div className="flex items-center gap-3">
        {Prettify.yValue(payload[0].value, yUnit)} {Prettify.yUnitLabel(yUnit)}
      </div>
    </div>
  );
}
