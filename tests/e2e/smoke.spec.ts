import { expect, test, type Page } from "@playwright/test";

const mojibakePattern = /\?{5,}|�|繝|繧|縺|譁|荳|邂|謗|竊|螳|逕|蜈|髱/;

const protectedPages = [
  { path: "/dashboard", text: "今日やること" },
  { path: "/students", text: "生徒カルテ" },
  { path: "/lessons", text: "レッスンカルテ" },
  { path: "/reports", text: "レポート" },
  { path: "/settings", text: "設定" },
];

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
    test.skip(true, "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run authenticated smoke tests.");
  }

  await page.goto("/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
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

test.describe("authenticated smoke", () => {
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
});
