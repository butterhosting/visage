import { $analyticsEvent, $website } from "@/drizzle/schema";
import { Sqlite } from "@/drizzle/sqlite";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { Website } from "@/models/Website";
import { AnalyticsEventConverter } from "@/repositories/converters/AnalyticsEventConverter";
import { Temporal } from "@js-temporal/polyfill";
import { eq, InferInsertModel } from "drizzle-orm";
import { WebsiteService } from "./WebsiteService";

export class RestrictedService {
  public constructor(
    private readonly websiteService: WebsiteService,
    private readonly sqlite: Sqlite,
  ) {}

  public async purge(): Promise<void> {
    const websites = await this.websiteService.query();
    await Promise.all(websites.map(({ id }) => this.websiteService.delete(id)));
  }

  public async seed(): Promise<void> {
    await this.purge();
    await this.websiteService.create({ hostname: "localhost" });
    await this.websiteService.create({ hostname: "www.example.com" }).then((website) => this.generateFakeAnalytics(website));
  }

  private async generateFakeAnalytics({ id: websiteId, hostname }: Website): Promise<void> {
    await this.sqlite.update($website).set({ hasData: true }).where(eq($website.id, websiteId));

    const INSERTION_BATCH_SIZE = 500;

    const now = Temporal.Now.instant();
    const from = now.subtract({ hours: 18 * 30 * 24 }); // ~18 months ago
    const to = now.add({ hours: 30 * 24 }); // ~1 month from now
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
      const noise = 0.7 + Math.random() * 0.6;
      const eventsToday = Math.round(growthBase * weekendMultiplier * noise);

      for (let i = 0; i < eventsToday; i++) {
        const hour = weightedPick(HOUR_WEIGHTS);
        const minute = Math.floor(Math.random() * 60);
        const second = Math.floor(Math.random() * 60);
        const created = dayStart.add({ hours: hour, minutes: minute, seconds: second });

        const geo = weightedPick(GEOS);
        const device = weightedPick(DEVICES);
        const screen = weightedPick(SCREENS);
        const page = weightedPick(PAGES);
        const referrer = weightedPick(REFERRERS);
        const utmSource = Math.random() < 0.15 ? weightedPick(UTM_SOURCES) : undefined;

        const event: AnalyticsEvent = {
          id: Bun.randomUUIDv7(),
          object: "analytics_event",
          created,
          websiteId,
          durationSeconds: Math.random() < 0.6 ? Math.round(5 + Math.random() * 280) : undefined,
          url: { hostname, path: page },
          referrer,
          isVisitor: Math.random() < 0.65,
          userAgent: device.userAgent,
          utm: {
            source: utmSource,
            medium: utmSource ? weightedPick(UTM_MEDIUMS) : undefined,
          },
          window: {
            screenWidth: screen[0],
            screenHeight: screen[1],
            viewportWidth: screen[0] - Math.floor(Math.random() * 40),
            viewportHeight: screen[1] - Math.floor(80 + Math.random() * 80),
          },
          device: { browserName: device.browser, browserVersion: device.browserVersion, osName: device.os, osVersion: device.osVersion },
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

// --- weighted random helpers & data tables ---

function weightedPick<T>(items: Array<[T, number]>): T {
  const total = items.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [item, weight] of items) {
    r -= weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1][0];
}

// hour → relative weight (UTC, peaks ~10-11 and 14-15)
const HOUR_WEIGHTS: Array<[number, number]> = [
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
const GEOS: Array<[Geo, number]> = [
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

type Device = { browser: string; browserVersion: string; os: string; osVersion: string; userAgent: string };
const DEVICES: Array<[Device, number]> = [
  [
    {
      browser: "Chrome",
      browserVersion: "124.0",
      os: "Windows",
      osVersion: "10",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
    30,
  ],
  [
    {
      browser: "Chrome",
      browserVersion: "124.0",
      os: "macOS",
      osVersion: "14.4",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
    15,
  ],
  [
    {
      browser: "Safari",
      browserVersion: "17.4",
      os: "macOS",
      osVersion: "14.4",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    },
    12,
  ],
  [
    {
      browser: "Safari",
      browserVersion: "17.4",
      os: "iOS",
      osVersion: "17.4",
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    },
    15,
  ],
  [
    {
      browser: "Chrome",
      browserVersion: "124.0",
      os: "Android",
      osVersion: "14",
      userAgent: "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
    },
    10,
  ],
  [
    {
      browser: "Firefox",
      browserVersion: "125.0",
      os: "Windows",
      osVersion: "10",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    },
    8,
  ],
  [
    {
      browser: "Firefox",
      browserVersion: "125.0",
      os: "Linux",
      osVersion: "6.5",
      userAgent: "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
    },
    4,
  ],
  [
    {
      browser: "Edge",
      browserVersion: "124.0",
      os: "Windows",
      osVersion: "11",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
    },
    6,
  ],
];

// [width, height]
const SCREENS: Array<[[number, number], number]> = [
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

const PAGES: Array<[string, number]> = [
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
const REFERRERS: Array<[Referrer, number]> = [
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

const UTM_SOURCES: Array<[string, number]> = [
  ["twitter", 25],
  ["newsletter", 20],
  ["github", 15],
  ["producthunt", 10],
  ["google", 10],
  ["linkedin", 10],
  ["hackernews", 10],
];

const UTM_MEDIUMS: Array<[string, number]> = [
  ["social", 35],
  ["email", 25],
  ["cpc", 15],
  ["referral", 25],
];
