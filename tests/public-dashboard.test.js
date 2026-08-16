const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadSharedUtils(now) {
  const FakeDate = class extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return new Date(now).getTime(); }
  };
  const context = { Date: FakeDate, console };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("shared-utils.js", "utf8"), context);
  return context;
}

test("completed and cancelled interviews are removed from upcoming", () => {
  const utils = loadSharedUtils("2026-08-16T08:00:00+05:30");
  const rows = ["Scheduled", "Completed", "Cancelled", "Rescheduled", "Other"].map((status, index) => ({
    "Sk Tech Register ID": "SK" + index,
    "Interview Date": "2026-08-18T00:00:00.000Z",
    Status: status
  }));
  const result = utils.filterUpcoming(rows);
  assert.deepEqual(Array.from(result.upcoming, row => row.Status), ["Scheduled", "Rescheduled", "Other"]);
});

test("future interview sorting uses effective date and start time", () => {
  const utils = loadSharedUtils("2026-08-16T08:00:00+05:30");
  const fromKey = "Interview Time (From)  or  If Time Not confirmed plz select 00:00 like Assessment";
  const rows = [
    { "Sk Tech Register ID": "SK2", "Interview Date": "2026-08-20", [fromKey]: "15:00" },
    { "Sk Tech Register ID": "SK1", "Interview Date": "2026-08-18", [fromKey]: "10:00" }
  ];
  assert.deepEqual(Array.from(utils.sortByDateTime(rows), row => row["Sk Tech Register ID"]), ["SK1", "SK2"]);
});
