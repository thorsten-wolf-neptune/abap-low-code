// RECORDER
// npx playwright codegen http://localhost:8080/app/cockpit

const core = require('@actions/core');
const playwright = require('playwright');
const server = process.env.P9_SERVER_URL || "{=testUrl}";

(async () => {

    try {

        console.log("Starting tests....");

        for (const browserType of ['chromium', 'firefox']) {

            console.log("Browser type: " + browserType);

            const browser = await playwright[browserType].launch({ headless: false });
            const context = await browser.newContext();
            const page = await context.newPage();

            await page.goto(`${server}/cockpit.html`);

            await page.fill('input[type="text"]', 'admin');
            await page.fill('[placeholder="Password"]', 'Uxp2019!');
            await page.press('[placeholder="Password"]', 'Enter')

            await page.goto(`${server}/cockpit.html#connectivity-apidesigner`);
            await page.waitForTimeout(2500);

            await browser.close();

        }

        console.log("Test completed successfully");

    } catch(e) {
        console.log(e);
        core.setFailed(e);
    }

})();
