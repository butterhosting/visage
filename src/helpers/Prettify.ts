import { Temporal } from "@js-temporal/polyfill";

// TODO: this has gotten out of control a bit .. simplify
export class Prettify {
  private static readonly monthNamesShort = [
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
  private static readonly monthNamesLong = [
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

  // TODO: this has become a mess ... clean it up
  public static month(variant: "short" | "long", instant: Temporal.Instant, timezone: string): string {
    const zdt = instant.toZonedDateTimeISO(timezone);
    const names = variant === "short" ? this.monthNamesShort : this.monthNamesLong;
    return `${names[zdt.month - 1]} ${zdt.year}`;
  }

  public static date(variant: "short" | "long", date: Temporal.PlainDate): string;
  public static date(variant: "short" | "long", instant: Temporal.Instant, timezone: string): string;
  public static date(variant: "short" | "long", dayOrInstant: Temporal.PlainDate | Temporal.Instant, timezone?: string): string {
    let date: Temporal.PlainDate | Temporal.ZonedDateTime;
    if (dayOrInstant instanceof Temporal.PlainDate) {
      date = dayOrInstant;
    } else {
      date = dayOrInstant.toZonedDateTimeISO(timezone!);
    }

    if (variant === "short") {
      return `${date.day} ${this.monthNamesShort[date.month - 1]}`;
    }
    return `${date.day} ${this.monthNamesLong[date.month - 1]} ${date.year}`;
  }

  public static time(instant: Temporal.Instant, timezone: string): string {
    const zdt = instant.toZonedDateTimeISO(timezone);
    const hours = String(zdt.hour).padStart(2, "0");
    const minutes = String(zdt.minute).padStart(2, "0");
    return `${zdt.day} ${this.monthNamesShort[zdt.month - 1]}, ${hours}:${minutes}`;
  }

  public static datetime(instant: Temporal.Instant, timezone: string): string {
    const wallClockTime = instant.toZonedDateTimeISO(timezone).toPlainDateTime();

    const day = wallClockTime.day;
    const month = this.monthNamesShort[wallClockTime.month - 1];
    const year = wallClockTime.year;

    const hours = String(wallClockTime.hour).padStart(2, "0");
    const minutes = String(wallClockTime.minute).padStart(2, "0");
    const seconds = String(wallClockTime.second).padStart(2, "0");

    return `${day} ${month} ${year} at ${hours}:${minutes}:${seconds}`;
  }

  public static number(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return n.toString();
  }

  public static percentage(percent: number): string {
    const formatted = percent === 0 ? "<0.1" : percent === 100 ? "100" : percent.toFixed(1);
    return `${formatted}%`;
  }

  public static duration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  }
}
