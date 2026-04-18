import { OmitBetter } from "@/types/OmitBetter";
import { Temporal } from "@js-temporal/polyfill";
import { expect, Locator, Page } from "@playwright/test";
import { join } from "path";
import { AppBoundary } from "../boundaries/AppBoundary";
import { Scenario } from "../snapshots/Scenario";
import { Snapshot } from "../snapshots/Snapshot";

export namespace StatsFlow {
  export const snapshotDirectory = (...files: string[]) => join(process.cwd(), "e2e", "snapshots", "specs", ...files);

  export async function applyScenario(page: Page, scenario: OmitBetter<Scenario, "name">): Promise<void> {
    // given
    await AppBoundary.seed(page, { rngSeed: scenario.rngSeed });
    // when
    await page.goto("");
    await wrapInStatsQueryExpectation(page, () => page.getByRole("link", { name: "www.example.com" }).click());
    // then
    for (const filter of scenario.filters) {
      if (filter.type === "period") {
        if (typeof filter.period === "string") {
          await wrapInStatsQueryExpectation(page, () => page.getByRole("combobox").selectOption(filter.period as string));
        } else {
          const today = Temporal.Now.plainDateISO();
          const from = today.subtract(filter.period.fromAgo);
          const to = today.subtract(filter.period.toAgo);
          await page.getByRole("combobox").selectOption("Custom");
          await page.getByLabel("FROM").fill(from.toString());
          await page.getByLabel("TO").fill(to.toString());
          await wrapInStatsQueryExpectation(page, () => page.getByRole("button", { name: "Apply" }).click());
        }
      } else {
        const distributionTab = new DistributionTabHelper(page, filter.distributionTab);
        await distributionTab.applyFilter(filter.value);
      }
    }
  }

  export async function scrapeAggregateStats(page: Page): Promise<Snapshot.AggregateStats>;
  export async function scrapeAggregateStats(page: Page, exact: "exact"): Promise<AggregateStatsExact>;
  export async function scrapeAggregateStats(page: Page, exact?: "exact"): Promise<Snapshot.AggregateStats | AggregateStatsExact> {
    if (exact) {
      return await wrapInStatsQueryExpectation(page, () => page.reload());
    }
    return (await scrape(page, "aggregate_stats")) as Snapshot.AggregateStats;
  }

  export async function scrapeEverything(page: Page): Promise<Snapshot.Data> {
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
    for (const tabLabel of Snapshot.distributionTabLabels()) {
      const distributionTab = new DistributionTabHelper(page, tabLabel);
      const values = await distributionTab.readValues();
      distributions[tabLabel] = values.map(({ percentage, value, pvs }) => [percentage, value, pvs]);
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

  /**
   * Helper function for when we expect a /stats query
   */
  type AggregateStatsExact = {
    visitorsTotal: number;
    pageviewsTotal: number;
    pagetimeMedian: number;
    livePageviewsTotal: number;
  };
  async function wrapInStatsQueryExpectation(page: Page, fn: () => unknown): Promise<AggregateStatsExact> {
    const responsePromise = page.waitForResponse(/internal-api\/stats/);
    await fn();
    const response = await responsePromise;
    return await response.json();
  }

  /**
   * Helper class
   */
  class DistributionTabHelper {
    private readonly correspondingPanel: Locator;

    public constructor(
      private readonly page: Page,
      private readonly tabLabel: string,
    ) {
      this.correspondingPanel = page.getByTestId("distribution-panel").filter({
        hasText: tabLabel,
      });
    }

    public async applyFilter(value: string) {
      await this.prepare();
      await this.resetPagination();
      const clickableValues = this.correspondingPanel.getByTestId("distribution-value");
      outer: while (true) {
        for (let i = 0; i < (await clickableValues.count()); i++) {
          const clickableValue = clickableValues.nth(i);
          if ((await clickableValue.textContent()) === value) {
            await wrapInStatsQueryExpectation(this.page, () => clickableValue.click());
            break outer;
          }
        }
        const paginationNext = this.correspondingPanel.getByTestId("pagination-next");
        if ((await paginationNext.isVisible()) && (await paginationNext.isEnabled())) {
          await wrapInStatsQueryExpectation(this.page, () => paginationNext.click());
          continue;
        }
        throw new Error(`Couldn't apply filter ${this.tabLabel}: ${value}`);
      }
    }

    public async readValues(): Promise<Array<{ percentage: string; value: string; pvs: string }>> {
      await this.prepare();
      await this.resetPagination();
      const values: Awaited<ReturnType<typeof this.readValues>> = [];
      while (true) {
        const rows = this.correspondingPanel.getByTestId("distribution-row");
        for (let i = 0; i < (await rows.count()); i++) {
          const row = rows.nth(i);
          await expect(row).toBeVisible();
          values.push({
            percentage: (await row.getByTestId("distribution-percentage").textContent()) as string,
            value: (await row.getByTestId("distribution-value").textContent()) as string,
            pvs: (await row.getByTestId("distribution-pvs").textContent()) as string,
          });
        }
        const paginationNext = this.correspondingPanel.getByTestId("pagination-next");
        if ((await paginationNext.isVisible()) && (await paginationNext.isEnabled())) {
          await wrapInStatsQueryExpectation(this.page, () => paginationNext.click());
          continue;
        }
        break;
      }
      return values;
    }

    private async prepare() {
      await expect(this.correspondingPanel).toBeVisible();
      const tabButton = this.correspondingPanel.getByRole("button", { name: this.tabLabel, exact: true });
      if ((await tabButton.isVisible()) && (await tabButton.isEnabled())) {
        await tabButton.click(); // no network request
      }
    }

    private async resetPagination() {
      const paginationPrev = this.correspondingPanel.getByTestId("pagination-prev");
      while ((await paginationPrev.isVisible()) && (await paginationPrev.isEnabled())) {
        await wrapInStatsQueryExpectation(this.page, () => paginationPrev.click());
      }
    }
  }
}
