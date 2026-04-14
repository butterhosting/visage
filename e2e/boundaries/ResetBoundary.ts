import { APIRequestContext } from "@playwright/test";

export namespace ResetBoundary {
  export async function reset(request: APIRequestContext) {
    await request.post("/internal-api/restricted/purge", { failOnStatusCode: true });
  }
}
