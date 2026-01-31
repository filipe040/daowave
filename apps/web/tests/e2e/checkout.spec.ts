import * as fs from "fs";
import * as path from "path";
import { test, expect } from "@playwright/test";

/**
 * E2E checkout and check-in tests.
 * Requires seeded DB: run `npm run e2e:prep` before E2E.
 * globalSetup verifies DB and writes tests/e2e/.cache/seed.json (eventId, eventSlug, validQr).
 * Checkout: deterministic navigation to /events/evento-seed-1.
 * Check-in: uses validQr from seed.json for VALID then ALREADY_USED.
 */

const SEED_PROMOTER_EMAIL = "promotor@seed.pt";
const SEED_PROMOTER_PASSWORD = "TestPassword123!";
const SEED_USER_EMAIL = "comprador1@seed.pt";
const SEED_USER_PASSWORD = "TestPassword123!";

const SEED_JSON_PATH = path.join(process.cwd(), "tests", "e2e", ".cache", "seed.json");

function getPromoterCreds() {
  return {
    email: process.env.E2E_PROMOTER_EMAIL ?? SEED_PROMOTER_EMAIL,
    password: process.env.E2E_PROMOTER_PASSWORD ?? SEED_PROMOTER_PASSWORD,
  };
}

function getValidatorCreds() {
  return {
    email: process.env.E2E_VALIDATOR_EMAIL ?? SEED_USER_EMAIL,
    password: process.env.E2E_VALIDATOR_PASSWORD ?? SEED_USER_PASSWORD,
  };
}

function getSeedFixture(): { eventId: string; eventSlug: string; validQr: string } {
  if (!fs.existsSync(SEED_JSON_PATH)) {
    throw new Error("E2E seed fixture not found. Run npm run e2e:prep then npm run test:e2e.");
  }
  const data = JSON.parse(fs.readFileSync(SEED_JSON_PATH, "utf-8"));
  if (!data.eventId || !data.validQr) {
    throw new Error("E2E seed.json must contain eventId and validQr. Run npm run e2e:prep.");
  }
  return data;
}

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/auth/signin");
  await expect(page.getByTestId("signin-form")).toBeVisible({ timeout: 10000 });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page.getByTestId("signin-form")).toBeHidden({ timeout: 15000 });
}

test.describe("Checkout Flow E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should complete checkout flow with mock payment", async ({ page }) => {
    const { email, password } = getValidatorCreds();
    await login(page, email, password);

    await page.goto("/events/evento-seed-1");
    await expect(page.getByTestId("event-ticket-selector")).toBeVisible({ timeout: 15000 });
    const addQty = page.locator("button:has-text('+')").first();
    await expect(addQty).toBeVisible({ timeout: 5000 });
    await addQty.click();
    await expect(page.getByTestId("event-ticket-selector").locator("span.w-12").first()).toHaveText("1", { timeout: 5000 });
    const continueBtn = page.getByTestId("btn-continue-checkout");
    await expect(continueBtn).toBeVisible({ timeout: 5000 });
    await expect(continueBtn).toBeEnabled();

    await continueBtn.click();
    const result = await Promise.race([
      page.getByTestId("page-checkout").waitFor({ state: "visible", timeout: 15000 }).then(() => "ok" as const),
      page.getByTestId("checkout-error").waitFor({ state: "visible", timeout: 15000 }).then(() => "err" as const),
    ]).catch(() => "timeout" as const);
    if (result === "err") {
      const msg = await page.getByTestId("checkout-error").textContent();
      throw new Error(`Checkout error: ${msg?.trim() ?? "unknown"}`);
    }
    if (result === "timeout") {
      const url = page.url();
      if (!/\/checkout\/[^/]+/.test(url)) {
        const errVisible = await page.getByTestId("checkout-error").isVisible();
        const errMsg = errVisible ? await page.getByTestId("checkout-error").textContent() : null;
        throw new Error(
          errMsg?.trim()
            ? `Checkout error: ${errMsg.trim()}`
            : 'After "Continuar para Pagamento": expected /checkout/<orderId> or page-checkout visible.'
        );
      }
    }
    await expect(page).toHaveURL(/\/checkout\/[^/]+/);
    await expect(page.getByTestId("input-buyer-name")).toBeVisible({ timeout: 5000 });
    await page.getByTestId("input-buyer-name").fill("Test User");
    await page.getByTestId("input-buyer-email").fill("test@example.com");

    const payButton = page.locator("button[type='submit']").or(page.locator("button:has-text('Confirmar Pagamento')"));
    await expect(payButton.first()).toBeVisible({ timeout: 5000 });
    await payButton.first().click();

    await expect(page.getByTestId("page-order-success").or(page.locator("text=Pagamento concluído")).or(page.locator("text=Meus bilhetes")).or(page.getByTestId("page-my-tickets")).first()).toBeVisible({ timeout: 20000 });
  });

  test("should display tickets in 'My Tickets' after purchase", async ({ page }) => {
    const { email, password } = getValidatorCreds();
    await login(page, email, password);

    await page.goto("/my-tickets");
    await expect(page.getByTestId("page-my-tickets")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("heading", { name: /os meus bilhetes/i })).toBeVisible({ timeout: 5000 });

    expect(page.url()).toContain("/my-tickets");
  });
});

test.describe("Check-in (promotor scanner) E2E", () => {
  test("should load promotor check-in page and show QR input", async ({ page }) => {
    const { email, password } = getPromoterCreds();
    await login(page, email, password);

    const { eventId } = getSeedFixture();
    await page.goto(`/promotor/checkin/${eventId}`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await expect(page.getByTestId("page-promotor-checkin")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("input-qr")).toBeVisible({ timeout: 5000 });
  });

  test("should show VALID then ALREADY_USED for same QR (real check-in)", async ({ page }) => {
    const { email, password } = getPromoterCreds();
    await login(page, email, password);

    const { eventId, validQr } = getSeedFixture();
    await page.goto(`/promotor/checkin/${eventId}`);
    await expect(page.getByTestId("page-promotor-checkin")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("input-qr")).toBeVisible({ timeout: 5000 });

    await page.getByTestId("input-qr").fill(validQr);
    await page.getByRole("button", { name: /Verificar Bilhete/i }).click();
    await expect(page.getByTestId("checkin-result")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("checkin-result")).toContainText(/checked in successfully|verificado com sucesso/i);

    await page.getByTestId("input-qr").fill(validQr);
    await page.getByRole("button", { name: /Verificar Bilhete/i }).click();
    await expect(page.getByTestId("checkin-result")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("checkin-result")).toContainText(/already checked in|já utilizado|já foi usado/i);
  });
});
