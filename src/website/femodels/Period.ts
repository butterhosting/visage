import { Temporal } from "@js-temporal/polyfill";

export type Period = Period.Range & {
  preset: Period.Preset;
};

export namespace Period {
  export enum Preset {
    today = "today",
    yesterday = "yesterday",
    last7d = "last7d",
    last30d = "last30d",
    last90d = "last90d",
    all = "all",
    custom = "custom",
  }
  export type Range = {
    from?: Temporal.Instant;
    to?: Temporal.Instant;
  };

  export function defaultPreset(): Preset.last30d {
    return Preset.last30d;
  }

  function startOfDay(date: Temporal.PlainDate): Temporal.Instant {
    return date.toZonedDateTime("UTC").toInstant();
  }
  function endOfDay(date: Temporal.PlainDate): Temporal.Instant {
    return date.toZonedDateTime("UTC").add({ days: 1 }).toInstant();
  }
  export function forPreset(preset: Exclude<Preset, Preset.custom>): Period {
    const today = Temporal.Now.plainDateISO(); // TODO: timezone?
    switch (preset) {
      case Preset.today:
        return {
          preset,
          from: startOfDay(today),
          to: endOfDay(today),
        };
      case Preset.yesterday:
        return {
          preset,
          from: startOfDay(today.subtract({ days: 1 })),
          to: endOfDay(today.subtract({ days: 1 })),
        };
      case Preset.last7d:
        return {
          preset,
          from: startOfDay(today.subtract({ days: 7 })),
          to: endOfDay(today),
        };
      case Preset.last30d:
        return {
          preset,
          from: startOfDay(today.subtract({ days: 30 })),
          to: endOfDay(today),
        };
      case Preset.last90d:
        return {
          preset,
          from: startOfDay(today.subtract({ days: 90 })),
          to: endOfDay(today),
        };
      case Preset.all:
        return {
          preset,
          from: undefined,
          to: undefined,
        };
    }
  }
}
