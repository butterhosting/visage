import { AnalyticsEventConverter } from "@/drizzle/converters/AnalyticsEventConverter";
import { $analyticsEvent, $website } from "@/drizzle/schema";
import { Sqlite } from "@/drizzle/sqlite";
import { ZodParser } from "@/helpers/ZodParser";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { Website } from "@/models/Website";
import { Temporal } from "@js-temporal/polyfill";
import { eq, InferInsertModel } from "drizzle-orm";
import z from "zod/v4";
import { TokenService } from "./TokenService";
import { WebsiteService } from "./WebsiteService";

export class RestrictedService {
  public constructor(
    private readonly websiteService: WebsiteService,
    private readonly tokenService: TokenService,
    private readonly sqlite: Sqlite,
  ) {}

  public async purge(): Promise<void> {
    const tokens = await this.tokenService.list();
    await Promise.all(tokens.map(({ id }) => this.tokenService.delete(id)));
    const websites = await this.websiteService.list();
    await Promise.all(websites.map(({ id }) => this.websiteService.delete(id)));
  }

  public async seed(unknown: z.output<typeof RestrictedService.Seed>): Promise<void> {
    const { rngSeed = Math.round(Math.random() * 1_000_000) } = RestrictedService.Seed.parse(unknown);
    await this.purge();
    await this.websiteService.create({ hostname: "localhost" });
    await this.websiteService
      .create({ hostname: "www.example.com" })
      .then((website) => this.generateFakeAnalytics(website, rngSeed, Temporal.Now.plainDateISO()));
  }

  /**
   * Beware, the e2e tests rely on this implementation!
   *
   * It uses a fixed RNG seed, and asserts on the aggregate values...
   */
  private async generateFakeAnalytics(
    { id: websiteId, hostname }: Website,
    rngSeed: number,
    referenceDate: Temporal.PlainDate,
  ): Promise<void> {
    await this.sqlite.update($website).set({ hasData: true }).where(eq($website.id, websiteId));

    const INSERTION_BATCH_SIZE = 500;
    const rng = Internal.lcg(rngSeed);
    let eventCounter = 0;

    const referenceInstant = referenceDate.toZonedDateTime("UTC").toInstant();
    const from = referenceInstant.subtract({ hours: 18 * 30 * 24 }); // ~18 months before reference
    const to = referenceInstant.add({ hours: 24 }); // include the full reference day
    const totalDays = Math.floor(Temporal.Duration.from(from.until(to)).total("days"));

    let batch: InferInsertModel<typeof $analyticsEvent>[] = [];

    const flush = () => {
      if (batch.length === 0) return;
      this.sqlite.insert($analyticsEvent).values(batch).run();
      batch = [];
    };

    for (let day = 0; day < totalDays; day++) {
      const dayStart = from.add({ hours: day * 24 });
      const dayInstant = new Date(dayStart.epochMilliseconds);
      const dayOfWeek = dayInstant.getUTCDay(); // 0=Sun, 6=Sat
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // organic growth curve: starts low, accelerates
      const progress = day / totalDays;
      const growthBase = 5 + 120 * Math.pow(progress, 1.8);
      const weekendMultiplier = isWeekend ? 0.55 : 1.0;
      const noise = 0.7 + rng() * 0.6;
      const eventsToday = Math.round(growthBase * weekendMultiplier * noise);

      for (let i = 0; i < eventsToday; i++) {
        const hour = Internal.weightedPick(Internal.HOUR_WEIGHTS, rng);
        const minute = Math.floor(rng() * 60);
        const second = Math.floor(rng() * 60);
        const created = dayStart.add({ hours: hour, minutes: minute, seconds: second });

        const geo = Internal.weightedPick(Internal.GEOS, rng);
        const device = Internal.weightedPick(Internal.DEVICES, rng);
        const screen = Internal.weightedPick(Internal.SCREENS, rng);
        const page = Internal.weightedPick(Internal.PAGES, rng);
        const referrer = Internal.weightedPick(Internal.REFERRERS, rng);
        const utmSource = rng() < 0.15 ? Internal.weightedPick(Internal.UTM_SOURCES, rng) : undefined;

        const event: AnalyticsEvent = {
          id: `00000000-0000-0000-0000-${(++eventCounter).toString(16).padStart(12, "0")}`,
          object: "analytics_event",
          created,
          websiteId,
          durationSeconds: rng() < 0.6 ? Math.round(5 + rng() * 280) : undefined,
          url: { hostname, path: page },
          referrer,
          isVisitor: rng() < 0.65,
          userAgent: device.userAgent,
          utm: {
            source: utmSource,
            medium: utmSource ? Internal.weightedPick(Internal.UTM_MEDIUMS, rng) : undefined,
          },
          window: {
            screenWidth: screen[0],
            screenHeight: screen[1],
            viewportWidth: screen[0] - Math.floor(rng() * 40),
            viewportHeight: screen[1] - Math.floor(80 + rng() * 80),
          },
          device: { browser: device.browser, os: device.os },
          locale: { language: geo.language, region: geo.region },
          geo: { countryCode: geo.country, cityName: geo.city },
        };

        batch.push(AnalyticsEventConverter.convert(event));
        if (batch.length >= INSERTION_BATCH_SIZE) flush();
      }
    }
    flush();
  }
}

export namespace RestrictedService {
  export const Seed = z.object({
    rngSeed: z.number().int().optional(),
    referenceDate: z.string().transform(ZodParser.date).optional(),
  });
}

namespace Internal {
  // --- seeded PRNG + random helpers & data tables ---

  // Linear congruential generator: next = (state * a + c) mod 2^32.
  // Constants from Numerical Recipes. Good enough for fake data; do not use for anything security-sensitive.
  export function lcg(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 0x100000000;
    };
  }

  export function weightedPick<T>(items: Array<[T, number]>, rng: () => number): T {
    const total = items.reduce((sum, [, w]) => sum + w, 0);
    let r = rng() * total;
    for (const [item, weight] of items) {
      r -= weight;
      if (r <= 0) return item;
    }
    return items[items.length - 1][0];
  }

  // hour → relative weight (UTC, peaks ~10-11 and 14-15)
  export const HOUR_WEIGHTS: Array<[number, number]> = [
    [0, 2],
    [1, 1],
    [2, 1],
    [3, 1],
    [4, 1],
    [5, 2],
    [6, 4],
    [7, 7],
    [8, 10],
    [9, 13],
    [10, 15],
    [11, 14],
    [12, 11],
    [13, 13],
    [14, 15],
    [15, 14],
    [16, 12],
    [17, 10],
    [18, 8],
    [19, 6],
    [20, 5],
    [21, 4],
    [22, 3],
    [23, 2],
  ];

  type Geo = { country: string; city: string | undefined; language: string; region: string | undefined };
  export const GEOS: Array<[Geo, number]> = [
    [{ country: "US", city: "New York", language: "en", region: "US" }, 10],
    [{ country: "US", city: "San Francisco", language: "en", region: "US" }, 6],
    [{ country: "US", city: "Chicago", language: "en", region: "US" }, 3],
    [{ country: "US", city: "Austin", language: "en", region: "US" }, 2],
    [{ country: "GB", city: "London", language: "en", region: "GB" }, 5],
    [{ country: "GB", city: "Manchester", language: "en", region: "GB" }, 2],
    [{ country: "DE", city: "Berlin", language: "de", region: "DE" }, 5],
    [{ country: "DE", city: "Munich", language: "de", region: "DE" }, 2],
    [{ country: "FR", city: "Paris", language: "fr", region: "FR" }, 4],
    [{ country: "NL", city: "Amsterdam", language: "nl", region: "NL" }, 4],
    [{ country: "NL", city: "Rotterdam", language: "nl", region: "NL" }, 2],
    [{ country: "IN", city: "Mumbai", language: "hi", region: "IN" }, 5],
    [{ country: "IN", city: "Bangalore", language: "en", region: "IN" }, 4],
    [{ country: "IN", city: "New Delhi", language: "hi", region: "IN" }, 3],
    [{ country: "BR", city: "São Paulo", language: "pt", region: "BR" }, 3],
    [{ country: "CA", city: "Toronto", language: "en", region: "CA" }, 3],
    [{ country: "AU", city: "Sydney", language: "en", region: "AU" }, 2],
    [{ country: "JP", city: "Tokyo", language: "ja", region: "JP" }, 2],
    [{ country: "PL", city: "Warsaw", language: "pl", region: "PL" }, 2],
    [{ country: "SE", city: "Stockholm", language: "sv", region: "SE" }, 1],
    [{ country: "RU", city: undefined, language: "ru", region: "RU" }, 3],
    [{ country: "US", city: undefined, language: "en", region: "US" }, 4],
  ];

  type Device = { browser: string; os: string; userAgent: string };
  export const DEVICES: Array<[Device, number]> = [
    [
      {
        browser: "Chrome",
        os: "Windows",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      30,
    ],
    [
      {
        browser: "Chrome",
        os: "macOS",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      15,
    ],
    [
      {
        browser: "Safari",
        os: "macOS",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
      },
      12,
    ],
    [
      {
        browser: "Safari",
        os: "iOS",
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
      },
      15,
    ],
    [
      {
        browser: "Chrome",
        os: "Android",
        userAgent: "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
      },
      10,
    ],
    [
      {
        browser: "Firefox",
        os: "Windows",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
      },
      8,
    ],
    [
      {
        browser: "Firefox",
        os: "Linux",
        userAgent: "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
      },
      4,
    ],
    [
      {
        browser: "Edge",
        os: "Windows",
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
      },
      6,
    ],
  ];

  // [width, height]
  export const SCREENS: Array<[[number, number], number]> = [
    [[1920, 1080], 30],
    [[2560, 1440], 10],
    [[1440, 900], 8],
    [[1366, 768], 12],
    [[3840, 2160], 3],
    [[390, 844], 15], // iPhone 14
    [[412, 915], 10], // Pixel 7
    [[360, 800], 8], // Android common
    [[768, 1024], 4], // iPad
  ];

  export const PAGES: Array<[string, number]> = [
    ["/", 35],
    ["/docs", 15],
    ["/docs/getting-started", 10],
    ["/docs/api-reference", 8],
    ["/pricing", 12],
    ["/blog", 8],
    ["/blog/announcing-v2", 5],
    ["/blog/performance-update", 3],
    ["/about", 4],
  ];

  type Referrer = { hostname: string; path: string } | undefined;
  export const REFERRERS: Array<[Referrer, number]> = [
    [undefined, 40],
    [{ hostname: "google.com", path: "/" }, 20],
    [{ hostname: "t.co", path: "/" }, 8],
    [{ hostname: "github.com", path: "/" }, 7],
    [{ hostname: "news.ycombinator.com", path: "/" }, 6],
    [{ hostname: "reddit.com", path: "/" }, 5],
    [{ hostname: "linkedin.com", path: "/" }, 4],
    [{ hostname: "dev.to", path: "/" }, 3],
    [{ hostname: "duckduckgo.com", path: "/" }, 3],
    [{ hostname: "bing.com", path: "/" }, 2],
    [{ hostname: "baidu.com", path: "/" }, 2],
  ];

  export const UTM_SOURCES: Array<[string, number]> = [
    ["twitter", 25],
    ["newsletter", 20],
    ["github", 15],
    ["producthunt", 10],
    ["google", 10],
    ["linkedin", 10],
    ["hackernews", 10],
  ];

  export const UTM_MEDIUMS: Array<[string, number]> = [
    ["social", 35],
    ["email", 25],
    ["cpc", 15],
    ["referral", 25],
  ];
}
