// import { expect, test } from "@playwright/test";
// import { readFile } from "fs/promises";
// import { join } from "path";
// import { AppBoundary } from "./boundaries/AppBoundary";
// import { DashboardSnapshotFlow } from "./flows/DashboardSnapshotFlow";

// const SPEC_DIR = join(process.cwd(), "e2e", "snapshots");

// test.beforeEach(async ({ request }) => {
//   await AppBoundary.purge(request);
// });

// for (const scenario of DashboardSnapshotFlow.SCENARIOS) {
//   test(`assert: ${scenario.name}`, async ({ page, request }) => {
//     await AppBoundary.seed(request, { rngSeed: scenario.rngSeed });
//     await page.goto("");
//     const raw = await readFile(join(SPEC_DIR, `${scenario.name}.json`), "utf8");
//     const expected = JSON.parse(raw) as { scenario: DashboardSnapshotFlow.Scenario; snapshot: DashboardSnapshotFlow.Snapshot };

//     await DashboardSnapshotFlow.applyScenario(page, scenario);
//     await expect.poll(() => DashboardSnapshotFlow.scrape(page), { timeout: 10_000 }).toEqual(expected.snapshot);
//   });
// }
