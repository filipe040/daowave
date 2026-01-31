import { test, expect } from "@playwright/test";

/**
 * E2E smoke tests — public routes, login, promoter and admin areas.
 * Assumes DB seeded (globalSetup runs db:seed).
 * Credentials: E2E_PROMOTER_EMAIL, E2E_PROMOTER_PASSWORD, E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD
 * with fallback for promoter to seed (promotor@seed.pt / TestPassword123!).
 * Admin has no seed user — set env or admin test is skipped.
 */

const SEED_PROMOTER_EMAIL = "promotor@seed.pt";
const SEED_PROMOTER_PASSWORD = "TestPassword123!";

test.describe("Smoke — Rotas públicas", () => {
  test("homepage carrega", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\//);
    await expect(page.locator("body")).toBeVisible();
  });

  test("listagem de eventos carrega", async ({ page }) => {
    await page.goto("/events");
    await page.waitForLoadState("networkidle").catch(() => {});
    await expect(page).toHaveURL(/\/events/);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { name: /eventos/i }).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Smoke — Login", () => {
  test("página de login carrega", async ({ page }) => {
    await page.goto("/auth/signin");
    await expect(page).toHaveURL(/\/auth\/signin/);
    await expect(page.getByTestId("signin-form")).toBeVisible({ timeout: 5000 });
    const email = page.locator('input[name="email"], input[type="email"]').first();
    await expect(email).toBeVisible({ timeout: 5000 });
  });

  test("login com credenciais promotor (env ou seed)", async ({ page }) => {
    const email = process.env.E2E_PROMOTER_EMAIL ?? SEED_PROMOTER_EMAIL;
    const password = process.env.E2E_PROMOTER_PASSWORD ?? SEED_PROMOTER_PASSWORD;
    await page.goto("/auth/signin");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page.getByTestId("signin-form")).toBeHidden({ timeout: 15000 });
    expect(page.url()).not.toContain("/auth/signin");
  });
});

test.describe("Smoke — Área promotor (requer login)", () => {
  test("dashboard promotor carrega após login", async ({ page }) => {
    const email = process.env.E2E_PROMOTER_EMAIL ?? SEED_PROMOTER_EMAIL;
    const password = process.env.E2E_PROMOTER_PASSWORD ?? SEED_PROMOTER_PASSWORD;
    await page.goto("/auth/signin");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page.getByTestId("signin-form")).toBeHidden({ timeout: 15000 });

    await page.goto("/promotor");
    await page.waitForLoadState("networkidle").catch(() => {});
    const url = page.url();
    expect(url.includes("/promotor") || url.includes("/organizer")).toBe(true);
    await expect(page.getByTestId("page-promotor-dashboard")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Smoke — Área admin (requer login admin)", () => {
  test("dashboard admin carrega após login admin", async ({ page }) => {
    const email = process.env.E2E_ADMIN_EMAIL;
    const password = process.env.E2E_ADMIN_PASSWORD;
    if (!email || !password) {
      test.skip(true, "E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set (seed has no admin user)");
      return;
    }
    await page.goto("/auth/signin");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page.getByTestId("signin-form")).toBeHidden({ timeout: 15000 });

    await page.goto("/admin");
    await page.waitForLoadState("networkidle").catch(() => {});
    const url = page.url();
    expect(url.includes("/admin") || url.includes("/promotor")).toBe(true);
    await expect(page.getByTestId("page-admin-dashboard")).toBeVisible({ timeout: 10000 });
  });
});
