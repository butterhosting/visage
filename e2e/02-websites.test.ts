import { expect, test } from "@playwright/test";
import { AppBoundary } from "./boundaries/AppBoundary";
import { WebsiteFlow } from "./flows/WebsiteFlow";

test.beforeEach(async ({ request, page }) => {
  await AppBoundary.purge(request);
  await page.goto("");
});

test("websites can be managed", async ({ page }) => {
  // given
  const hostnameBlue = "www.blue.com";

  // when
  await WebsiteFlow.create(page, { hostname: hostnameBlue });
  // then
  await page.getByRole("link", { name: "Websites", exact: true }).click();
  await expect(page.getByRole("link", { name: hostnameBlue })).toBeVisible();

  // when
  const hostnameYellow = "www.yellow.com";
  await WebsiteFlow.update(page, { hostname: hostnameBlue, nextHostname: hostnameYellow });
  // then
  await page.getByRole("link", { name: "Websites", exact: true }).click();
  await expect(page.getByRole("link", { name: hostnameYellow })).toBeVisible();

  // when
  await WebsiteFlow.remove(page, { hostname: hostnameYellow });
  // then
  await page.getByRole("link", { name: "Websites", exact: true }).click();
  await expect(page.getByRole("button", { name: "add website", exact: true })).toBeVisible();
  await expect(page.getByText("last 30d")).not.toBeVisible();
});
