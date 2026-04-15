import { expect, test } from "@playwright/test";
import { ResetBoundary } from "./boundaries/ResetBoundary";
import { WebsiteFlow } from "./flows/WebsiteFlow";
import { AnalyticsFlow } from "./flows/AnalyticsFlow";

test.beforeEach(async ({ request, page }) => {
  await ResetBoundary.reset(request);
  await page.goto("");
});

for (const websiteType of ["SPA", "traditional"] as const) {
  test.describe(`${websiteType} website`, () => {
    test(`analytics can be collected`, async ({ page, browser }) => {
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
          totalVisitors: "1",
          totalPageviews: "3",
          medianTimeOnPage: "0s",
          livePageviews: "3",
        });
    });

    test("the dashboard can be filtered by page", async ({ page, browser }) => {
      // given
      await WebsiteFlow.create(page, { hostname: "localhost" });

      // when
      await AnalyticsFlow.triggerViews(browser, {
        websiteType,
        sequence: ["home", "about", "about", "contact", "home", "about", "about", "contact", "about"],
      });
      // then
      await page.reload();
      await expect
        .poll(() => AnalyticsFlow.readAggregateStats(page))
        .toEqual({
          totalVisitors: "1",
          totalPageviews: "9",
          medianTimeOnPage: "0s",
          livePageviews: "9",
        });

      // when
      await page.getByRole("button", { name: /^\/about/ }).click();
      // then
      await expect
        .poll(() => AnalyticsFlow.readAggregateStats(page))
        .toEqual({
          totalPageviews: "5",
          totalVisitors: "1",
          medianTimeOnPage: "0s",
          livePageviews: "9",
        });
    });
  });
}
