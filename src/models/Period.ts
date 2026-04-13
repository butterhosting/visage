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

  export function forPreset(preset: Exclude<Preset, Preset.custom>, timezone: string): Period {
    const today = Temporal.Now.plainDateISO(timezone);
    switch (preset) {
      case Preset.today:
        return {
          preset,
          from: startOfDay(today, timezone),
          to: endOfDay(today, timezone),
        };
      case Preset.yesterday:
        return {
          preset,
          from: startOfDay(today.subtract({ days: 1 }), timezone),
          to: endOfDay(today.subtract({ days: 1 }), timezone),
        };
      case Preset.last7d:
        return {
          preset,
          from: startOfDay(today.subtract({ days: 7 }), timezone),
          to: endOfDay(today, timezone),
        };
      case Preset.last30d:
        return {
          preset,
          from: startOfDay(today.subtract({ days: 30 }), timezone),
          to: endOfDay(today, timezone),
        };
      case Preset.last90d:
        return {
          preset,
          from: startOfDay(today.subtract({ days: 90 }), timezone),
          to: endOfDay(today, timezone),
        };
      case Preset.all:
        return {
          preset,
          from: undefined,
          to: undefined,
        };
    }
  }

  type DatePair = { fromDate: Temporal.PlainDate; toDate: Temporal.PlainDate };
  type InstantPair = { fromInstant: Temporal.Instant; toInstant: Temporal.Instant };
  export function fromDates({ fromDate, toDate }: DatePair, timezone: string): InstantPair {
    const fromInstant = startOfDay(fromDate, timezone);
    const toInstant = endOfDay(toDate, timezone);
    if (Temporal.Instant.compare(fromInstant, toInstant) >= 0) {
      throw new Error(`Illegal state: ${fromDate} must be strictly earlier than ${toDate}`);
    }
    return {
      fromInstant,
      toInstant,
    };
  }
  export function toDates({ fromInstant, toInstant }: InstantPair, timezone: string): DatePair {
    if (Temporal.Instant.compare(fromInstant, toInstant) >= 0) {
      throw new Error(`Illegal state: ${fromInstant} must be strictly earlier than ${toInstant}`);
    }
    const fromZdt = fromInstant.toZonedDateTimeISO(timezone);
    if (Temporal.ZonedDateTime.compare(fromZdt, fromZdt.toPlainDate().toZonedDateTime(timezone)) !== 0) {
      throw new Error(`Instant does not represent start-of-day: ${fromInstant}`);
    }
    const toZdt = toInstant.toZonedDateTimeISO(timezone);
    if (Temporal.ZonedDateTime.compare(toZdt, toZdt.toPlainDate().toZonedDateTime(timezone)) !== 0) {
      throw new Error(`Instant does not represent start-of-day: ${toInstant}`);
    }
    return {
      fromDate: fromZdt.toPlainDate(),
      toDate: toZdt.toPlainDate().subtract({ days: 1 }),
    };
  }

  function startOfDay(date: Temporal.PlainDate, timezone: string): Temporal.Instant {
    return date.toZonedDateTime(timezone).toInstant();
  }
  function endOfDay(date: Temporal.PlainDate, timezone: string): Temporal.Instant {
    return date.toZonedDateTime(timezone).add({ days: 1 }).toInstant();
  }
}
