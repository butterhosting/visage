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
    return date.toZonedDateTime("UTC").toInstant(); // TODO: timezone?
  }
  function endOfDayX(date: Temporal.PlainDate): Temporal.Instant {
    return date.toZonedDateTime("UTC").add({ days: 1 }).toInstant(); // TODO: timezone?
  }

  type DatePair = { fromDate: Temporal.PlainDate; toDate: Temporal.PlainDate };
  type InstantPair = { fromInstant: Temporal.Instant; toInstant: Temporal.Instant };
  export function fromDates({ fromDate, toDate }: DatePair): InstantPair {
    const fromInstant = fromDate.toZonedDateTime("UTC").toInstant(); // TODO: timezone
    const toInstant = endOfDayX(toDate);
    if (Temporal.Instant.compare(fromInstant, toInstant) >= 0) {
      throw new Error(`Illegal state: ${fromDate} must be strictly earlier than ${toDate}`);
    }
    return {
      fromInstant: fromDate.toZonedDateTime("UTC").toInstant(), // TODO: timezone
      toInstant: endOfDayX(toDate),
    };
  }
  export function toDates({ fromInstant, toInstant }: InstantPair): DatePair {
    if (Temporal.Instant.compare(fromInstant, toInstant) >= 0) {
      throw new Error(`Illegal state: ${fromInstant} must be strictly earlier than ${toInstant}`);
    }
    const fromZdt = fromInstant.toZonedDateTimeISO("UTC"); // TODO: timezone
    if (Temporal.ZonedDateTime.compare(fromZdt, fromZdt.toPlainDate().toZonedDateTime("UTC")) !== 0) {
      // TODO: timezone (line above)
      throw new Error(`Instant does not represent start-of-day: ${fromInstant}`);
    }
    const toZdt = toInstant.toZonedDateTimeISO("UTC"); // TODO: timezone
    if (Temporal.ZonedDateTime.compare(toZdt, toZdt.toPlainDate().toZonedDateTime("UTC")) !== 0) {
      // TODO: timezone (line above)
      throw new Error(`Instant does not represent start-of-day: ${toInstant}`);
    }
    return {
      fromDate: fromZdt.toPlainDate(),
      toDate: toZdt.toPlainDate().subtract({ days: 1 }),
    };
  }

  export function forPreset(preset: Exclude<Preset, Preset.custom>): Period {
    const today = Temporal.Now.plainDateISO(); // TODO: timezone?
    switch (preset) {
      case Preset.today:
        return {
          preset,
          from: startOfDay(today),
          to: endOfDayX(today),
        };
      case Preset.yesterday:
        return {
          preset,
          from: startOfDay(today.subtract({ days: 1 })),
          to: endOfDayX(today.subtract({ days: 1 })),
        };
      case Preset.last7d:
        return {
          preset,
          from: startOfDay(today.subtract({ days: 7 })),
          to: endOfDayX(today),
        };
      case Preset.last30d:
        return {
          preset,
          from: startOfDay(today.subtract({ days: 30 })),
          to: endOfDayX(today),
        };
      case Preset.last90d:
        return {
          preset,
          from: startOfDay(today.subtract({ days: 90 })),
          to: endOfDayX(today),
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
