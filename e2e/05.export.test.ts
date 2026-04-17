import { expect, test } from "@playwright/test";
import { AppBoundary } from "./boundaries/AppBoundary";
import { StatsFlow } from "./flows/StatsFlow";
import { WebsiteFlow } from "./flows/WebsiteFlow";

test.beforeEach(async ({ page }) => {
  await AppBoundary.purge(page);
});

test(`data can be exported`, async ({ page }) => {
  // given
  await StatsFlow.applyScenario(page, {
    rngSeed: 92311484,
    filters: [
      {
        type: "period",
        period: "All time",
      },
    ],
  });
  const { pageviewsTotal } = await StatsFlow.scrapeAggregateStats(page, "exact");
  // when
  const { data } = JSON.parse(await WebsiteFlow.doExport(page, { hostname: "www.example.com" }));
  // then
  expect(data.length).toBeGreaterThan(0);
  expect(data.length).toEqual(pageviewsTotal);
});
