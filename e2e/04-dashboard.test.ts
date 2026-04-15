import { expect, test } from "@playwright/test";
import { AppBoundary } from "./boundaries/AppBoundary";
import { AnalyticsFlow } from "./flows/AnalyticsFlow";
import { Temporal } from "@js-temporal/polyfill";

test.beforeEach(async ({ request, page }) => {
  await AppBoundary.purge(request);
  await page.goto("");
});

test("different periods can be selected", async ({ page, request }) => {
  // given
  await AppBoundary.seed(request);
  await page.reload();

  // when
  await page.getByRole("link", { name: "www.example.com" }).click();
  // then
  await expect
    .poll(() => AnalyticsFlow.readAggregateStats(page))
    .toEqual(
      expect.objectContaining({
        totalVisitors: "2.1k",
        totalPageviews: "3.2k",
        medianTimeOnPage: "2m 25s",
      }),
    );

  // when
  const fixedPeriodTests: Array<{ option: string; expectation: Partial<AnalyticsFlow.AggregateStats> }> = [
    {
      option: "Today",
      expectation: {
        totalVisitors: "108",
        totalPageviews: "161",
        medianTimeOnPage: "2m 20s",
      },
    },
    {
      option: "Yesterday",
      expectation: {
        totalVisitors: "92",
        totalPageviews: "157",
        medianTimeOnPage: "2m 47s",
      },
    },
    {
      option: "Last 7 days",
      expectation: {
        totalVisitors: "601",
        totalPageviews: "923",
        medianTimeOnPage: "2m 29s",
      },
    },
    {
      option: "Last 90 days",
      expectation: {
        totalVisitors: "5.4k",
        totalPageviews: "8.5k",
        medianTimeOnPage: "2m 23s",
      },
    },
    {
      option: "All time",
      expectation: {
        totalVisitors: "14.5k",
        totalPageviews: "22.5k",
        medianTimeOnPage: "2m 25s",
      },
    },
  ];
  for (const { option, expectation } of fixedPeriodTests) {
    await page.getByRole("combobox").selectOption(option);
    // then
    await expect.poll(() => AnalyticsFlow.readAggregateStats(page)).toEqual(expect.objectContaining(expectation));
  }

  // when
  await page.getByRole("combobox").selectOption("Custom");
  await page.getByLabel("FROM").fill(
    Temporal.Now.plainDateISO() // seeding is determinstic relative to `<today>`
      .subtract(Temporal.Duration.from({ years: 1, months: 5 }))
      .toString(),
  );
  await page.getByLabel("TO").fill(
    Temporal.Now.plainDateISO() // seeding is determinstic relative to `<today>`
      .subtract(Temporal.Duration.from({ years: 1, months: 2 }))
      .toString(),
  );
  await page.getByRole("button", { name: "Apply" }).click();
  // then
  await expect
    .poll(() => AnalyticsFlow.readAggregateStats(page))
    .toEqual(
      expect.objectContaining({
        totalVisitors: "442",
        totalPageviews: "679",
        medianTimeOnPage: "2m 21s",
      }),
    );
});
