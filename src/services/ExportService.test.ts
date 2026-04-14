import { Artifact } from "@/models/Artifact";
import { TestEnvironment } from "@/testing/TestEnvironment.test";
import { TestFixture } from "@/testing/TestFixture.test";
import { beforeEach, describe, expect, it } from "bun:test";
import { ExportService } from "./ExportService";

describe(ExportService.name, () => {
  let context: TestEnvironment.Context;
  let service: ExportService;

  beforeEach(async () => {
    context = await TestEnvironment.initialize();
    service = new ExportService(context.sqlite, context.websiteRepository);
  });

  it.each(Object.values(Artifact.Enum))("successfully exports %s.json", async (artifact) => {
    // given
    const website = await context.websiteRepository.create(TestFixture.website());
    const analyticsEvents = TestFixture.analyticsEventList(30, { websiteId: website.id });
    await Promise.all(analyticsEvents.map((event) => context.analyticsEventRepository.create(event)));

    // when
    const { stream } = await service.export(website.id, { artifact });
    const json = await new Response(stream).json();

    // then
    if (artifact === Artifact.Enum.analytics) {
      expect(json.data).toBeArrayOfSize(30);
    } else if (artifact === Artifact.Enum.bots) {
      expect(json.data).toBeArrayOfSize(0);
    } else {
      artifact satisfies never;
    }
  });
});
