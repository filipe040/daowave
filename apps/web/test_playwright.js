const { chromium } = require('playwright');
(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    await browser.close();
    console.log("Playwright works.");
  } catch (err) {
    console.error("Playwright failed:", err);
  }
})();
