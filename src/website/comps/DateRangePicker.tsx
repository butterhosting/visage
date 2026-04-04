import { Prettify } from "@/helpers/Prettify";
import { Temporal } from "@js-temporal/polyfill";
import { useEffect, useRef, useState } from "react";
import { useRegistry } from "../hooks/useRegistry";
import { DialogClient } from "../clients/DialogClient";

type DateRange = {
  from?: Temporal.Instant;
  to?: Temporal.Instant;
};

type Preset = {
  label: string;
  key: string;
  range: () => DateRange;
};

function startOfDay(date: Temporal.PlainDate): Temporal.Instant {
  return date.toZonedDateTime("UTC").toInstant();
}

function endOfDay(date: Temporal.PlainDate): Temporal.Instant {
  return date.toZonedDateTime("UTC").add({ days: 1 }).toInstant();
}

const PRESETS: Preset[] = [
  {
    label: "Today",
    key: "today",
    range: () => {
      const today = Temporal.Now.plainDateISO();
      return { from: startOfDay(today), to: endOfDay(today) };
    },
  },
  {
    label: "Yesterday",
    key: "yesterday",
    range: () => {
      const yesterday = Temporal.Now.plainDateISO().subtract({ days: 1 });
      return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
    },
  },
  {
    label: "Last 7 days",
    key: "7d",
    range: () => {
      const today = Temporal.Now.plainDateISO();
      return { from: startOfDay(today.subtract({ days: 7 })), to: endOfDay(today) };
    },
  },
  {
    label: "Last 30 days",
    key: "30d",
    range: () => {
      const today = Temporal.Now.plainDateISO();
      return { from: startOfDay(today.subtract({ days: 30 })), to: endOfDay(today) };
    },
  },
  {
    label: "Last 90 days",
    key: "90d",
    range: () => {
      const today = Temporal.Now.plainDateISO();
      return { from: startOfDay(today.subtract({ days: 90 })), to: endOfDay(today) };
    },
  },
  {
    label: "All time",
    key: "all",
    range: () => ({ from: undefined, to: undefined }),
  },
];

type Props = {
  activeKey: string;
  dateRange?: DateRange;
  onChange: (key: string, range?: DateRange) => void;
};

export function DateRangePicker({ activeKey, dateRange, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const dialogClient = useRegistry(DialogClient);
  const ref = useRef<HTMLDivElement>(null);

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
  if (activeKey === "custom" && dateRange?.from && dateRange?.to) {
    activeLabel = `${Prettify.shortDate(dateRange.from)} \u2013 ${Prettify.shortDate(dateRange.to)}`;
  } else {
    activeLabel = PRESETS.find((p) => p.key === activeKey)?.label ?? "Custom";
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="px-4 py-2 rounded-lg border border-black/10 text-sm font-semibold text-c-dark cursor-pointer hover:bg-c-primary/5 transition-colors flex items-center gap-2"
      >
        {activeLabel}
        <svg className="w-3.5 h-3.5 text-c-dark/40" viewBox="0 0 12 12" fill="none">
          <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-black/10 py-1 z-50 min-w-40">
          {PRESETS.map((preset) => (
            <button
              key={preset.key}
              onClick={() => {
                onChange(preset.key, preset.key === "all" ? undefined : preset.range());
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm cursor-pointer transition-colors ${
                activeKey === preset.key ? "font-semibold text-c-primary bg-c-primary/5" : "text-c-dark hover:bg-c-primary/5"
              }`}
            >
              {preset.label}
            </button>
          ))}
          <div className="border-t border-black/10 my-1" />
          <button
            onClick={() => {
              dialogClient.pickDateTimeRange().then((result) => {
                if (result !== "cancel") {
                  onChange("custom", result);
                }
                setOpen(false);
              });
            }}
            className={`w-full text-left px-4 py-2 text-sm cursor-pointer transition-colors ${
              activeKey === "custom" ? "font-semibold text-c-primary bg-c-primary/5" : "text-c-dark hover:bg-c-primary/5"
            }`}
          >
            Custom
          </button>
        </div>
      )}
    </div>
  );
}
