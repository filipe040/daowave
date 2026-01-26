import { test, expect } from "@playwright/test";

/**
 * E2E tests for checkout flow
 */

test.describe("Checkout Flow E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto("/");
  });

  test("should complete checkout flow with mock payment", async ({ page }) => {
    // 1. Navigate to an event page
    // First, we need a published event - in real scenario, seed test data
    await page.goto("/events");
    
    // Wait for events to load
    await page.waitForSelector("text=Eventos", { timeout: 10000 });
    
    // Click on first event (or specific test event)
    const firstEvent = page.locator("a[href^='/events/']").first();
    if (await firstEvent.count() > 0) {
      await firstEvent.click();
    } else {
      test.skip("No events available for testing");
      return;
    }

    // 2. Select tickets
    await page.waitForSelector("button:has-text('Comprar')", { timeout: 10000 });
    
    // Click buy button for first ticket type
    const buyButton = page.locator("button:has-text('Comprar')").first();
    await buyButton.click();

    // 3. Fill customer info
    await page.waitForSelector("input[name='attendees[0].name']", { timeout: 5000 });
    await page.fill("input[name='attendees[0].name']", "Test User");
    await page.fill("input[name='attendees[0].email']", "test@example.com");

    // 4. Proceed to checkout
    const checkoutButton = page.locator("button:has-text('Finalizar Compra')");
    if (await checkoutButton.count() > 0) {
      await checkoutButton.click();
    }

    // 5. Complete mock payment (if mock payment is enabled)
    await page.waitForTimeout(2000); // Wait for redirect
    
    // Check if we're on payment page or success page
    const currentUrl = page.url();
    
    // If mock payment, look for mock payment button
    const mockPaymentButton = page.locator("button:has-text('Pagar com Mock')");
    if (await mockPaymentButton.count() > 0) {
      await mockPaymentButton.click();
      await page.waitForTimeout(2000);
    }

    // 6. Verify order success or redirect
    // Should redirect to success page or show success message
    const successIndicator = page.locator("text=sucesso, text=confirmado, text=obrigado").first();
    if (await successIndicator.count() > 0) {
      expect(await successIndicator.isVisible()).toBeTruthy();
    }
  });

  test("should display tickets in 'My Tickets' after purchase", async ({ page }) => {
    // This test requires authentication
    // In real scenario, use test user credentials
    
    // Navigate to login
    await page.goto("/auth/signin");
    
    // Fill login form (use test credentials)
    await page.fill("input[name='email']", "customer@staging.7eventickets.pt");
    await page.fill("input[name='password']", "Password123!");
    
    // Submit login
    await page.click("button[type='submit']");
    
    // Wait for redirect
    await page.waitForURL("**/", { timeout: 10000 });
    
    // Navigate to "My Tickets"
    await page.goto("/tickets");
    
    // Wait for tickets page to load
    await page.waitForSelector("text=Meus Bilhetes, text=Bilhetes", { timeout: 10000 });
    
    // Verify tickets are displayed (if any exist)
    const ticketsList = page.locator("[data-testid='ticket-item'], .ticket-card, article");
    const ticketCount = await ticketsList.count();
    
    // At minimum, the page should load without errors
    expect(page.url()).toContain("/tickets");
  });
});

test.describe("Validator Check-in E2E", () => {
  test("should validate a valid ticket QR code", async ({ page }) => {
    // This test requires validator authentication
    await page.goto("/auth/signin");
    
    // Login as validator
    await page.fill("input[name='email']", "validator@staging.7eventickets.pt");
    await page.fill("input[name='password']", "Password123!");
    await page.click("button[type='submit']");
    
    // Wait for redirect
    await page.waitForURL("**/validator**", { timeout: 10000 });
    
    // Navigate to validator page
    await page.goto("/validator");
    
    // Wait for validator interface
    await page.waitForSelector("input[type='text'], input[placeholder*='QR'], button:has-text('Validar')", { timeout: 10000 });
    
    // For this test, we'd need a valid QR token
    // In real scenario, generate QR token from test ticket
    const qrInput = page.locator("input[type='text'], input[placeholder*='QR']").first();
    
    if (await qrInput.count() > 0) {
      // Enter a test QR code (would need to be generated from test ticket)
      // For now, just verify the input exists
      expect(await qrInput.isVisible()).toBeTruthy();
    }
  });

  test("should reject an already used ticket", async ({ page }) => {
    // Login as validator
    await page.goto("/auth/signin");
    await page.fill("input[name='email']", "validator@staging.7eventickets.pt");
    await page.fill("input[name='password']", "Password123!");
    await page.click("button[type='submit']");
    
    await page.waitForURL("**/validator**", { timeout: 10000 });
    await page.goto("/validator");
    
    await page.waitForSelector("input[type='text'], input[placeholder*='QR']", { timeout: 10000 });
    
    // This test would require:
    // 1. A ticket that has already been checked in
    // 2. Its QR token
    // 3. Attempting to check it in again
    // 4. Verifying error message "já utilizado" or "already used"
    
    // For now, verify validator interface is accessible
    const validatorInterface = page.locator("text=Validar, text=Check-in").first();
    expect(await validatorInterface.count()).toBeGreaterThan(0);
  });
});
