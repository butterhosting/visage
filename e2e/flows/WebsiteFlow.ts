import { expect, Page } from "@playwright/test";
import { readFile } from "fs/promises";

export namespace WebsiteFlow {
  type Create = {
    hostname: string;
  };
  export async function create(page: Page, { hostname }: Create): Promise<{ hostname: string }> {
    const dialog = page.getByRole("dialog");

    await page.getByRole("link", { name: "Websites", exact: true }).click();
    await page.getByRole("button", { name: "add website", exact: true }).click();

    await expect(dialog).toBeVisible();
    await dialog.getByRole("textbox").fill(hostname);
    await dialog.getByRole("button", { name: "Add", exact: true }).click();

    await expect(dialog).not.toBeVisible();
    await expect(page.getByText("Please add the following script to your website.")).toBeVisible();
    return { hostname };
  }

  type Update = {
    hostname: string;
    nextHostname: string;
  };
  export async function update(page: Page, { hostname, nextHostname }: Update): Promise<void> {
    const dialog = page.getByRole("dialog");

    await page.getByRole("link", { name: "Settings", exact: true }).click();

    const row = page.getByTestId("website-row").filter({ hasText: hostname });
    await row.getByRole("button", { name: "Update", exact: true }).click();
    await expect(dialog).toBeVisible();

    await dialog.getByRole("textbox").fill(nextHostname);
    await dialog.getByRole("button", { name: "Update", exact: true }).click();
    await expect(dialog).not.toBeVisible();
  }

  type Export = {
    hostname: string;
  };
  export async function doExport(page: Page, { hostname }: Export): Promise<string> {
    const dialog = page.getByRole("dialog");

    await page.getByRole("link", { name: "Settings", exact: true }).click();

    const row = page.getByTestId("website-row").filter({ hasText: hostname });
    await row.getByRole("button", { name: "Export", exact: true }).click();
    await expect(dialog).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Download", exact: true }).click();
    const download = await downloadPromise;
    await expect(dialog).not.toBeVisible();

    return await readFile(await download.path(), "utf-8");
  }

  type Remove = {
    hostname: string;
  };
  export async function remove(page: Page, { hostname }: Remove): Promise<void> {
    const dialog = page.getByRole("dialog");

    await page.getByRole("link", { name: "Settings", exact: true }).click();

    const row = page.getByTestId("website-row").filter({ hasText: hostname });
    await row.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(dialog).toBeVisible();

    await dialog.getByRole("textbox").fill(hostname);
    await dialog.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(dialog).not.toBeVisible();
  }
}
