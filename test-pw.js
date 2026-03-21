const { chromium } = require('playwright');
(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    await browser.close();
    console.log("Playwright OK");
  } catch (e) {
    console.error("Playwright Error:", e.message);
  }
})();
