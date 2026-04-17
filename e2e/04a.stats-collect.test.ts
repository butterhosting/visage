import { Temporal } from "@js-temporal/polyfill";
import { test } from "@playwright/test";
import { mkdir, writeFile } from "fs/promises";
import { AppBoundary } from "./boundaries/AppBoundary";
import { StatsFlow } from "./flows/StatsFlow";
import { Scenario } from "./snapshots/Scenario";
import { Snapshot } from "./snapshots/Snapshot";

test.skip(true, "run manually to regenerate dashboard specs");

test.beforeAll(async () => {
  await mkdir(StatsFlow.snapshotDirectory(), { recursive: true });
});

test.beforeEach(async ({ page }) => {
  await AppBoundary.purge(page);
});

for (const scenario of generateScenarios(5398438)) {
  test(`collect: ${scenario.name}`, async ({ page, request }) => {
    await StatsFlow.applyScenario(page, scenario);
    const snapshot: Snapshot = {
      scenario,
      data: await StatsFlow.scrapeEverything(page),
    };
    await writeFile(StatsFlow.snapshotDirectory(`${scenario.name}.spec.json`), JSON.stringify(snapshot));
  });
}

function generateScenarios(rngSeed: number): Scenario[] {
  return [
    {
      name: "default",
      rngSeed,
      filters: [],
    },
    {
      name: "today",
      rngSeed,
      filters: [{ type: "period", period: "Today" }],
    },
    {
      name: "yesterday",
      rngSeed,
      filters: [{ type: "period", period: "Yesterday" }],
    },
    {
      name: "last-7-days",
      rngSeed,
      filters: [{ type: "period", period: "Last 7 days" }],
    },
    {
      name: "last-90-days",
      rngSeed,
      filters: [{ type: "period", period: "Last 90 days" }],
    },
    {
      name: "all-time",
      rngSeed,
      filters: [{ type: "period", period: "All time" }],
    },
    {
      name: "custom-range",
      rngSeed,
      filters: [
        {
          type: "period",
          period: { from: Temporal.Now.plainDateISO().subtract({ months: 17 }), to: Temporal.Now.plainDateISO().subtract({ months: 14 }) },
        },
      ],
    },
    {
      name: "filtered-by-page",
      rngSeed,
      filters: [{ type: "distribution", distributionTab: "PAGES", value: "/" }],
    },
    {
      name: "filtered-by-country",
      rngSeed,
      filters: [{ type: "distribution", distributionTab: "COUNTRIES", value: "United States" }],
    },
    {
      name: "filtered-by-browser",
      rngSeed,
      filters: [{ type: "distribution", distributionTab: "BROWSERS", value: "Chrome" }],
    },
    {
      name: "filtered-by-page-and-country",
      rngSeed,
      filters: [
        { type: "distribution", distributionTab: "PAGES", value: "/" },
        { type: "distribution", distributionTab: "COUNTRIES", value: "United States" },
      ],
    },
    {
      name: "filtered-by-source-and-os",
      rngSeed,
      filters: [
        { type: "distribution", distributionTab: "TRAFFIC SOURCES", value: "twitter" },
        { type: "distribution", distributionTab: "OPERATING SYSTEMS", value: "macOS" },
      ],
    },
  ];
}
