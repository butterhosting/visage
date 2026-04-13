import { Temporal } from "@js-temporal/polyfill";

export namespace Prettify {
  type FmtOpts = {
    yearFmt: "absent" | "present";
    monthFmt: "abbrev" | "full";
  };
  export function month(instant: Temporal.Instant, timezone: string, { monthFmt, yearFmt }: FmtOpts): string {
    const zdt = instant.toZonedDateTimeISO(timezone);
    const base = getMonthName(zdt.month - 1, monthFmt);
    switch (yearFmt) {
      case "absent":
        return base;
      case "present":
        return `${base} ${zdt.year}`;
    }
  }

  export function day(day: Temporal.PlainDate, opts: FmtOpts): string;
  export function day(instant: Temporal.Instant, timezone: string, opts: FmtOpts): string;
  export function day(dayOrInstant: Temporal.PlainDate | Temporal.Instant, optsOrTimezone?: FmtOpts | string, optsArg?: FmtOpts): string {
    let date: Temporal.PlainDate | Temporal.ZonedDateTime;
    let opts: FmtOpts;
    if (dayOrInstant instanceof Temporal.PlainDate) {
      date = dayOrInstant;
      opts = optsOrTimezone as FmtOpts;
    } else {
      date = dayOrInstant.toZonedDateTimeISO(optsOrTimezone as string);
      opts = optsArg as FmtOpts;
    }

    const base = `${date.day} ${getMonthName(date.month - 1, opts.monthFmt)}`;
    switch (opts.yearFmt) {
      case "absent":
        return base;
      case "present":
        return `${base} ${date.year}`;
    }
  }

  type TimstampOpts = FmtOpts & {
    secondFmt: "absent" | "present";
  };
  export function timestamp(instant: Temporal.Instant, timezone: string, { yearFmt, monthFmt, secondFmt }: TimstampOpts): string {
    const date = instant.toZonedDateTimeISO(timezone);
    let base = `${date.day} ${getMonthName(date.month - 1, monthFmt)}`;
    if (yearFmt === "present") {
      base = `${base} ${date.year}`;
    }

    const hours = String(date.hour).padStart(2, "0");
    const minutes = String(date.minute).padStart(2, "0");
    base = `${base}, ${hours}:${minutes}`;
    if (secondFmt === "present") {
      const seconds = String(date.second).padStart(2, "0");
      base = `${base}:${seconds}`;
    }
    return base;
  }

  export function number(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return n.toString();
  }

  export function percentage(percent: number): string {
    const formatted = percent === 0 ? "<0.1" : percent === 100 ? "100" : percent.toFixed(1);
    return `${formatted}%`;
  }

  export function duration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  }

  function getMonthName(zeroBasedIndex: number, fmt: "abbrev" | "full") {
    const MONTHS_ABBREV = [
      "Jan", //
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const MONTHS_FULL = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    switch (fmt) {
      case "abbrev":
        return MONTHS_ABBREV[zeroBasedIndex];
      case "full":
        return MONTHS_FULL[zeroBasedIndex];
    }
  }
}
