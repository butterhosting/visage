import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { Stats } from "@/models/Stats";
import { StatsQuery } from "@/models/StatsQuery";
import { Website } from "@/models/Website";
import { TestEnvironment } from "@/testing/TestEnvironment.test";
import { TestFixture } from "@/testing/TestFixture.test";
import { Temporal } from "@js-temporal/polyfill";
import { beforeEach, describe, expect, it } from "bun:test";
import { StatsService } from "./StatsService";
import { NullSentinel } from "@/helpers/NullSentinel";
import { Distribution } from "@/models/Distribution";

describe(StatsService.name, () => {
  let context: TestEnvironment.Context;
  let service: StatsService;
  let website: Website;

  beforeEach(async () => {
    context = await TestEnvironment.initialize();
    service = new StatsService(context.env, context.sqlite, context.tokenServiceMock.cast(), context.websiteRepository);
    website = await context.websiteRepository.create(TestFixture.website());
  });

  async function seed(overrides: Array<Partial<AnalyticsEvent>>, websiteId = website.id) {
    await Promise.all(overrides.map((o) => context.analyticsEventRepository.create(TestFixture.analyticsEvent({ websiteId, ...o }))));
  }

  async function query(fields: Stats.Field[], filters: Omit<StatsQuery, "website" | "fields"> = {}): Promise<Stats> {
    return service.queryInternal({ website: website.id, fields, ...filters });
  }

  function t(iso: string) {
    return Temporal.Instant.from(iso);
  }

  describe("TOTALS", () => {
    it("counts visitors and pageviews", async () => {
      // given
      await seed([{ isVisitor: true }, { isVisitor: true }, { isVisitor: false }]);
      // when
      const stats = await query([Stats.Field.visitorsTotal, Stats.Field.pageviewsTotal]);
      // then
      expect(stats).toEqual({
        visitorsTotal: 2,
        pageviewsTotal: 3,
      });
    });

    it("returns zero for empty website", async () => {
      // when
      const stats = await query([Stats.Field.visitorsTotal, Stats.Field.pageviewsTotal, Stats.Field.pagetimeMedian]);
      // then
      expect(stats).toEqual({
        visitorsTotal: 0,
        pageviewsTotal: 0,
        pagetimeMedian: 0,
      });
    });

    it("computes median pagetime (ignoring durations < 5s)", async () => {
      // given - durations: 2, 5, 10, 20, 30 → only 5, 10, 20, 30 qualify → median at index 2 = 20
      await seed([
        { durationSeconds: 2 },
        { durationSeconds: 5 },
        { durationSeconds: 10 },
        { durationSeconds: 20 },
        { durationSeconds: 30 },
      ]);
      // when
      const stats = await query([Stats.Field.pagetimeMedian]);
      // then
      expect(stats).toEqual({ pagetimeMedian: 20 });
    });
  });

  describe("FILTERS", () => {
    const tests: Array<{
      name: string;
      events: Array<Partial<AnalyticsEvent>>;
      filter: Omit<StatsQuery, "website" | "fields">;
      expectedCount: number;
    }> = [
      {
        name: "from/to date range",
        events: [{ created: t("2025-06-01T00:00:00Z") }, { created: t("2025-06-15T00:00:00Z") }, { created: t("2025-07-01T00:00:00Z") }],
        filter: { from: t("2025-06-01T00:00:00Z"), to: t("2025-07-01T00:00:00Z") },
        expectedCount: 2,
      },
      {
        name: "page filter",
        events: [{ url: { hostname: "abc.com", path: "/about" } }, { url: { hostname: "abc.com", path: "/pricing" } }],
        filter: { page: "/about" },
        expectedCount: 1,
      },
      {
        name: "source filter",
        events: [{ utm: { source: "google" } }, { utm: { source: "twitter" } }, { utm: {} }],
        filter: { source: "google" },
        expectedCount: 1,
      },
      {
        name: "source filter (null = direct traffic)",
        events: [{ utm: { source: "google" } }, { utm: {} }],
        filter: { source: null },
        expectedCount: 1,
      },
      {
        name: "screen filter (mobile < 768)",
        events: [
          { window: { screenWidth: 375, screenHeight: 812, viewportWidth: 375, viewportHeight: 700 } },
          { window: { screenWidth: 1920, screenHeight: 1080, viewportWidth: 1920, viewportHeight: 1080 } },
        ],
        filter: { screen: "mobile" },
        expectedCount: 1,
      },
      {
        name: "browser filter",
        events: [{ device: { browserName: "Chrome" } }, { device: { browserName: "Firefox" } }],
        filter: { browser: "Chrome" },
        expectedCount: 1,
      },
      {
        name: "os filter",
        events: [{ device: { osName: "macOS" } }, { device: { osName: "Windows" } }],
        filter: { os: "macOS" },
        expectedCount: 1,
      },
      {
        name: "country filter",
        events: [{ geo: { countryCode: "US" } }, { geo: { countryCode: "DE" } }],
        filter: { country: "US" },
        expectedCount: 1,
      },
      {
        name: "city filter",
        events: [{ geo: { cityName: "Berlin" } }, { geo: { cityName: "Paris" } }],
        filter: { city: "Berlin" },
        expectedCount: 1,
      },
    ];

    for (const { name, events, filter, expectedCount } of tests) {
      it(name, async () => {
        // given
        await seed(events);
        // when
        const stats = await query([Stats.Field.pageviewsTotal], filter);
        // then
        expect(stats).toEqual({ pageviewsTotal: expectedCount });
      });
    }

    // deepMerge can't clear optional fields to undefined, so construct directly
    it("browser filter (null)", async () => {
      // given
      const withBrowser = TestFixture.analyticsEvent({ websiteId: website.id, device: { browserName: "Chrome" } });
      const withoutBrowser: AnalyticsEvent = {
        ...TestFixture.analyticsEvent({ websiteId: website.id }),
        device: {},
      };
      // when
      await context.analyticsEventRepository.create(withBrowser);
      await context.analyticsEventRepository.create(withoutBrowser);
      // then
      const stats = await query([Stats.Field.pageviewsTotal], { browser: null });
      expect(stats).toEqual({ pageviewsTotal: 1 });
    });
  });

  describe("DISTRIBUTIONS", () => {
    const tests: Array<{
      field: Stats.Field;
      events: Array<Partial<AnalyticsEvent>>;
      expected: Record<string, number>;
    }> = [
      {
        field: Stats.Field.pageDistribution,
        events: [
          { url: { hostname: "abc.com", path: "/" } },
          { url: { hostname: "abc.com", path: "/" } },
          { url: { hostname: "abc.com", path: "/about" } },
        ],
        expected: {
          "/": 2,
          "/about": 1,
        },
      },
      {
        field: Stats.Field.sourceDistribution,
        events: [{ utm: { source: "google" } }, { utm: { source: "google" } }, { utm: {} }],
        expected: {
          google: 2,
          [NullSentinel.VALUE]: 1,
        },
      },
      {
        field: Stats.Field.screenDistribution,
        events: [
          { window: { screenWidth: 1920, screenHeight: 1080, viewportWidth: 1920, viewportHeight: 1080 } },
          { window: { screenWidth: 375, screenHeight: 812, viewportWidth: 375, viewportHeight: 700 } },
          { window: { screenWidth: 1440, screenHeight: 900, viewportWidth: 1440, viewportHeight: 900 } },
        ],
        expected: {
          desktop: 2,
          mobile: 1,
        },
      },
      {
        field: Stats.Field.browserDistribution,
        events: [{ device: { browserName: "Chrome" } }, { device: { browserName: "Chrome" } }, { device: { browserName: "Safari" } }],
        expected: {
          Chrome: 2,
          Safari: 1,
        },
      },
      {
        field: Stats.Field.osDistribution,
        events: [{ device: { osName: "macOS" } }, { device: { osName: "macOS" } }, { device: { osName: "Linux" } }],
        expected: {
          macOS: 2,
          Linux: 1,
        },
      },
      {
        field: Stats.Field.countryDistribution,
        events: [{ geo: { countryCode: "DE" } }, { geo: { countryCode: "DE" } }, { geo: { countryCode: "US" } }],
        expected: {
          DE: 2,
          US: 1,
        },
      },
      {
        field: Stats.Field.cityDistribution,
        events: [
          { geo: { countryCode: "DE", cityName: "Berlin" } },
          { geo: { countryCode: "DE", cityName: "Berlin" } },
          { geo: { countryCode: "US", cityName: "NYC" } },
        ],
        expected: {
          Berlin: 2,
          NYC: 1,
        },
      },
    ];
    for (const { field, events, expected } of tests) {
      it(field, async () => {
        // given
        await seed(events);
        // when
        const stats = await query([field]);
        const distribution = stats[field] as Distribution;
        // then
        expect(distribution).toBeDefined();
        expect(distribution.data).toHaveLength(Object.entries(expected).length);
        // then (sorted)
        const counts = distribution.data.map(({ count }) => count);
        expect(counts).toEqual(counts.toSorted().reverse()); // desc
        // then (contents)
        for (const [key, count] of Object.entries(expected)) {
          const value = NullSentinel.decode(key);
          const entry = distribution!.data.find((d) => d.value === value);
          expect(entry).toEqual(
            expect.objectContaining({
              value,
              count,
            }),
          );
        }
      });
    }

    it("city distribution includes country meta", async () => {
      // given
      await seed([{ geo: { countryCode: "DE", cityName: "Berlin" } }]);
      // when
      const stats = await query([Stats.Field.cityDistribution]);
      // then
      expect(stats.cityDistribution!.data).toEqual([
        {
          count: 1,
          value: "Berlin",
          meta: { countryCode: "DE" },
        },
      ]);
    });

    it("supports null values", async () => {
      // given
      await seed([{ utm: {} }, { utm: {} }, { utm: { source: "google" } }]);
      // when
      const stats = await query([Stats.Field.sourceDistribution]);
      // then
      const nullEntry = stats.sourceDistribution!.data.find((d) => d.value === null);
      expect(nullEntry).toEqual({
        count: 2,
        value: null,
      });
    });

    it("paginates with limit and offset", async () => {
      // given
      await seed([
        // "a" ✕ 5
        { url: { hostname: "abc.com", path: "/a" } },
        { url: { hostname: "abc.com", path: "/a" } },
        { url: { hostname: "abc.com", path: "/a" } },
        { url: { hostname: "abc.com", path: "/a" } },
        { url: { hostname: "abc.com", path: "/a" } },
        // "b" ✕ 4
        { url: { hostname: "abc.com", path: "/b" } },
        { url: { hostname: "abc.com", path: "/b" } },
        { url: { hostname: "abc.com", path: "/b" } },
        { url: { hostname: "abc.com", path: "/b" } },
        // "c" ✕ 3
        { url: { hostname: "abc.com", path: "/c" } },
        { url: { hostname: "abc.com", path: "/c" } },
        { url: { hostname: "abc.com", path: "/c" } },
        // "d" ✕ 2
        { url: { hostname: "abc.com", path: "/d" } },
        { url: { hostname: "abc.com", path: "/d" } },
        // "e" ✕ 1
        { url: { hostname: "abc.com", path: "/e" } },
      ]);

      // when
      const miniPage1 = await query([Stats.Field.pageDistribution], { pageDistributionLimit: 2 });
      // then
      expect(miniPage1).toEqual({
        pageDistribution: {
          limit: 2,
          offset: 0,
          hasMore: true,
          data: [
            { count: 5, value: "/a" },
            { count: 4, value: "/b" },
          ],
        },
      });

      // when
      const miniPage2 = await query([Stats.Field.pageDistribution], { pageDistributionLimit: 2, pageDistributionOffset: 2 });
      // then
      expect(miniPage2).toEqual({
        pageDistribution: {
          limit: 2,
          offset: 2,
          hasMore: true,
          data: [
            { count: 3, value: "/c" },
            { count: 2, value: "/d" },
          ],
        },
      });

      // when
      const miniPage3 = await query([Stats.Field.pageDistribution], { pageDistributionLimit: 2, pageDistributionOffset: 4 });
      // then
      expect(miniPage3).toEqual({
        pageDistribution: {
          limit: 2,
          offset: 4,
          hasMore: false,
          data: [{ count: 1, value: "/e" }],
        },
      });
    });
  });

  describe("TIME SERIES", () => {
    it("uses hourly buckets for ranges < 7 days", async () => {
      // given
      await seed([
        { created: t("2025-06-10T08:12:00Z"), isVisitor: true },
        { created: t("2025-06-10T08:30:00Z"), isVisitor: true },
        { created: t("2025-06-10T10:00:00Z"), isVisitor: true },
      ]);

      // when
      const stats = await query([Stats.Field.visitorsTimeSeries], {
        from: t("2025-06-10T08:00:00Z"),
        to: t("2025-06-10T11:00:00Z"),
      });

      // then
      expect(stats).toEqual({
        visitorsTimeSeries: {
          yUnit: "visitor",
          tUnit: "hour",
          data: [
            { t: t("2025-06-10T08:00:00Z"), y: 2 },
            { t: t("2025-06-10T09:00:00Z"), y: 0 },
            { t: t("2025-06-10T10:00:00Z"), y: 1 },
          ],
        },
      });
    });

    it("uses daily buckets for ranges between 7 days and ~7 months", async () => {
      // given
      await seed([{ created: t("2025-06-01T12:00:00Z") }, { created: t("2025-06-01T18:00:00Z") }, { created: t("2025-06-03T12:00:00Z") }]);

      // when
      const stats = await query([Stats.Field.pageviewsTimeSeries], {
        from: t("2025-06-01T00:00:00Z"),
        to: t("2025-06-10T00:00:00Z"),
      });

      // then
      expect(stats).toEqual({
        pageviewsTimeSeries: {
          yUnit: "pageview",
          tUnit: "day",
          data: [
            { t: t("2025-06-01T00:00:00Z"), y: 2 },
            { t: t("2025-06-02T00:00:00Z"), y: 0 },
            { t: t("2025-06-03T00:00:00Z"), y: 1 },
            { t: t("2025-06-04T00:00:00Z"), y: 0 },
            { t: t("2025-06-05T00:00:00Z"), y: 0 },
            { t: t("2025-06-06T00:00:00Z"), y: 0 },
            { t: t("2025-06-07T00:00:00Z"), y: 0 },
            { t: t("2025-06-08T00:00:00Z"), y: 0 },
            { t: t("2025-06-09T00:00:00Z"), y: 0 },
          ],
        },
      });
    });

    it("uses monthly buckets for ranges > ~7 months", async () => {
      // given
      await seed([
        { created: t("2025-01-15T12:00:00Z") },
        { created: t("2025-06-10T12:00:00Z") },
        { created: t("2025-06-20T12:00:00Z") },
        { created: t("2025-12-01T12:00:00Z") },
      ]);

      // when
      const stats = await query([Stats.Field.pageviewsTimeSeries], {
        from: t("2025-01-01T00:00:00Z"),
        to: t("2026-01-01T00:00:00Z"),
      });

      // then
      expect(stats).toEqual({
        pageviewsTimeSeries: {
          yUnit: "pageview",
          tUnit: "month",
          data: [
            { t: t("2025-01-01T00:00:00Z"), y: 1 },
            { t: t("2025-02-01T00:00:00Z"), y: 0 },
            { t: t("2025-03-01T00:00:00Z"), y: 0 },
            { t: t("2025-04-01T00:00:00Z"), y: 0 },
            { t: t("2025-05-01T00:00:00Z"), y: 0 },
            { t: t("2025-06-01T00:00:00Z"), y: 2 },
            { t: t("2025-07-01T00:00:00Z"), y: 0 },
            { t: t("2025-08-01T00:00:00Z"), y: 0 },
            { t: t("2025-09-01T00:00:00Z"), y: 0 },
            { t: t("2025-10-01T00:00:00Z"), y: 0 },
            { t: t("2025-11-01T00:00:00Z"), y: 0 },
            { t: t("2025-12-01T00:00:00Z"), y: 1 },
          ],
        },
      });
    });

    it("returns empty data when no from/to and no events exist", async () => {
      // when
      const stats = await query([Stats.Field.pageviewsTimeSeries]);
      // then
      expect(stats).toEqual({
        pageviewsTimeSeries: {
          tUnit: expect.anything(),
          yUnit: "pageview",
          data: [],
        },
      });
    });

    it("fills gaps with zeros when from/to specified but no events match", async () => {
      // when
      const stats = await query([Stats.Field.pageviewsTimeSeries], {
        from: t("2025-06-01T00:00:00Z"),
        to: t("2025-06-02T00:00:00Z"),
      });
      // then
      expect(stats).toEqual({
        pageviewsTimeSeries: {
          tUnit: "hour",
          yUnit: "pageview",
          data: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map((h) => ({
            t: t(`2025-06-01T${String(h).padStart(2, "0")}:00:00Z`),
            y: 0,
          })),
        },
      });
    });

    it("computes median per bucket", async () => {
      // given
      await seed([
        // bucket 08:00: durations 5, 10, 20 → median at floor(3/2)=1 → 10
        { created: t("2025-06-10T08:00:00Z"), durationSeconds: 5 },
        { created: t("2025-06-10T08:10:00Z"), durationSeconds: 10 },
        { created: t("2025-06-10T08:20:00Z"), durationSeconds: 20 },
        // bucket 09:00: durations 30, 60 → median at floor(2/2)=1 → 60
        { created: t("2025-06-10T09:00:00Z"), durationSeconds: 30 },
        { created: t("2025-06-10T09:30:00Z"), durationSeconds: 60 },
      ]);

      // when
      const stats = await query([Stats.Field.pagetimeTimeSeries], {
        from: t("2025-06-10T08:00:00Z"),
        to: t("2025-06-10T10:00:00Z"),
      });

      // then
      expect(stats).toEqual({
        pagetimeTimeSeries: {
          tUnit: "hour",
          yUnit: "second",
          data: [
            { t: t("2025-06-10T08:00:00Z"), y: 10 },
            { t: t("2025-06-10T09:00:00Z"), y: 60 },
          ],
        },
      });
    });

    it("auto-detects range from data when from/to is not specified", async () => {
      // given
      await seed([
        { created: t("2025-06-10T08:00:00Z"), isVisitor: true },
        { created: t("2025-06-10T10:00:00Z"), isVisitor: true },
      ]);

      // when
      const stats = await query([Stats.Field.visitorsTimeSeries]);

      // then
      expect(stats).toEqual({
        visitorsTimeSeries: expect.objectContaining({
          tUnit: "hour",
        }),
      });
    });
  });

  describe("ISOLATION", () => {
    it("does not leak data between websites", async () => {
      // given
      await seed([{ isVisitor: true }]);
      const otherWebsite = await context.websiteRepository.create(TestFixture.website({ hostname: "other.com" }));
      await seed([{ isVisitor: true }], otherWebsite.id);

      // when
      const stats = await query([Stats.Field.visitorsTotal, Stats.Field.pageviewsTotal]);

      // then
      expect(stats).toEqual({
        visitorsTotal: 1,
        pageviewsTotal: 1,
      });
    });
  });
});
