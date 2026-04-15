import { TestEnvironment } from "@/testing/TestEnvironment.test";
import { TestFixture } from "@/testing/TestFixture.test";
import { beforeEach, describe, expect, it } from "bun:test";
import { randomUUID } from "crypto";
import { IngestionService } from "./IngestionService";

describe(IngestionService.name, () => {
  let context: TestEnvironment.Context;
  let service: IngestionService;

  beforeEach(async () => {
    context = await TestEnvironment.initialize();
    service = new IngestionService(
      context.maxMindGeoServiceMock.cast(),
      context.botDetectionServiceMock.cast(),
      context.analyticsEventRepository,
      context.websiteRepository,
    );
    context.maxMindGeoServiceMock.lookup.mockResolvedValue({});
    context.botDetectionServiceMock.isBot.mockResolvedValue(false);
  });

  it("should ingest a start event and store it", async () => {
    // given
    const website = await context.websiteRepository.create(
      TestFixture.website({
        hostname: "example.com",
        hasData: false,
      }),
    );
    context.maxMindGeoServiceMock.lookup.mockResolvedValue({
      countryCode: "DE",
      cityName: "Berlin",
    });

    // when
    await service.ingest("1.2.3.4", TestFixture.btStartEvent("example.com"));

    // then
    expect(await context.sqlite.query.$botEvent.findMany()).toEqual([]);
    expect(await context.sqlite.query.$analyticsEvent.findMany()).toEqual([
      expect.objectContaining({
        websiteId: website.id,
        urlHostname: "example.com",
        urlPath: "/page",
        isVisitor: true,
        geoCountryCode: "DE",
        geoCityName: "Berlin",
      }),
    ]);
    expect(await context.websiteRepository.find(website.id)).toEqual(
      expect.objectContaining({
        hasData: true,
      }),
    );
  });

  it("should store a bot event when bot detection returns true", async () => {
    // given
    const website = await context.websiteRepository.create(
      TestFixture.website({
        hostname: "example.com",
        hasData: false,
      }),
    );
    context.botDetectionServiceMock.isBot.mockResolvedValue(true);

    // when
    await service.ingest("1.2.3.4", TestFixture.btStartEvent("example.com"));

    // then
    expect(await context.sqlite.query.$analyticsEvent.findMany()).toEqual([]);
    expect(await context.sqlite.query.$botEvent.findMany()).toBeArrayOfSize(1);
    expect(await context.websiteRepository.find(website.id)).toEqual(
      expect.objectContaining({
        hasData: false,
      }),
    );
  });

  it.each(["traditional", "SPA", "reload", "back_forward"])(
    "should not declare pageviews as `visitors` without a secondary event, or in case of reload/back/forward (%s website)",
    async (variant) => {
      // given
      await context.websiteRepository.create(TestFixture.website({ hostname: "example.com" }));

      // when
      switch (variant) {
        case "traditional": {
          await service.ingest("1.2.3.4", TestFixture.btStartEvent("example.com", { r: "https://example.com/other", sc: 0 }));
          break;
        }
        case "SPA": {
          await service.ingest("1.2.3.4", TestFixture.btStartEvent("example.com", { sc: 1, r: undefined }));
          break;
        }
        case "reload": {
          await service.ingest("1.2.3.4", TestFixture.btStartEvent("example.com", { r: "https://google.com", sc: 0, nt: "reload" }));
          break;
        }
        case "back_forward": {
          await service.ingest("1.2.3.4", TestFixture.btStartEvent("example.com", { r: "https://google.com", sc: 0, nt: "back_forward" }));
          break;
        }
      }

      // then
      expect(await context.sqlite.query.$analyticsEvent.findMany()).toEqual([
        expect.objectContaining({
          isVisitor: false,
        }),
      ]);
    },
  );

  it.each(["shorthand", "full"])("should extract %s UTM parameters from the URL", async (variant) => {
    // given
    await context.websiteRepository.create(TestFixture.website({ hostname: "example.com" }));

    // when
    const prefix = variant === "full" ? "utm_" : "";
    await service.ingest(
      "1.2.3.4",
      TestFixture.btStartEvent("example.com", {
        u: `https://example.com/landing?${prefix}source=google&${prefix}medium=cpc&${prefix}campaign=spring&${prefix}content=banner`,
      }),
    );

    // then
    expect(await context.sqlite.query.$analyticsEvent.findMany()).toEqual([
      expect.objectContaining({
        utmSource: "google",
        utmMedium: "cpc",
        utmCampaign: "spring",
        utmContent: "banner",
      }),
    ]);
  });

  it("should extract the UTM source via the `ref` parameter", async () => {
    // given
    await context.websiteRepository.create(TestFixture.website({ hostname: "example.com" }));

    // when
    await service.ingest("1.2.3.4", TestFixture.btStartEvent("example.com", { u: "https://example.com/?ref=newsletter" }));

    // then
    expect(await context.sqlite.query.$analyticsEvent.findMany()).toEqual([
      expect.objectContaining({
        utmSource: "newsletter",
      }),
    ]);
  });

  it("should parse locale into language and region", async () => {
    // given
    await context.websiteRepository.create(TestFixture.website({ hostname: "example.com" }));

    // when
    await service.ingest("1.2.3.4", TestFixture.btStartEvent("example.com", { l: "en-GB" }));

    // then
    expect(await context.sqlite.query.$analyticsEvent.findMany()).toEqual([
      expect.objectContaining({
        localeLanguage: "en",
        localeRegion: "GB",
      }),
    ]);
  });

  it("should successfully ingest an end event", async () => {
    // given
    await context.websiteRepository.create(TestFixture.website({ hostname: "example.com" }));
    const clientPageId = randomUUID();
    await service.ingest("1.2.3.4", TestFixture.btStartEvent("example.com", { cpi: clientPageId }));

    // when
    await service.ingest("1.2.3.4", TestFixture.btEndEvent(clientPageId, { dms: 17_000 }));

    // then
    expect(await context.sqlite.query.$analyticsEvent.findMany()).toEqual([
      expect.objectContaining({
        durationSeconds: 17,
        clientPageId: null,
      }),
    ]);
  });

  it("should silently swallow errors for unknown hostnames", async () => {
    // when
    await service.ingest("1.2.3.4", TestFixture.btStartEvent("unknown.com"));

    // then
    expect(await context.sqlite.query.$analyticsEvent.findMany()).toEqual([]);
  });
});
