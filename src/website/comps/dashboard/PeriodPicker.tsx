import { Prettify } from "@/helpers/Prettify";
import clsx from "clsx";
import { useRef } from "react";
import { Period } from "../../../models/Period";
import { DialogClient } from "../../clients/DialogClient";
import { useRegistry } from "../../hooks/useRegistry";

type Props = {
  period: Period;
  onChange: (period: Period) => void;
  className?: string;
};
export function PeriodPicker({ period, onChange, className }: Props) {
  const dialogClient = useRegistry(DialogClient);
  const { O_VISAGE_TIMEZONE } = useRegistry("env");
  const selectRef = useRef<HTMLSelectElement>(null);

  const CUSTOM_DISPLAY = "__custom_display__";

  const translations: Record<Period.Preset, string> = {
    [Period.Preset.today]: "Today",
    [Period.Preset.yesterday]: "Yesterday",
    [Period.Preset.last7d]: "Last 7 days",
    [Period.Preset.last30d]: "Last 30 days",
    [Period.Preset.last90d]: "Last 90 days",
    [Period.Preset.all]: "All time",
    [Period.Preset.custom]: "Custom",
  };

  let activeCustomLabel: string | undefined;
  if (period.preset === Period.Preset.custom) {
    const { from: fromInstant, to: toInstant } = period;
    if (!fromInstant || !toInstant) {
      throw new Error(`Illegal state: both "from" and "to" should be set for custom periods`);
    }
    const { fromDate, toDate } = Period.toDates({ fromInstant, toInstant }, O_VISAGE_TIMEZONE);
    activeCustomLabel = `${Prettify.date("long", fromDate)} \u2013 ${Prettify.date("long", toDate)}`;
  }

  const onSelect = (value: string) => {
    if (value === Period.Preset.custom || value === CUSTOM_DISPLAY) {
      if (selectRef.current) selectRef.current.value = activeCustomLabel ? CUSTOM_DISPLAY : Period.Preset.custom;
      dialogClient.pickPeriodRange(period.preset === Period.Preset.custom ? period : {}).then((result) => {
        if (result !== "cancel") {
          onChange({ preset: Period.Preset.custom, ...result });
        }
      });
    } else {
      onChange(Period.forPreset(value as Exclude<Period.Preset, Period.Preset.custom>, O_VISAGE_TIMEZONE));
    }
  };

  return (
    <select
      ref={selectRef}
      value={activeCustomLabel ? CUSTOM_DISPLAY : period.preset}
      onChange={(e) => onSelect(e.target.value)}
      className={clsx("px-4 py-2 rounded-lg border border-black/10 text-sm font-semibold cursor-pointer bg-white", className)}
    >
      {Object.values(Period.Preset).map((preset) => (
        <option key={preset} value={preset}>
          {translations[preset]}
        </option>
      ))}
      {activeCustomLabel && (
        <option hidden value={CUSTOM_DISPLAY}>
          {activeCustomLabel}
        </option>
      )}
    </select>
  );
}
