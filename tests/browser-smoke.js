const { chromium } = require("playwright");
const assert = require("node:assert/strict");

const sample = [{
  InterviewKey: "sk20|2026-08-18|10:00|11:00|1",
  "Sk Tech Register ID": "SK20",
  "Full Name": "Test Candidate",
  Round: "Round 1",
  "Interview Date": "2026-08-18T00:00:00.000Z",
  "Interview Time (From)  or  If Time Not confirmed plz select 00:00 like Assessment": "10:00",
  "Interview Time (To) or  If Time Not confirmed plz select 00:00 like Assessment": "11:00",
  Batch: "1",
  Status: "Scheduled"
}];

(async function() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const writes = [];
  page.on("dialog", dialog => dialog.accept());

  await page.addInitScript(() => {
    const payload = btoa(unescape(encodeURIComponent(JSON.stringify({ email: "admin@mysktech.com" })))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    window.google = { accounts: { id: {
      initialize(options) { window.__googleCallback = options.callback; },
      renderButton(element) {
        const button = document.createElement("button");
        button.id = "mockGoogleSignIn";
        button.textContent = "Sign in with Google";
        button.onclick = () => window.__googleCallback({ credential: "x." + payload + ".x" });
        element.appendChild(button);
      },
      disableAutoSelect() {}
    } } };
  });
  await page.route("**/interview-admin-config.js*", route => route.fulfill({
    contentType: "application/javascript",
    body: 'window.SKTECH_INTERVIEW_ADMIN_CONFIG={googleClientId:"test.apps.googleusercontent.com",appsScriptUrl:"https://script.google.com/mock",refreshMilliseconds:30000};'
  }));
  await page.route("https://script.google.com/mock", async route => {
    const body = JSON.parse(route.request().postData() || "{}");
    if (body.action === "updateInterviewStatus") {
      writes.push(body);
      sample[0].Status = body.status;
      sample[0].Remarks = body.remarks;
      return route.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ ok: true }) });
    }
    return route.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ ok: true, data: sample }) });
  });

  await page.goto("http://127.0.0.1:4173/interview-admin.html");
  await page.click("#mockGoogleSignIn");
  await page.waitForSelector("#statusAdminBody tr");
  assert.equal(await page.locator("#adminUser").textContent(), "admin@mysktech.com");
  assert.match(await page.locator("#statusAdminBody").textContent(), /SK20/);

  await page.selectOption(".status-select", "Cancelled");
  await page.click("#saveStatusUpdate");
  assert.match(await page.locator("#statusFormError").textContent(), /requires a reason/i);
  await page.fill("#statusRemarks", "Candidate unavailable");
  await page.click("#saveStatusUpdate");
  await page.waitForFunction(() => !document.querySelector("#statusDialog").open);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].status, "Cancelled");

  await page.selectOption(".status-select", "Rescheduled");
  assert.equal(await page.locator("#rescheduleFields").isVisible(), true);
  await page.fill("#rescheduledFrom", "15:00");
  await page.fill("#rescheduledTo", "14:00");
  await page.click("#saveStatusUpdate");
  assert.match(await page.locator("#statusFormError").textContent(), /after start time/i);
  await page.click("#cancelStatusUpdate");

  assert.equal((await page.locator("body").evaluate(el => el.scrollWidth <= el.clientWidth)), true);

  const publicPage = await context.newPage();
  await publicPage.route("https://script.google.com/macros/s/**", route => route.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(sample) }));
  await publicPage.goto("http://127.0.0.1:4173/interviews.html");
  await publicPage.waitForSelector("#tableBody tr");
  await publicPage.click('.tab-btn[data-tab="today"]');
  assert.equal(await publicPage.locator('.tab-btn[data-tab="today"]').getAttribute("class"), "tab-btn active");
  await publicPage.click('.tab-btn[data-tab="all"]');
  assert.equal(await publicPage.locator('.tab-btn[data-tab="all"]').getAttribute("class"), "tab-btn active");
  assert.equal((await publicPage.locator("body").evaluate(el => el.scrollWidth <= el.clientWidth)), true);

  await browser.close();
  console.log("Browser smoke tests passed: admin auth UI, status validation/write, mobile layout and public tabs.");
})().catch(error => { console.error(error); process.exitCode = 1; });
