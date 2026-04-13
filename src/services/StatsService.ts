import { $analyticsEvent } from "@/drizzle/schema";
import { Sqlite } from "@/drizzle/sqlite";
import { Env } from "@/Env";
import { ServerError } from "@/errors/ServerError";
import { WebsiteError } from "@/errors/WebsiteError";
import { AuthHelper } from "@/helpers/AuthHelper";
import { Distribution } from "@/models/Distribution";
import { Stats } from "@/models/Stats";
import { StatsQuery } from "@/models/StatsQuery";
import { TimeSeries } from "@/models/TimeSeries";
import { Website } from "@/models/Website";
import { WebsiteRepository } from "@/repositories/WebsiteRepository";
import { Temporal } from "@js-temporal/polyfill";
import { and, count, desc, eq, gte, isNull, lt, max, min, sql, SQL } from "drizzle-orm";
import { SQLiteColumn } from "drizzle-orm/sqlite-core";
import { TokenService } from "./TokenService";

export class StatsService {
  private static readonly SCREEN_LABEL = sql<string>`case
    when ${$analyticsEvent.windowScreenWidth} < 768 then 'mobile'
    when ${$analyticsEvent.windowScreenWidth} < 1024 then 'tablet'
    else 'desktop'
  end`;

  private readonly helper: Internal.Helper;

  public constructor(
    env: Env.Private,
    private readonly sqlite: Sqlite,
    tokenService: TokenService,
    private readonly websiteRepository: WebsiteRepository,
  ) {
    this.helper = new Internal.Helper(env, tokenService);
  }

  public async queryInternal(query: StatsQuery): Promise<Stats>;
  public async queryInternal(query: unknown, unknown: "unknown"): Promise<Stats>;
  public async queryInternal(query: StatsQuery | unknown, unknown?: "unknown"): Promise<Stats> {
    const q = unknown === "unknown" ? StatsQuery.parse(query) : (query as StatsQuery);
    const website = await this.websiteRepository.find(q.website, () =>
      WebsiteError.not_found({
        ref: q.website,
      }),
    );
    return await this.query(q, website);
  }

  public async queryExternal(query: unknown, authorization?: string): Promise<Stats> {
    // TODO: proper error handling, because this is a public API, so we definitely need a StatsError ...
    const q = StatsQuery.parse(query);
    const website = await this.websiteRepository.find(q.website, () =>
      WebsiteError.not_found({
        ref: q.website,
      }),
    );
    await this.helper.authnz(website, authorization);
    return await this.query(q, website);
  }

  private async query(q: StatsQuery, website: Website): Promise<Stats> {
    const baseWhere = eq($analyticsEvent.websiteId, website.id);
    const queryWhere = [baseWhere, ...this.queryWhere(q)];
    const medianWhere = gte($analyticsEvent.durationSeconds, 5);

    const stats: Stats = {};
    if (q.fields?.includes(Stats.Field.visitorsTotal)) {
      stats.visitorsTotal = await this.count([...queryWhere, eq($analyticsEvent.isVisitor, true)]);
    }
    if (q.fields?.includes(Stats.Field.pageviewsTotal)) {
      stats.pageviewsTotal = await this.count(queryWhere);
    }
    if (q.fields?.includes(Stats.Field.pagetimeMedian)) {
      stats.pagetimeMedian = await this.median([...queryWhere, medianWhere]);
    }
    if (q.fields?.includes(Stats.Field.livePageviewsTotal)) {
      const to = Temporal.Now.instant();
      const from = to.subtract({ minutes: 10 });
      stats.livePageviewsTotal = await this.count([
        baseWhere,
        gte($analyticsEvent.created, from.toString()),
        lt($analyticsEvent.created, to.toString()),
      ]);
    }
    if (q.fields?.includes(Stats.Field.visitorsTimeSeries)) {
      stats.visitorsTimeSeries = await this.timeSeries([...queryWhere, eq($analyticsEvent.isVisitor, true)], q, "visitor");
    }
    if (q.fields?.includes(Stats.Field.pageviewsTimeSeries)) {
      stats.pageviewsTimeSeries = await this.timeSeries(queryWhere, q, "pageview");
    }
    if (q.fields?.includes(Stats.Field.pagetimeTimeSeries)) {
      stats.pagetimeTimeSeries = await this.timeSeries([...queryWhere, medianWhere], q, "second");
    }
    if (q.fields?.includes(Stats.Field.pageDistribution)) {
      stats.pageDistribution = await this.distribution(
        queryWhere,
        $analyticsEvent.urlPath,
        q.pageDistributionLimit,
        q.pageDistributionOffset,
      );
    }
    if (q.fields?.includes(Stats.Field.sourceDistribution)) {
      stats.sourceDistribution = await this.distribution(
        queryWhere,
        $analyticsEvent.utmSource,
        q.sourceDistributionLimit,
        q.sourceDistributionOffset,
      );
    }
    if (q.fields?.includes(Stats.Field.screenDistribution)) {
      stats.screenDistribution = await this.distribution(queryWhere, "screen", q.screenDistributionLimit, q.screenDistributionOffset);
    }
    if (q.fields?.includes(Stats.Field.browserDistribution)) {
      stats.browserDistribution = await this.distribution(
        queryWhere,
        $analyticsEvent.deviceBrowserName,
        q.browserDistributionLimit,
        q.browserDistributionOffset,
      );
    }
    if (q.fields?.includes(Stats.Field.osDistribution)) {
      stats.osDistribution = await this.distribution(
        queryWhere,
        $analyticsEvent.deviceOsName,
        q.osDistributionLimit,
        q.osDistributionOffset,
      );
    }
    if (q.fields?.includes(Stats.Field.countryDistribution)) {
      stats.countryDistribution = await this.distribution(
        queryWhere,
        $analyticsEvent.geoCountryCode,
        q.countryDistributionLimit,
        q.countryDistributionOffset,
      );
    }
    if (q.fields?.includes(Stats.Field.cityDistribution)) {
      stats.cityDistribution = await this.distribution(
        queryWhere,
        $analyticsEvent.geoCityName,
        q.cityDistributionLimit,
        q.cityDistributionOffset,
      );
    }
    return stats;
  }

  private queryWhere(q: StatsQuery): SQL[] {
    const where: SQL[] = [];
    if (q.from !== undefined) {
      where.push(gte($analyticsEvent.created, q.from.toString()));
    }
    if (q.to !== undefined) {
      where.push(lt($analyticsEvent.created, q.to.toString()));
    }
    if (q.page !== undefined) {
      where.push(eq($analyticsEvent.urlPath, q.page));
    }
    if (q.source !== undefined) {
      where.push(q.source === null ? isNull($analyticsEvent.utmSource) : eq($analyticsEvent.utmSource, q.source));
    }
    if (q.screen !== undefined) {
      where.push(this.screenClassification(q.screen));
    }
    if (q.browser !== undefined) {
      where.push(q.browser === null ? isNull($analyticsEvent.deviceBrowserName) : eq($analyticsEvent.deviceBrowserName, q.browser));
    }
    if (q.os !== undefined) {
      where.push(q.os === null ? isNull($analyticsEvent.deviceOsName) : eq($analyticsEvent.deviceOsName, q.os));
    }
    if (q.country !== undefined) {
      where.push(q.country === null ? isNull($analyticsEvent.geoCountryCode) : eq($analyticsEvent.geoCountryCode, q.country));
    }
    if (q.city !== undefined) {
      where.push(q.city === null ? isNull($analyticsEvent.geoCityName) : eq($analyticsEvent.geoCityName, q.city));
    }
    return where;
  }

  private async timeSeries(where: SQL[], q: StatsQuery, yUnit: "visitor" | "pageview" | "second"): Promise<TimeSeries> {
    const analysis = await this.analyzeUnitAndRange(where, q);
    if (!analysis) {
      return {
        tUnit: "day",
        yUnit,
        data: [],
      };
    }

    const { tUnit, from, to } = analysis;
    const fmt = this.helper.sqliteStrftimeFormat(tUnit);
    const modifier = this.helper.sqliteOffsetModifier(from);
    const bucket = sql<string>`strftime(${fmt}, datetime(${$analyticsEvent.created}, ${modifier}))`;

    let data: TimeSeries.Point[];
    if (yUnit === "second") {
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
      data = [...buckets.entries()].map<TimeSeries.Point>(([bucket, values]) => ({
        t: this.helper.assertBucketAlignment(this.helper.revertBucketBackToInstant(bucket), tUnit),
        y: values[Math.floor(values.length / 2)],
      }));
    } else {
      const rows = await this.sqlite
        .select({ bucket, count: count() })
        .from($analyticsEvent)
        .where(and(...where))
        .groupBy(bucket)
        .orderBy(bucket);
      data = rows.map<TimeSeries.Point>((row) => ({
        t: this.helper.assertBucketAlignment(this.helper.revertBucketBackToInstant(row.bucket), tUnit),
        y: row.count,
      }));
    }

    return {
      tUnit: tUnit,
      yUnit,
      data: this.helper.fillGaps(data, tUnit, from, to),
    };
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

  private screenClassification(screen: string): SQL {
    return sql`${StatsService.SCREEN_LABEL} = ${screen}`;
  }

  private async distribution(where: SQL[], column: SQLiteColumn | "screen", limit = 10, offset = 0): Promise<Distribution> {
    const c = count();
    let rows: Distribution["data"];
    if (column === "screen") {
      rows = await this.sqlite
        .select({ value: StatsService.SCREEN_LABEL, count: c })
        .from($analyticsEvent)
        .where(and(...where))
        .groupBy(StatsService.SCREEN_LABEL)
        .orderBy(desc(c))
        .limit(limit + 1)
        .offset(offset);
    } else if (column.name === $analyticsEvent.geoCityName.name) {
      rows = await this.sqlite
        .select({ value: column, count: c, meta: { country: $analyticsEvent.geoCountryCode } })
        .from($analyticsEvent)
        .where(and(...where))
        .groupBy(column)
        .orderBy(desc(c))
        .limit(limit + 1)
        .offset(offset);
      rows = rows.map((r) => (r.value === null ? { ...r, meta: { country: null } } : r));
    } else {
      rows = await this.sqlite
        .select({ value: column, count: c })
        .from($analyticsEvent)
        .where(and(...where))
        .groupBy(column)
        .orderBy(desc(c))
        .limit(limit + 1)
        .offset(offset);
    }
    const hasMore = rows.length > limit;
    return { limit, offset, hasMore, data: rows.slice(0, limit) };
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
}

namespace Internal {
  export class Helper {
    public constructor(
      private readonly env: Env.Private,
      readonly tokenService: TokenService,
    ) {}

    public async authnz(website: Website, authorization?: string): Promise<void> {
      const headerToken = AuthHelper.extractBearerToken(authorization) || AuthHelper.extractBasicAuth(authorization)?.password;
      if (!headerToken) {
        throw ServerError.unauthorized();
      }
      const databaseToken = await this.tokenService.validate(headerToken);
      if (!databaseToken) {
        throw ServerError.unauthorized();
      }
      if (databaseToken.websiteIds !== "*" && !databaseToken.websiteIds.includes(website.id)) {
        throw ServerError.forbidden();
      }
    }

    public sqliteStrftimeFormat(unit: TimeSeries["tUnit"]): string {
      switch (unit) {
        case "hour":
          return "%Y-%m-%dT%H:00:00";
        case "day":
          return "%Y-%m-%dT00:00:00";
        case "month":
          return "%Y-%m-01T00:00:00";
      }
    }

    public sqliteOffsetModifier(referenceInstant: Temporal.Instant): string {
      const offsetSeconds = referenceInstant.toZonedDateTimeISO(this.env.O_VISAGE_TIMEZONE).offsetNanoseconds / 1e9;
      return `${offsetSeconds >= 0 ? "+" : ""}${offsetSeconds} seconds`;
    }

    public revertBucketBackToInstant(bucket: string): Temporal.Instant {
      return Temporal.PlainDateTime.from(bucket).toZonedDateTime(this.env.O_VISAGE_TIMEZONE).toInstant();
    }

    public assertBucketAlignment(bucketInstant: Temporal.Instant, tUnit: TimeSeries["tUnit"]): Temporal.Instant {
      const zdt = bucketInstant.toZonedDateTimeISO(this.env.O_VISAGE_TIMEZONE);
      switch (tUnit) {
        case "hour":
          if (zdt.minute !== 0 || zdt.second !== 0 || zdt.millisecond !== 0 || zdt.microsecond !== 0 || zdt.nanosecond !== 0) {
            throw new Error(`Expected hour-aligned bucket instant, got ${bucketInstant}`);
          }
          break;
        case "day":
          if (
            zdt.hour !== 0 ||
            zdt.minute !== 0 ||
            zdt.second !== 0 ||
            zdt.millisecond !== 0 ||
            zdt.microsecond !== 0 ||
            zdt.nanosecond !== 0
          ) {
            throw new Error(`Expected day-aligned bucket instant, got ${bucketInstant}`);
          }
          break;
        case "month":
          if (
            zdt.day !== 1 ||
            zdt.hour !== 0 ||
            zdt.minute !== 0 ||
            zdt.second !== 0 ||
            zdt.millisecond !== 0 ||
            zdt.microsecond !== 0 ||
            zdt.nanosecond !== 0
          ) {
            throw new Error(`Expected month-aligned bucket instant, got ${bucketInstant}`);
          }
          break;
      }
      return bucketInstant;
    }

    public fillGaps(data: TimeSeries.Point[], unit: TimeSeries["tUnit"], from: Temporal.Instant, to: Temporal.Instant): TimeSeries.Point[] {
      const existing = new Map<string, number>();
      for (const p of data) {
        existing.set(p.t.toString(), p.y);
      }
      const tz = this.env.O_VISAGE_TIMEZONE;
      const startZdt = from.toZonedDateTimeISO(tz);
      let current: Temporal.ZonedDateTime;
      switch (unit) {
        case "hour":
          current = Temporal.ZonedDateTime.from({
            timeZone: tz,
            year: startZdt.year,
            month: startZdt.month,
            day: startZdt.day,
            hour: startZdt.hour,
          });
          break;
        case "day":
          current = Temporal.ZonedDateTime.from({
            timeZone: tz,
            year: startZdt.year,
            month: startZdt.month,
            day: startZdt.day,
          });
          break;
        case "month":
          current = Temporal.ZonedDateTime.from({
            timeZone: tz,
            year: startZdt.year,
            month: startZdt.month,
            day: 1,
          });
          break;
      }

      const duration = unit === "hour" ? { hours: 1 } : unit === "day" ? { days: 1 } : { months: 1 };
      const result: TimeSeries.Point[] = [];
      while (Temporal.Instant.compare(current.toInstant(), to) < 0) {
        const instant = current.toInstant();
        result.push({
          t: instant,
          y: existing.get(instant.toString()) ?? 0,
        });
        current = current.add(duration);
      }
      return result;
    }
  }
}
