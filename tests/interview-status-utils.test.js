const test = require("node:test");
const assert = require("node:assert/strict");
const status = require("../interview-status-utils.js");

const base = {
  "Sk Tech Register ID": "SK20",
  "Interview Date": "8/18/2026",
  "Interview Time (From)  or  If Time Not confirmed plz select 00:00 like Assessment": "10:00 AM",
  "Interview Time (To) or  If Time Not confirmed plz select 00:00 like Assessment": "11:00 AM",
  "Batch": "1"
};

test("creates a stable composite key", () => {
  assert.equal(status.makeInterviewKey(base), "sk20|8/18/2026|10:00 am|11:00 am|1");
});

test("uses the latest status update and applies rescheduled values", () => {
  const key = status.makeInterviewKey(base);
  const result = status.mergeInterviewStatuses([base], [
    { InterviewKey: key, Status: "Cancelled", "Updated At": "2026-08-16T10:00:00Z" },
    { InterviewKey: key, Status: "Rescheduled", "Rescheduled Date": "2026-08-20", "Rescheduled From": "14:00", "Rescheduled To": "15:00", "Updated At": "2026-08-16T11:00:00Z" }
  ]);
  assert.equal(result[0].Status, "Rescheduled");
  assert.equal(result[0]["Interview Date"], "2026-08-20");
  assert.equal(result[0]["Interview Time (From)  or  If Time Not confirmed plz select 00:00 like Assessment"], "14:00");
});

test("requires reasons for cancelled and other", () => {
  assert.equal(status.validateStatusUpdate({ interviewKey: "x", status: "Cancelled", remarks: "" }).valid, false);
  assert.equal(status.validateStatusUpdate({ interviewKey: "x", status: "Other", remarks: "Needs review" }).valid, true);
});

test("validates reschedule date and time ordering", () => {
  const invalid = status.validateStatusUpdate({ interviewKey: "x", status: "Rescheduled", rescheduledDate: "2026-08-20", rescheduledFrom: "15:00", rescheduledTo: "14:00" });
  assert.equal(invalid.valid, false);
  assert.match(invalid.errors.join(" "), /after start time/);
  const valid = status.validateStatusUpdate({ interviewKey: "x", status: "Rescheduled", rescheduledDate: "2026-08-20", rescheduledFrom: "14:00", rescheduledTo: "15:00" });
  assert.equal(valid.valid, true);
});

test("recognises closed statuses case-insensitively", () => {
  assert.equal(status.isClosedStatus("Completed"), true);
  assert.equal(status.isClosedStatus("cancelled"), true);
  assert.equal(status.isClosedStatus("Rescheduled"), false);
});
