import { Page } from "@playwright/test";

export namespace AppBoundary {
  export async function purge(page: Page) {
    await page.request.post("/internal-api/restricted/purge", { failOnStatusCode: true });
  }

  type Seed = {
    rngSeed: number;
  };
  export async function seed(page: Page, { rngSeed }: Seed) {
    await page.request.post("/internal-api/restricted/seed", {
      data: { rngSeed },
      failOnStatusCode: true,
    });
  }
}
