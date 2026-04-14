import { expect, test } from "@playwright/test";
import { ResetBoundary } from "./boundaries/ResetBoundary";
import { WebsiteFlow } from "./flows/WebsiteFlow";

test.beforeEach(async ({ request, page }) => {
  await ResetBoundary.reset(request);
  await page.goto("");
});

test("websites can be managed", async ({ page }) => {
  // given
  const hostname = "www.blue.com";

  // when
  await WebsiteFlow.create(page, { hostname });
  // then
  await page.getByRole("link", { name: "Websites", exact: true }).click();
  await expect(page.getByRole("link", { name: hostname })).toBeVisible();

  // when
  const nextHostname = "wwww.red.com";
  await WebsiteFlow.update(page, { hostname, nextHostname });
  // then
  await page.getByRole("link", { name: "Websites", exact: true }).click();
  await expect(page.getByRole("link", { name: nextHostname })).toBeVisible();

  // when
  await WebsiteFlow.remove(page, { hostname: nextHostname });
  // then
  await page.getByRole("link", { name: "Websites", exact: true }).click();
  await expect(page.getByRole("button", { name: "add website", exact: true })).toBeVisible();
  await expect(page.getByText("last 30d")).not.toBeVisible();
});
