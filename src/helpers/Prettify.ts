import { Temporal } from "@js-temporal/polyfill";

// TODO: this has gotten out of control a bit .. simplify
export class Prettify {
  private static readonly monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  public static timestamp(instant: Temporal.Instant, timeZone: string): string {
    const wallClockTime = instant.toZonedDateTimeISO(timeZone).toPlainDateTime();

    const day = wallClockTime.day;
    const month = this.monthNames[wallClockTime.month - 1];
    const year = wallClockTime.year;

    const hours = String(wallClockTime.hour).padStart(2, "0");
    const minutes = String(wallClockTime.minute).padStart(2, "0");
    const seconds = String(wallClockTime.second).padStart(2, "0");

    return `${day} ${month} ${year} at ${hours}:${minutes}:${seconds}`;
  }

  public static date(date: Temporal.PlainDate): string {
    const day = date.day;
    const month = this.monthNames[date.month - 1];
    const year = date.year;
    return `${day} ${month} ${year}`;
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
