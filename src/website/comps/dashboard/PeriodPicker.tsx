import { Prettify } from "@/helpers/Prettify";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { DialogClient } from "../../clients/DialogClient";
import { Period } from "../../femodels/Period";
import { useRegistry } from "../../hooks/useRegistry";

type Props = {
  period: Period;
  onChange: (period: Period) => void;
  className?: string;
};
export function PeriodPicker({ period, onChange, className }: Props) {
  // TODO: redo this component ... it may open in awkward directions and is not mobile friendly
  const [open, setOpen] = useState(false);
  const dialogClient = useRegistry(DialogClient);
  const ref = useRef<HTMLDivElement>(null);

  const translations: Record<Period.Preset, string> = {
    [Period.Preset.today]: "Today",
    [Period.Preset.yesterday]: "Yesterday",
    [Period.Preset.last7d]: "Last 7 days",
    [Period.Preset.last30d]: "Last 30 days",
    [Period.Preset.last90d]: "Last 90 days",
    [Period.Preset.all]: "All time",
    [Period.Preset.custom]: "Custom",
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  let activeLabel: string;
  if (period.preset === Period.Preset.custom && period?.from && period?.to) {
    // TODO: I have this +1/-1 logic scattered in too many places ... consolidate somewhere?
    activeLabel = `${Prettify.longDate(period.from)} \u2013 ${Prettify.longDate(period.to?.toZonedDateTimeISO("UTC").subtract({ days: 1 }).toInstant())}`;
  } else {
    activeLabel = translations[period.preset];
  }

  const onClick = (preset: Period.Preset) => {
    if (preset === Period.Preset.custom) {
      dialogClient.pickPeriodRange(period.preset === Period.Preset.custom ? period : {}).then((result) => {
        if (result !== "cancel") {
          onChange({ preset, ...result });
        }
        setOpen(false);
      });
    } else {
      onChange(Period.forPreset(preset));
      setOpen(false);
    }
  };

  return (
    <div className={clsx("relative", className)} ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="px-4 py-2 rounded-lg border border-black/10 text-sm font-semibold text-c-darkgray cursor-pointer hover:bg-c-accent/5 transition-colors flex items-center gap-2"
      >
        {activeLabel}
        <svg className="w-3.5 h-3.5 text-c-darkgray/40" viewBox="0 0 12 12" fill="none">
          <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-black/10 py-1 z-50 min-w-40">
          {Object.values(Period.Preset).map((preset) => (
            <button
              key={preset}
              onClick={() => onClick(preset)}
              className={`w-full text-left px-4 py-2 text-sm cursor-pointer transition-colors ${
                preset === period.preset ? "font-semibold text-c-accent bg-c-accent/5" : "text-c-darkgray hover:bg-c-accent/5"
              }`}
            >
              {translations[preset]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
