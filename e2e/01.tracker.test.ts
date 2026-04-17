import { expect, test } from "@playwright/test";
import { AppBoundary } from "./boundaries/AppBoundary";

test.beforeEach(async ({ page }) => {
  await AppBoundary.purge(page);
  await page.goto("");
});

test("ensure the tracker script stays small", async ({ request }) => {
  // given
  const maxSizeKb = 1.5;
  // when
  const response = await request.get("/vis.js");
  expect(response.ok()).toBe(true);
  // then
  const minifiedScript = await response.body();
  expect(minifiedScript.byteLength).toBeGreaterThan(0);
  expect(minifiedScript.byteLength).toBeLessThan(maxSizeKb * 1024);
});
