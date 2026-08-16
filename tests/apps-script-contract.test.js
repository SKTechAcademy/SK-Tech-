const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadScript(token, properties) {
  const context = {
    console,
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => properties[key] || "" }) },
    UrlFetchApp: { fetch: () => ({ getResponseCode: () => token.code, getContentText: () => JSON.stringify(token.body || {}) }) }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("apps-script/Code.gs", "utf8"), context);
  return context;
}

const props = {
  GOOGLE_CLIENT_ID: "client.apps.googleusercontent.com",
  ADMIN_EMAILS: "support@mysktech.com, admin@mysktech.com"
};

test("authorises only a verified allowlisted Google identity", () => {
  const script = loadScript({ code: 200, body: { aud: props.GOOGLE_CLIENT_ID, email: "SUPPORT@MYSKTECH.COM", email_verified: true } }, props);
  assert.equal(script.verifyAdmin_("credential"), "support@mysktech.com");
});

test("rejects an otherwise valid but non-allowlisted identity", () => {
  const script = loadScript({ code: 200, body: { aud: props.GOOGLE_CLIENT_ID, email: "visitor@example.com", email_verified: true } }, props);
  assert.throws(() => script.verifyAdmin_("credential"), /not authorised/i);
});

test("rejects wrong audience and expired tokens", () => {
  const wrongAudience = loadScript({ code: 200, body: { aud: "wrong", email: "support@mysktech.com", email_verified: true } }, props);
  assert.throws(() => wrongAudience.verifyAdmin_("credential"), /verification failed/i);
  const expired = loadScript({ code: 400, body: {} }, props);
  assert.throws(() => expired.verifyAdmin_("credential"), /expired/i);
});

test("public rows never contain candidate or HR personal information", () => {
  const script = loadScript({ code: 200, body: {} }, props);
  const result = script.sanitizePublicRow_({
    "Sk Tech Register ID": "SK20", "Full Name": "Private Name", "Email Address": "private@example.com",
    "HR Number": "9999999999", "HR Mail Id": "hr@example.com", Round: "Round 1", Status: "Scheduled"
  });
  assert.equal(result["Sk Tech Register ID"], "SK20");
  assert.equal("Full Name" in result, false);
  assert.equal("Email Address" in result, false);
  assert.equal("HR Number" in result, false);
  assert.equal("HR Mail Id" in result, false);
});

test("server enforces required reasons and valid reschedule times", () => {
  const script = loadScript({ code: 200, body: {} }, props);
  assert.throws(() => script.validateStatusRequest_({ interviewKey: "x", status: "Cancelled", remarks: "" }), /requires a reason/i);
  assert.throws(() => script.validateStatusRequest_({ interviewKey: "x", status: "Rescheduled", rescheduledDate: "2026-08-20", rescheduledFrom: "15:00", rescheduledTo: "14:00" }), /after start time/i);
  assert.doesNotThrow(() => script.validateStatusRequest_({ interviewKey: "x", status: "Completed", remarks: "" }));
});
