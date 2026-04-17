import { APIRequestContext } from "@playwright/test";

export namespace AppBoundary {
  export async function purge(request: APIRequestContext) {
    await request.post("/internal-api/restricted/purge", { failOnStatusCode: true });
  }

  type Seed = {
    rngSeed: number;
  };
  export async function seed(request: APIRequestContext, { rngSeed }: Seed) {
    await request.post("/internal-api/restricted/seed", {
      data: { rngSeed },
      failOnStatusCode: true,
    });
  }
}
