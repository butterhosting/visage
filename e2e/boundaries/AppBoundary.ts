import { APIRequestContext } from "@playwright/test";

export namespace AppBoundary {
  export async function purge(request: APIRequestContext) {
    await request.post("/internal-api/restricted/purge", { failOnStatusCode: true });
  }
  export async function seed(request: APIRequestContext) {
    await request.post("/internal-api/restricted/seed", {
      data: {
        rngSeed: 5398438,
      },
      failOnStatusCode: true,
    });
  }
}
