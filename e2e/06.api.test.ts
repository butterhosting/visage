import { expect, Page, test } from "@playwright/test";
import { AppBoundary } from "./boundaries/AppBoundary";
import { TokenFlow } from "./flows/TokenFlow";
import { WebsiteFlow } from "./flows/WebsiteFlow";

test.beforeEach(async ({ page, context }) => {
  await context.grantPermissions(["clipboard-write", "clipboard-read"]);
  await AppBoundary.purge(page);
  await page.goto("");
});

test("the API fails without a token", async ({ page }) => {
  // when
  const { status, json } = await queryStats(page);
  // then
  expect(status).toEqual(401);
  expect(json).toEqual({
    problem: "ServerError::unauthorized",
  });
});

test("the API fails without a website parameter", async ({ page }) => {
  // given
  const token = await TokenFlow.generate(page);
  // when
  const { status, json } = await queryStats(page, { token });
  // then
  expect(status).toEqual(400);
  expect(json).toEqual(
    expect.objectContaining({
      problem: "StatsError::invalid_query",
    }),
  );
});

test.describe("the API returns empty data for a valid token", () => {
  for (const scope of ["*", "specific"] as const) {
    test(`scope = ${scope}`, async ({ page }) => {
      // given
      const { hostname } = await WebsiteFlow.create(page, { hostname: "www.seabass.com" });
      const token = await TokenFlow.generate(page, {
        hostnames: scope === "*" ? "*" : [hostname],
      });
      // when
      const { status, json } = await queryStats(page, {
        token,
        query: {
          website: hostname,
        },
      });
      // then
      expect(status).toEqual(200);
      expect(json).toEqual({});
    });
  }
});

test("the API fails when the token scope doesn't match the website", async ({ page }) => {
  // given
  const { hostname: hostnameBlue } = await WebsiteFlow.create(page, { hostname: "www.blue.com" });
  const { hostname: hostnameYellow } = await WebsiteFlow.create(page, { hostname: "www.yellow.com" });
  const token = await TokenFlow.generate(page, { hostnames: [hostnameBlue] });

  // when
  const statsBlue = await queryStats(page, {
    token,
    query: {
      website: hostnameBlue,
    },
  });
  // then
  expect(statsBlue.status).toEqual(200);
  expect(statsBlue.json).toEqual({});

  // when
  const statsYellow = await queryStats(page, {
    token,
    query: {
      website: hostnameYellow,
    },
  });
  // then
  expect(statsYellow.status).toEqual(403);
  expect(statsYellow.json).toEqual({
    problem: "ServerError::forbidden",
  });
});

test.describe("the API fails for invalid query parameters", () => {
  const validationFailureTests: ValidationFailureTest[] = [
    {
      description: "from is malformed",
      queryParams: { from: "not-a-date" },
      expectation: { errorFields: ["from"] },
    },
    {
      description: "to is malformed",
      queryParams: { to: "banana" },
      expectation: { errorFields: ["to"] },
    },
    {
      description: "from and to are both malformed",
      queryParams: { from: "x", to: "y" },
      expectation: { errorFields: ["from", "to"] },
    },
    {
      description: "from equals to",
      queryParams: { from: "2026-04-01T00:00:00Z", to: "2026-04-01T00:00:00Z" },
      expectation: { errorFields: ["from", "to"] },
    },
    {
      description: "from is after to",
      queryParams: { from: "2026-04-10T00:00:00Z", to: "2026-04-01T00:00:00Z" },
      expectation: { errorFields: ["from", "to"] },
    },
    {
      description: "fields contains an unknown value",
      queryParams: { fields: "bogus" },
      expectation: { errorFields: ["fields"] },
    },
    {
      description: "fields mixes valid and unknown values",
      queryParams: { fields: "visitorsTotal,bogus" },
      expectation: { errorFields: ["fields"] },
    },
  ];
  for (const { description, queryParams, expectation } of validationFailureTests) {
    test(description, async ({ page }) => {
      // given
      const { hostname } = await WebsiteFlow.create(page, { hostname: "www.fishandchips.co.uk" });
      const token = await TokenFlow.generate(page);
      // when
      const { status, json } = await queryStats(page, {
        token,
        query: { website: hostname, ...queryParams },
      });
      // then
      expect(status).toEqual(400);
      expect(json).toEqual({
        problem: "StatsError::invalid_query",
        details: {
          errorQueryParams: expectation.errorFields,
        },
      });
    });
  }
});

async function queryStats(
  page: Page,
  options?: { token?: string; query?: Record<string, string> },
): Promise<{ status: number; json: any }> {
  const response = await page.request.get("/api/stats", {
    params: options?.query,
    headers: options?.token ? { Authorization: `Bearer ${options.token}` } : {},
  });
  const json = await response.json();
  return {
    status: response.status(),
    json,
  };
}

type ValidationFailureTest = {
  description: string;
  queryParams: Record<string, string>;
  expectation: { errorFields: string[] };
};
