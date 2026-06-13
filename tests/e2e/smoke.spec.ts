import { expect, test, type Page } from "@playwright/test";

const mojibakePattern = /\?{5,}|・ｽ|郢|邵|隴|驍|陷|鬮|繝|縺|螳|逕|譛|謠|險|蛹|蜿|鬆/;

const protectedPages = [
  { path: "/dashboard", text: "今日のホーム" },
  { path: "/students", text: "生徒カルテ" },
  { path: "/lessons", text: "レッスンカルテ" },
  { path: "/reports", text: "レポート" },
  { path: "/settings", text: "設定" },
];

const requiredAuthEnv = ["E2E_BASE_URL", "E2E_TEST_EMAIL", "E2E_TEST_PASSWORD"] as const;
const missingAuthEnv = requiredAuthEnv.filter((name) => !process.env[name]);
const hasAuthenticatedEnv = missingAuthEnv.length === 0;

async function expectNoMojibake(page: Page) {
  const bodyText = await page.locator("body").innerText();
  expect(bodyText).not.toMatch(mojibakePattern);
}

async function expectNoHorizontalOverflow(page: Page) {
  const { clientWidth, scrollWidth } = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
}

async function login(page: Page) {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error("Authenticated smoke requires E2E_TEST_EMAIL and E2E_TEST_PASSWORD.");
  }

  await page.goto("/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/dashboard(?:\?|$)/);
}

test("login page renders Japanese text without mojibake", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByText("YOGA NURTURE")).toBeVisible();
  await expect(page.locator("body")).toContainText("ログイン");

  const emailInput = page.locator('input[type="email"]');
  if ((await emailInput.count()) === 1) {
    await expect(emailInput).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  } else {
    await expect(page.locator("body")).toContainText("Supabase");
  }

  await expectNoMojibake(page);
});

test("protected pages redirect unauthenticated users to login", async ({ page }) => {
  for (const { path } of protectedPages) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("body")).toContainText("ログイン");
    await expectNoMojibake(page);
  }
});

test.describe(hasAuthenticatedEnv ? "authenticated smoke" : `authenticated smoke skipped: missing ${missingAuthEnv.join(", ")}`, () => {
  test.skip(
    !hasAuthenticatedEnv,
    `Authenticated smoke skipped: missing ${missingAuthEnv.join(", ")}. Set E2E_BASE_URL, E2E_TEST_EMAIL, and E2E_TEST_PASSWORD in your shell or local .env file.`,
  );

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  for (const { path, text } of protectedPages) {
    test(`${path} renders expected Japanese UI`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("body")).toContainText(text);
      await expectNoMojibake(page);
    });
  }

  test("mobile reports page avoids horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/reports?period=3months");
    await expect(page.locator("body")).toContainText("レポート");
    await expectNoMojibake(page);
    await expectNoHorizontalOverflow(page);
  });

  test("user can log out from settings", async ({ page }) => {
    await page.goto("/settings");
    await page.locator('form[action="/auth/sign-out"] button[type="submit"]').click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
