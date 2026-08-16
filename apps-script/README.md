# Interview status Apps Script setup

This backend keeps `Form Responses 1` as the booking source and creates/uses an append-only `Interview Status Updates` tab. The public `doGet` response contains only the six schedule fields plus status/remarks. Admin reads and writes require a verified Google ID token and an email allowlist.

1. Open the Apps Script project currently serving the interview dashboard.
2. Back up the existing `Code.gs`, then replace its dashboard `doGet`/`doPost` implementation with `Code.gs` from this folder. If that project contains unrelated form/email functions, retain them.
3. In **Project Settings → Script properties**, add:
   - `SPREADSHEET_ID`: the private ID of the existing SK interview spreadsheet.
   - `GOOGLE_CLIENT_ID`: the OAuth Web Client ID used by `interview-admin-config.js`.
   - `ADMIN_EMAILS`: comma-separated approved admin Google accounts.
4. In the OAuth Web Client, add these **Authorized JavaScript origins** (origins do not include a trailing path):
   - `https://www.mysktech.com`
   - `https://mysktech.com`
   - `https://sktechacademy.github.io`
   - `http://localhost:4173` while testing locally
5. Deploy a **new web-app version**, executing as the owner, accessible to anyone. Reads are sanitized; every admin action is verified server-side.
6. Put the new deployment URL into both `shared-utils.js` and `interview-admin-config.js`.
7. Open `interview-admin.html`, sign in with an allowlisted account and test all five statuses before production.

Never place admin passwords, OAuth client secrets or private keys in this repository.
