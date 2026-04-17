import { APIRequestContext, Page } from "@playwright/test";
import { join } from "path";
import { AppBoundary } from "../boundaries/AppBoundary";
import { Scenario } from "../snapshots/Scenario";
import { Snapshot } from "../snapshots/Snapshot";

export namespace StatsFlow {
  export const snapshotDirectory = (...files: string[]) => join(process.cwd(), "e2e", "snapshots", "specs", ...files);

  async function untilStatsHttpRequestIsFinished(page: Page): Promise<void> {
    await page.waitForResponse((res) => /\/stats(\?|$)/.test(res.url()) && res.ok());
  }

  export async function applyScenario(page: Page, request: APIRequestContext, scenario: Scenario): Promise<void> {
    // given
    await AppBoundary.seed(request, { rngSeed: scenario.rngSeed });
    // when
    await page.goto("");
    await page.getByRole("link", { name: "www.example.com" }).click();
    await untilStatsHttpRequestIsFinished(page);
    // then
    for (const filter of scenario.filters) {
      if (filter.type === "period") {
        if (typeof filter.period === "string") {
          await page.getByRole("combobox").selectOption(filter.period);
          await untilStatsHttpRequestIsFinished(page);
        } else {
          await page.getByRole("combobox").selectOption("Custom");
          await page.getByLabel("FROM").fill(filter.period.from.toString());
          await page.getByLabel("TO").fill(filter.period.to.toString());
          await page.getByRole("button", { name: "Apply" }).click();
          await untilStatsHttpRequestIsFinished(page);
        }
      } else {
        const panel = page.locator(`[data-testid="distribution-panel"][data-active-label="${filter.label}"]`);
        await panel.locator(`[data-testid="distribution-row"][data-value="${filter.value}"]`).click();
        await untilStatsHttpRequestIsFinished(page);
      }
    }
  }

  export async function scrapeAggregateStats(page: Page): Promise<Snapshot.AggregateStats> {
    return (await scrape(page, "aggregate_stats")) as Snapshot.AggregateStats;
  }

  export async function scrapeEverything(page: Page): Promise<Snapshot.Data> {
    await untilStatsHttpRequestIsFinished(page);
    return (await scrape(page, "everything")) as Snapshot.Data;
  }

  async function scrape(page: Page, scope: "aggregate_stats" | "everything"): Promise<Snapshot.Data | Snapshot.AggregateStats> {
    const aggregateTranslations: Record<keyof Snapshot.AggregateStats, string> = {
      totalVisitors: "TOTAL VISITORS",
      totalPageviews: "TOTAL PAGEVIEWS",
      medianTimeOnPage: "MEDIAN TIME ON PAGE",
      livePageviews: "LIVE PAGEVIEWS",
    };
    const aggregates = {} as Snapshot.AggregateStats;
    for (const [key, label] of Object.entries(aggregateTranslations)) {
      aggregates[key as keyof Snapshot.AggregateStats] = (await page
        .getByRole("button", { name: label })
        .getByTestId("aggregate-stat")
        .textContent()) as string;
    }
    if (scope === "aggregate_stats") {
      return aggregates;
    }

    const distributions = {} as Snapshot.Data["distributions"];
    for (const tabLabel of Snapshot.listDistributionTabs()) {
      const correspondingPanel = page.getByTestId("distribution-panel").filter({
        hasText: tabLabel,
      });
      // Some tabs need to be clicked, before becoming visible
      const tab = correspondingPanel.getByRole("button", { name: tabLabel, exact: true });
      if (await tab.isVisible()) {
        await tab.click();
      }
      // Read the distribution values
      distributions[tabLabel] = [];
      while (true) {
        const rows = correspondingPanel.getByTestId("distribution-row");
        for (let i = 0; i < (await rows.count()); i++) {
          const row = rows.nth(i);
          distributions[tabLabel].push([
            (await row.getByTestId("distribution-percentage").textContent()) as string,
            (await row.getByTestId("distribution-value").textContent()) as string,
            (await row.getByTestId("distribution-pvs").textContent()) as string,
          ]);
        }
        const paginationNext = correspondingPanel.getByTestId("pagination-next");
        if ((await paginationNext.isVisible()) && (await paginationNext.isEnabled())) {
          await paginationNext.click();
          await untilStatsHttpRequestIsFinished(page);
          continue;
        }
        break;
      }
    }
    return {
      aggregates: {
        totalVisitors: aggregates.totalVisitors,
        totalPageviews: aggregates.totalPageviews,
        medianTimeOnPage: aggregates.medianTimeOnPage,
      },
      distributions,
    };
  }
}
