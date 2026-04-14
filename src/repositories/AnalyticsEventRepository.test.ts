import { $analyticsEvent, $botEvent } from "@/drizzle/schema";
import { TestEnvironment } from "@/testing/TestEnvironment.test";
import { TestFixture } from "@/testing/TestFixture.test";
import { beforeEach, describe, expect, it } from "bun:test";
import { randomUUID } from "crypto";
import { count } from "drizzle-orm";
import { AnalyticsEventRepository } from "./AnalyticsEventRepository";
import { WebsiteRepository } from "./WebsiteRepository";

describe(AnalyticsEventRepository.name, () => {
  let context: TestEnvironment.Context;
  let repository: AnalyticsEventRepository;
  let websiteRepository: WebsiteRepository;

  beforeEach(async () => {
    context = await TestEnvironment.initialize();
    repository = context.analyticsEventRepository;
    websiteRepository = new WebsiteRepository(context.sqlite);
  });

  it("should create and update analytics events", async () => {
    // given
    const website = await websiteRepository.create(TestFixture.website());
    const event = TestFixture.analyticsEvent({ websiteId: website.id, clientPageId: randomUUID() });

    // when
    await repository.create(event);
    // then
    const [{ eventCount }] = await context.sqlite.select({ eventCount: count() }).from($analyticsEvent);
    expect(eventCount).toEqual(1);

    // when
    await repository.create(event);
    // then
    const [{ eventCountAfterDuplicate }] = await context.sqlite.select({ eventCountAfterDuplicate: count() }).from($analyticsEvent);
    expect(eventCountAfterDuplicate).toEqual(1);

    // when
    await repository.update(event.clientPageId!, { durationSeconds: 42 });
    // then
    expect(await context.sqlite.query.$analyticsEvent.findFirst()).toEqual(
      expect.objectContaining({
        durationSeconds: 42,
        clientPageId: null,
      }),
    );
  });

  it("should store bot events and evict oldest beyond limit", async () => {
    // given
    const maxBotEvents = 10;
    const website = await websiteRepository.create(TestFixture.website());

    // when
    for (let i = 0; i < maxBotEvents + 5; i++) {
      const event = TestFixture.analyticsEvent({ websiteId: website.id });
      await repository.create(event, "bot");
    }
    // then
    const [{ botCount }] = await context.sqlite.select({ botCount: count() }).from($botEvent);
    expect(botCount).toEqual(maxBotEvents);
    const [{ eventCount }] = await context.sqlite.select({ eventCount: count() }).from($analyticsEvent);
    expect(eventCount).toEqual(0);
  });
});
