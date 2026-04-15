import { expect, test } from "@playwright/test";
import { ResetBoundary } from "./boundaries/ResetBoundary";
import { WebsiteFlow } from "./flows/WebsiteFlow";
import { AnalyticsFlow } from "./flows/AnalyticsFlow";

test.beforeEach(async ({ request, page }) => {
  await ResetBoundary.reset(request);
  await page.goto("");
});

for (const websiteType of ["SPA", "traditional"] as const) {
  test(`analytics can be collected for a ${websiteType} website`, async ({ page, browser }) => {
    // given
    await WebsiteFlow.create(page, { hostname: "localhost" });
    // when
    await AnalyticsFlow.triggerViews(browser, {
      websiteType,
      sequence: ["home", "about", "contact"],
    });
    // then
    await expect(page.getByText("Please add the following script to your website.")).not.toBeVisible();
    await page.reload();
    await expect
      .poll(() => AnalyticsFlow.readAggregateStats(page))
      .toEqual({
        totalPageviews: "3",
        totalVisitors: "1",
        medianTimeOnPage: "0s",
        livePageviews: "3",
      });
  });
}
