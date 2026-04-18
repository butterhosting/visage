import { expect, Page } from "@playwright/test";

export namespace TokenFlow {
  type Generate = {
    hostnames?: "*" | string[];
  };
  export async function generate(page: Page, { hostnames = "*" }: Generate = {}): Promise<string> {
    await page.getByRole("link", { name: "API", exact: true }).click();
    await page.getByRole("button", { name: "TOKENS", exact: true }).click();
    await page.getByRole("button", { name: "Generate token", exact: true }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    if (hostnames === "*") {
      await dialog.getByLabel("All websites").check();
    } else {
      await dialog.getByLabel("Specific websites").check();
      for (const hostname of hostnames) {
        await dialog.getByLabel(hostname).check();
      }
    }
    await dialog.getByRole("button", { name: "Generate", exact: true }).click();
    await dialog.getByTestId("copy-button").click();
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    await expect(dialog).not.toBeVisible();

    return await page.evaluate(() => navigator.clipboard.readText());
  }
}
