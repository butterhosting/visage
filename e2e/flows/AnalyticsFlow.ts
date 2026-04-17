import { Browser, expect } from "@playwright/test";

export namespace AnalyticsFlow {
  type TriggerViews = {
    websiteType: "traditional" | "SPA";
    sequence: Array<"home" | "about" | "contact">;
  };
  export async function triggerViews(browser: Browser, { websiteType, sequence }: TriggerViews) {
    const context = await browser.newContext();
    const page = await context.newPage();

    const baseURL = `http://localhost:${websiteType === "SPA" ? 4001 : 4002}`;
    for (let i = 0; i < sequence.length; i++) {
      const destination = sequence[i];
      if (i === 0) {
        let url = baseURL;
        if (destination !== "home") {
          url += `/${destination}`;
          if (websiteType === "traditional") {
            url += ".html";
          }
        }
        await page.goto(url);
      } else if (destination === sequence[i - 1]) {
        await page.reload();
      } else {
        await page.getByRole("link", { name: destination }).click();
      }
      await expect(page.getByRole("heading", { name: destination })).toBeVisible();
      await page.waitForTimeout(50); // give the script some time to send beacons
    }
  }
}
