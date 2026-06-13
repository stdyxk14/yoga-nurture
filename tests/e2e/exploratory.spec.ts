import { expect, test, type Page } from "@playwright/test";

const requiredAuthEnv = ["E2E_BASE_URL", "E2E_TEST_EMAIL", "E2E_TEST_PASSWORD"] as const;
const missingAuthEnv = requiredAuthEnv.filter((name) => !process.env[name]);
const hasAuthenticatedEnv = missingAuthEnv.length === 0;
const mojibakePattern = /\?{5,}|繝ｻ・ｽ|驛｢|驍ｵ|髫ｴ|鬩鋼髯ｷ|鬯ｮ|郢掟邵ｺ|陞ｳ|騾怖隴斈隰|髫ｪ|陋ｹ|陷ｿ|鬯・/;
const errorPagePattern = /This page couldn.t load|A server error occurred|Application error|Unhandled Runtime Error|An error occurred in the Server Components render|Functions cannot be passed directly|NEXT_NOT_FOUND/;

test.describe(hasAuthenticatedEnv ? "production exploratory smoke" : `production exploratory smoke skipped: missing ${missingAuthEnv.join(", ")}`, () => {
  test.skip(!hasAuthenticatedEnv, "Set E2E_BASE_URL, E2E_TEST_EMAIL, and E2E_TEST_PASSWORD to run production exploration.");
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("opens core pages, existing detail pages, safe missing-id pages, and mobile nav", async ({ page }) => {
    const consoleErrors = attachErrorGuards(page);
    const visited: string[] = [];
    const corePages = ["/dashboard", "/students", "/students/new", "/lessons", "/lessons/new", "/schedules/new", "/blocks/new", "/reports", "/settings"];

    for (const path of corePages) {
      await openHealthy(page, path);
      visited.push(path);
    }

    const dynamicPaths = await discoverDynamicPaths(page);
    for (const path of dynamicPaths) {
      await openHealthy(page, path);
      visited.push(path);
    }

    const missingPaths = ["/students/not-found-test", "/lessons/not-found-test", "/blocks/not-found-test", "/schedules/not-found-test"];
    for (const path of missingPaths) {
      await page.goto(path);
      await expectSafePage(page, { allowNotFoundText: true });
      await expect(page.locator("body")).toContainText("見つかりません");
      visited.push(path);
    }

    await page.setViewportSize({ width: 390, height: 900 });
    await openHealthy(page, "/dashboard");
    await page.getByRole("button", { name: "メニューを開く" }).click();
    await expect(page.getByText("メニュー")).toBeVisible();
    await page.getByRole("link", { name: /レッスンカルテ/ }).click();
    await expect(page).toHaveURL(/\/lessons/);
    await expectSafePage(page);
    await expectNoHorizontalOverflow(page);

    expect(visited.length).toBeGreaterThanOrEqual(corePages.length + missingPaths.length);
    expectConsoleClean(consoleErrors);
  });

  test("safe dashboard links navigate without server errors", async ({ page }) => {
    const consoleErrors = attachErrorGuards(page);
    await openHealthy(page, "/dashboard");
    const hrefs = await page.locator('a[href^="/"]').evaluateAll((links) =>
      Array.from(new Set(links.map((link) => (link as HTMLAnchorElement).getAttribute("href")).filter(Boolean))).slice(0, 20),
    );

    for (const href of hrefs) {
      if (!href || href.includes("delete") || href.includes("sign-out")) continue;
      await openHealthy(page, href);
    }

    expectConsoleClean(consoleErrors);
  });
});

async function login(page: Page) {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  if (!email || !password) throw new Error("Missing E2E credentials.");

  await page.goto("/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/dashboard(?:\?|$)/);
}

async function discoverDynamicPaths(page: Page) {
  await page.goto("/students");
  const studentDetail = await firstHref(page, /^\/students\/(?!new$)[^/]+$/);
  const studentEdit = studentDetail ? `${studentDetail}/edit` : null;

  await page.goto("/lessons");
  const lessonDetail = await firstHref(page, /^\/lessons\/(?!new$|blocks\/new$)[^/]+$/);
  const lessonEdit = lessonDetail ? `${lessonDetail}/edit` : null;
  const lessonScript = lessonDetail ? `${lessonDetail}/script` : null;
  const lessonRecord = await firstHref(page, /^\/lessons\/[^/]+\/record$/);
  const scheduleDetail = await firstHref(page, /^\/schedules\/(?!new$)[^/]+$/);
  const blockDetail = await firstHref(page, /^\/blocks\/(?!new$)[^/]+$/);
  const blockEdit = blockDetail ? `${blockDetail}/edit` : null;

  return [studentDetail, studentEdit, lessonDetail, lessonEdit, lessonScript, lessonRecord, scheduleDetail, blockDetail, blockEdit].filter(Boolean) as string[];
}

async function firstHref(page: Page, pattern: RegExp) {
  const hrefs = await page.locator('a[href^="/"]').evaluateAll((links) =>
    Array.from(new Set(links.map((link) => (link as HTMLAnchorElement).getAttribute("href")).filter(Boolean))),
  );
  return hrefs.find((href) => href && pattern.test(href)) ?? null;
}

async function openHealthy(page: Page, path: string) {
  const response = await page.goto(path);
  expect(response?.status(), path).toBeLessThan(500);
  await expectSafePage(page);
  await expectNoHorizontalOverflow(page);
}

async function expectSafePage(page: Page, options: { allowNotFoundText?: boolean } = {}) {
  await expect(page.locator("body")).not.toContainText(errorPagePattern);
  const bodyText = await page.locator("body").innerText();
  expect(bodyText).not.toMatch(mojibakePattern);
  if (!options.allowNotFoundText) expect(bodyText).not.toMatch(/\b404\b|Not Found/i);
}

async function expectNoHorizontalOverflow(page: Page) {
  const { clientWidth, scrollWidth } = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
}

function attachErrorGuards(page: Page) {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });
  return consoleErrors;
}

function expectConsoleClean(consoleErrors: string[]) {
  expect(consoleErrors, `Browser console/page errors:\n${consoleErrors.join("\n")}`).toEqual([]);
}
