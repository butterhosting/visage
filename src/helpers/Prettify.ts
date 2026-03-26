import { Temporal } from "@js-temporal/polyfill";

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
}
