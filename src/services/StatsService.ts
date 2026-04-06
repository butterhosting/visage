import { $analyticsEvent } from "@/drizzle/schema";
import { Sqlite } from "@/drizzle/sqlite";
import { WebsiteError } from "@/errors/WebsiteError";
import { DistributionPoint } from "@/models/DistributionPoint";
import { Stats } from "@/models/Stats";
import { StatsQuery } from "@/models/StatsQuery";
import { TimeSeries } from "@/models/TimeSeries";
import { WebsiteRepository } from "@/repositories/WebsiteRepository";
import { Temporal } from "@js-temporal/polyfill";
import { and, count, desc, eq, gte, isNotNull, lte, max, min, sql, SQL } from "drizzle-orm";
import { SQLiteColumn } from "drizzle-orm/sqlite-core";

export class StatsService {
  public constructor(
    private readonly sqlite: Sqlite,
    private readonly websiteRepository: WebsiteRepository,
  ) {}

  public async query(query: StatsQuery): Promise<Stats>;
  public async query(query: unknown, unknown: "unknown"): Promise<Stats>;
  public async query(query: unknown | StatsQuery, unknown?: "unknown"): Promise<Stats> {
    let q = unknown ? StatsQuery.parse(query) : (query as StatsQuery);
    const website = await this.websiteRepository.find(q.website, () =>
      WebsiteError.not_found({
        ref: q.website,
      }),
    );

    const where = this.buildWhere(website.id, q);
    const whereForMedian = gte($analyticsEvent.durationSeconds, 5);

    const stats: Stats = {};
    if (q.fields.includes(Stats.Field.visitorsTotal)) {
      stats.visitorsTotal = await this.count([...where, eq($analyticsEvent.isVisitor, true)]);
    }
    if (q.fields.includes(Stats.Field.pageviewsTotal)) {
      stats.pageviewsTotal = await this.count(where);
    }
    if (q.fields.includes(Stats.Field.durationMedian)) {
      stats.durationMedian = await this.median([...where, whereForMedian]);
    }
    if (q.fields.includes(Stats.Field.visitorsTimeSeries)) {
      stats.visitorsTimeSeries = await this.timeSeries([...where, eq($analyticsEvent.isVisitor, true)], q, "visitor");
    }
    if (q.fields.includes(Stats.Field.pageviewsTimeSeries)) {
      stats.pageviewsTimeSeries = await this.timeSeries(where, q, "pageview");
    }
    if (q.fields.includes(Stats.Field.durationTimeSeries)) {
      stats.durationTimeSeries = await this.durationTimeSeries([...where, whereForMedian], q);
    }
    if (q.fields.includes(Stats.Field.pageDistribution)) {
      stats.pageDistribution = await this.distribution(where, $analyticsEvent.urlPath);
    }
    if (q.fields.includes(Stats.Field.sourceDistribution)) {
      stats.sourceDistribution = await this.distribution(where, $analyticsEvent.utmSource);
    }
    if (q.fields.includes(Stats.Field.screenDistribution)) {
      stats.screenDistribution = await this.screenDistribution(where);
    }
    if (q.fields.includes(Stats.Field.browserDistribution)) {
      stats.browserDistribution = await this.distribution(where, $analyticsEvent.deviceBrowserName);
    }
    if (q.fields.includes(Stats.Field.osDistribution)) {
      stats.osDistribution = await this.distribution(where, $analyticsEvent.deviceOsName);
    }
    if (q.fields.includes(Stats.Field.countryDistribution)) {
      stats.countryDistribution = await this.distribution(where, $analyticsEvent.geoCountryCode);
    }
    if (q.fields.includes(Stats.Field.cityDistribution)) {
      stats.cityDistribution = await this.distribution(where, $analyticsEvent.geoCityName);
    }
    return stats;
  }

  private buildWhere(websiteId: string, q: StatsQuery): SQL[] {
    const where: SQL[] = [eq($analyticsEvent.websiteId, websiteId)];
    if (q.from) where.push(gte($analyticsEvent.created, q.from.toString()));
    if (q.to) where.push(lte($analyticsEvent.created, q.to.toString()));
    if (q.page) where.push(eq($analyticsEvent.urlPath, q.page));
    if (q.source) where.push(eq($analyticsEvent.utmSource, q.source));
    if (q.screen) where.push(this.screenClassification(q.screen));
    if (q.browser) where.push(eq($analyticsEvent.deviceBrowserName, q.browser));
    if (q.os) where.push(eq($analyticsEvent.deviceOsName, q.os));
    if (q.country) where.push(eq($analyticsEvent.geoCountryCode, q.country));
    if (q.city) where.push(eq($analyticsEvent.geoCityName, q.city));
    return where;
  }

  private async analyzeUnitAndRange(
    where: SQL[],
    q: StatsQuery,
  ): Promise<{ tUnit: TimeSeries["tUnit"]; from: Temporal.Instant; to: Temporal.Instant } | undefined> {
    let from = q.from;
    let to = q.to;
    if (!from || !to) {
      const [{ earliest, latest }] = await this.sqlite
        .select({ earliest: min($analyticsEvent.created), latest: max($analyticsEvent.created) })
        .from($analyticsEvent)
        .where(and(...where));
      if (!earliest || !latest) {
        return undefined;
      }
      if (!from) {
        from = Temporal.Instant.from(earliest);
      }
      if (!to) {
        to = Temporal.Instant.from(latest);
      }
    }
    const hours = (to.epochMilliseconds - from.epochMilliseconds) / (1000 * 60 * 60);
    if (hours < 24 * 7) {
      return { tUnit: "hour", from, to }; // less than 7 days
    }
    if (hours / 24 < 30 * 7) {
      return { tUnit: "day", from, to }; // less than 10 months
    }
    return { tUnit: "month", from, to };
  }

  private strftimeFormat(unit: TimeSeries["tUnit"]): string {
    switch (unit) {
      case "hour":
        return "%Y-%m-%dT%H:00:00Z";
      case "day":
        return "%Y-%m-%dT00:00:00Z";
      case "month":
        return "%Y-%m-01T00:00:00Z";
    }
  }

  private async durationTimeSeries(where: SQL[], q: StatsQuery): Promise<TimeSeries> {
    const analysis = await this.analyzeUnitAndRange(where, q);
    if (!analysis) {
      return {
        data: [],
        tUnit: "day",
        yUnit: "second",
      };
    }
    const { tUnit, from, to } = analysis;
    const fmt = this.strftimeFormat(tUnit);
    const bucket = sql<string>`strftime(${fmt}, ${$analyticsEvent.created})`;
    const rows = await this.sqlite
      .select({ bucket, duration: $analyticsEvent.durationSeconds })
      .from($analyticsEvent)
      .where(and(...where))
      .orderBy(bucket, $analyticsEvent.durationSeconds);

    const buckets = new Map<string, number[]>();
    for (const r of rows) {
      const arr = buckets.get(r.bucket) ?? [];
      arr.push(r.duration!);
      buckets.set(r.bucket, arr);
    }

    const data = [...buckets.entries()].map<TimeSeries.Point>(([t, values]) => ({
      t: Temporal.Instant.from(t),
      y: values[Math.floor(values.length / 2)],
    }));
    return {
      tUnit: tUnit,
      yUnit: "second",
      data: this.fillGaps(data, tUnit, from, to),
    };
  }

  private async timeSeries(where: SQL[], q: StatsQuery, yUnit: "visitor" | "pageview"): Promise<TimeSeries> {
    const analysis = await this.analyzeUnitAndRange(where, q);
    if (!analysis) {
      return {
        data: [],
        tUnit: "day",
        yUnit,
      };
    }
    const { tUnit, from, to } = analysis;
    const fmt = this.strftimeFormat(tUnit);
    const bucket = sql<string>`strftime(${fmt}, ${$analyticsEvent.created})`;
    const rows = await this.sqlite
      .select({ bucket, count: count() })
      .from($analyticsEvent)
      .where(and(...where))
      .groupBy(bucket)
      .orderBy(bucket);

    const data = rows.map<TimeSeries.Point>((row) => ({
      t: Temporal.Instant.from(row.bucket),
      y: row.count,
    }));
    return {
      tUnit: tUnit,
      yUnit,
      data: this.fillGaps(data, tUnit, from, to),
    };
  }

  private fillGaps(data: TimeSeries.Point[], unit: TimeSeries["tUnit"], from: Temporal.Instant, to: Temporal.Instant): TimeSeries.Point[] {
    const existing = new Map<string, number>();
    for (const p of data) {
      existing.set(p.t.toString(), p.y);
    }
    const startZdt = from.toZonedDateTimeISO("UTC");
    let current: Temporal.ZonedDateTime;
    switch (unit) {
      case "hour":
        current = Temporal.ZonedDateTime.from({
          timeZone: "UTC",
          year: startZdt.year,
          month: startZdt.month,
          day: startZdt.day,
          hour: startZdt.hour,
        });
        break;
      case "day":
        current = Temporal.ZonedDateTime.from({
          timeZone: "UTC",
          year: startZdt.year,
          month: startZdt.month,
          day: startZdt.day,
        });
        break;
      case "month":
        current = Temporal.ZonedDateTime.from({
          timeZone: "UTC",
          year: startZdt.year,
          month: startZdt.month,
          day: 1,
        });
        break;
    }

    const duration = unit === "hour" ? { hours: 1 } : unit === "day" ? { days: 1 } : { months: 1 };
    const result: TimeSeries.Point[] = [];
    while (Temporal.Instant.compare(current.toInstant(), to) <= 0) {
      const instant = current.toInstant();
      result.push({ t: instant, y: existing.get(instant.toString()) ?? 0 });
      current = current.add(duration);
    }
    return result;
  }

  private async median(where: SQL[]): Promise<number> {
    const [{ total }] = await this.sqlite
      .select({ total: count() })
      .from($analyticsEvent)
      .where(and(...where));
    if (total === 0) return 0;
    const offset = Math.floor(total / 2);
    const result = await this.sqlite
      .select({ value: $analyticsEvent.durationSeconds })
      .from($analyticsEvent)
      .where(and(...where))
      .orderBy($analyticsEvent.durationSeconds)
      .limit(1)
      .offset(offset);
    return result[0].value ?? 0;
  }

  private async count(where: SQL[]): Promise<number> {
    const result = await this.sqlite
      .select({ count: count() })
      .from($analyticsEvent)
      .where(and(...where));
    return result[0].count;
  }

  private static readonly SCREEN_LABEL = sql<string>`case
    when ${$analyticsEvent.windowScreenWidth} < 768 then 'mobile'
    when ${$analyticsEvent.windowScreenWidth} < 1024 then 'tablet'
    else 'desktop'
  end`;

  private screenClassification(screen: string): SQL {
    return sql`${StatsService.SCREEN_LABEL} = ${screen}`;
  }

  private async screenDistribution(where: SQL[]): Promise<DistributionPoint[]> {
    const c = count();
    const rows = await this.sqlite
      .select({ label: StatsService.SCREEN_LABEL, count: c })
      .from($analyticsEvent)
      .where(and(...where))
      .groupBy(StatsService.SCREEN_LABEL)
      .orderBy(desc(c));
    return rows.map((r) => ({ label: r.label, value: r.count }));
  }

  private async distribution(where: SQL[], column: SQLiteColumn): Promise<DistributionPoint[]> {
    const c = count();
    const rows = await this.sqlite
      .select({ label: column, count: c })
      .from($analyticsEvent)
      .where(and(...where, isNotNull(column)))
      .groupBy(column)
      .orderBy(desc(c));
    return rows.map((r) => ({ label: r.label!, value: r.count }));
  }
}
