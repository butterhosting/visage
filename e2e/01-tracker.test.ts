import { expect, test } from "@playwright/test";
import { ResetBoundary } from "./boundaries/ResetBoundary";

test.beforeEach(async ({ request, page }) => {
  await ResetBoundary.reset(request);
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
