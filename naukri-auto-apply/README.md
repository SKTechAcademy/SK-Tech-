# SK TECH Naukri Auto Apply

POC architecture: GitHub Pages dashboard + local Node.js/Playwright worker.

## Run worker

```bash
cd naukri-auto-apply/worker
npm install
npx playwright install chromium
npm start
```

Then open `naukri-auto-apply/index.html` from the site. Click **Start Auto Apply**. Chrome opens using a persistent `.naukri-profile`; complete login, OTP or CAPTCHA manually whenever Naukri requests it.

## Current implementation

- Candidate roles, experience, skills, locations and match threshold
- Persistent local browser profile
- Naukri browser launch
- Job-link discovery and skill matching
- Applied/review/skipped dashboard model
- Start/stop/status API
- No credentials in GitHub Pages

Automatic final submission is intentionally not enabled yet. First verify live Naukri job/apply selectors using the candidate account. Security challenges are always manual.
