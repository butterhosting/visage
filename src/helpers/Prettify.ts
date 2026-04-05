import { TimeSeries } from "@/models/TimeSeries";
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

  public static number(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return n.toString();
  }

  public static duration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  }

  public static yValue(value: number, yUnit: TimeSeries["yUnit"]): string {
    if (yUnit === "second") return Prettify.duration(value);
    return Prettify.number(value);
  }

  public static yUnitLabel(yUnit: TimeSeries["yUnit"]): string {
    if (yUnit === "visitor") return "visitors";
    if (yUnit === "pageview") return "pageviews";
    return "";
  }

  public static longDate(instant: Temporal.Instant): string {
    const d = new Date(instant.epochMilliseconds);
    return d.toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" });
  }

  public static chartAxisLabel(t: Temporal.Instant, tUnit: TimeSeries["tUnit"]): string {
    const d = new Date(t.epochMilliseconds);
    if (tUnit === "month") return d.toLocaleDateString("en", { month: "short", year: "numeric" });
    if (tUnit === "day") return d.toLocaleDateString("en", { day: "numeric", month: "short" });
    return d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
  }

  public static chartTooltipLabel(t: Temporal.Instant, tUnit: TimeSeries["tUnit"]): string {
    const d = new Date(t.epochMilliseconds);
    if (tUnit === "month") return d.toLocaleDateString("en", { month: "long", year: "numeric" });
    if (tUnit === "day") return d.toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" });
    return d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
  }
}
