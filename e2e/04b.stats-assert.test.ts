import { expect, test } from "@playwright/test";
import { readdir, readFile } from "fs/promises";
import { AppBoundary } from "./boundaries/AppBoundary";
import { StatsFlow } from "./flows/StatsFlow";
import { Snapshot } from "./snapshots/Snapshot";

test.beforeEach(async ({ page }) => {
  await AppBoundary.purge(page);
});

for (const filename of await readdir(StatsFlow.snapshotDirectory())) {
  const snapshot: Snapshot = await readFile(StatsFlow.snapshotDirectory(filename), "utf-8").then((str) => JSON.parse(str));
  test(filename, async ({ page }) => {
    // when
    await StatsFlow.applyScenario(page, snapshot.scenario);
    // then
    await expect.poll(() => StatsFlow.scrapeEverything(page), { timeout: 10_000 }).toEqual(snapshot.data);
  });
}
