import { Browser, expect, Page } from "@playwright/test";

export namespace AnalyticsFlow {
  type TriggerViews = {
    websiteType: "traditional" | "SPA";
    sequence: Array<"home" | "about" | "contact">;
  };
  export async function triggerViews(browser: Browser, { websiteType, sequence }: TriggerViews) {
    const context = await browser.newContext();
    const page = await context.newPage();

    const baseURL = `http://localhost:${websiteType === "SPA" ? 4001 : 4002}`;
    for (let i = 0; i < sequence.length; i++) {
      const destination = sequence[i];
      if (i === 0) {
        await page.goto(`${baseURL}${destination === "home" ? "" : `/${destination}`}`);
      } else if (destination === sequence[i - 1]) {
        await page.reload();
      } else {
        await page.getByRole("link", { name: destination }).click();
      }
      await expect(page.getByRole("heading", { name: destination })).toBeVisible();
    }
  }

  type AggregateStats = {
    totalPageviews: string;
    totalVisitors: string;
    medianTimeOnPage: string;
    livePageviews: string;
  };
  export async function readAggregateStats(page: Page): Promise<AggregateStats> {
    const translation: Record<keyof AggregateStats, string> = {
      totalPageviews: "TOTAL PAGEVIEWS",
      totalVisitors: "TOTAL VISITORS",
      medianTimeOnPage: "MEDIAN TIME ON PAGE",
      livePageviews: "LIVE PAGEVIEWS",
    };
    const result: Record<string, string | null> = {};
    for (const [key, label] of Object.entries(translation)) {
      result[key] = await page.getByRole("button", { name: label }).getByTestId("aggregate-stat").textContent();
    }
    return result as AggregateStats;
  }
}
