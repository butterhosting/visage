import { expect, test } from "@playwright/test";

type TestCase = {
  url: string;
  expectation: {
    title: string;
  };
};

test("all main pages load and have the right title", async ({ page }) => {
  // given
  const testCases: TestCase[] = [
    {
      url: "",
      expectation: { title: "Websites | Visage" },
    },
    {
      url: "interface",
      expectation: { title: "API | Visage" },
    },
    {
      url: "settings",
      expectation: { title: "Settings | Visage" },
    },
  ];
  for (const { url, expectation } of testCases) {
    // when
    await page.goto(url);
    // then
    await expect(page).toHaveTitle(expectation.title);
  }
});
