(function(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SKTechInterviewStatus = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function() {
  "use strict";

  const ALLOWED_STATUSES = ["Scheduled", "Completed", "Cancelled", "Rescheduled", "Other"];

  function clean(value) {
    return value === null || value === undefined ? "" : String(value).trim();
  }

  function normalizeKeyPart(value) {
    return clean(value).toLowerCase().replace(/\s+/g, " ");
  }

  function makeInterviewKey(item) {
    if (clean(item.InterviewKey)) return clean(item.InterviewKey);
    return [
      item["Sk Tech Register ID"],
      item["Interview Date"],
      item["Interview Time (From)  or  If Time Not confirmed plz select 00:00 like Assessment"],
      item["Interview Time (To) or  If Time Not confirmed plz select 00:00 like Assessment"],
      item.Batch
    ].map(normalizeKeyPart).join("|");
  }

  function validateStatusUpdate(input) {
    const errors = [];
    const status = clean(input.status);
    const remarks = clean(input.remarks);
    if (!clean(input.interviewKey)) errors.push("Interview key is required.");
    if (ALLOWED_STATUSES.indexOf(status) === -1) errors.push("Select a valid status.");
    if ((status === "Cancelled" || status === "Other") && !remarks) {
      errors.push(status + " requires a reason or remark.");
    }
    if (remarks.length > 500) errors.push("Remarks must be 500 characters or fewer.");
    if (status === "Rescheduled") {
      if (!clean(input.rescheduledDate)) errors.push("New interview date is required.");
      if (!clean(input.rescheduledFrom)) errors.push("New start time is required.");
      if (!clean(input.rescheduledTo)) errors.push("New end time is required.");
      if (clean(input.rescheduledDate) && Number.isNaN(Date.parse(input.rescheduledDate + "T00:00:00"))) {
        errors.push("Enter a valid rescheduled date.");
      }
      const from = timeToMinutes(input.rescheduledFrom);
      const to = timeToMinutes(input.rescheduledTo);
      if (from !== null && to !== null && to <= from) errors.push("End time must be after start time.");
    }
    return { valid: errors.length === 0, errors: errors };
  }

  function timeToMinutes(value) {
    const match = clean(value).match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour > 23 || minute > 59) return null;
    return hour * 60 + minute;
  }

  function latestUpdatesByKey(updates) {
    const latest = Object.create(null);
    (updates || []).forEach(function(update) {
      const key = clean(update.InterviewKey || update.interviewKey);
      if (!key) return;
      const timestamp = Date.parse(update["Updated At"] || update.updatedAt || "") || 0;
      if (!latest[key] || timestamp >= latest[key].timestamp) latest[key] = { timestamp: timestamp, value: update };
    });
    return latest;
  }

  function mergeInterviewStatuses(interviews, updates) {
    const latest = latestUpdatesByKey(updates);
    return (interviews || []).map(function(source) {
      const item = Object.assign({}, source);
      const key = makeInterviewKey(item);
      const match = latest[key] && latest[key].value;
      item.InterviewKey = key;
      if (!match) {
        item.Status = clean(item.Status) || "Scheduled";
        return item;
      }
      item.Status = clean(match.Status || match.status) || "Scheduled";
      item.Remarks = clean(match.Remarks || match.remarks);
      item["Status Updated At"] = clean(match["Updated At"] || match.updatedAt);
      if (item.Status === "Rescheduled") {
        item["Interview Date"] = match["Rescheduled Date"] || match.rescheduledDate || item["Interview Date"];
        item["Interview Time (From)  or  If Time Not confirmed plz select 00:00 like Assessment"] = match["Rescheduled From"] || match.rescheduledFrom || item["Interview Time (From)  or  If Time Not confirmed plz select 00:00 like Assessment"];
        item["Interview Time (To) or  If Time Not confirmed plz select 00:00 like Assessment"] = match["Rescheduled To"] || match.rescheduledTo || item["Interview Time (To) or  If Time Not confirmed plz select 00:00 like Assessment"];
      }
      return item;
    });
  }

  function isClosedStatus(status) {
    const normalized = clean(status).toLowerCase();
    return normalized === "completed" || normalized === "cancelled";
  }

  return {
    ALLOWED_STATUSES: ALLOWED_STATUSES,
    makeInterviewKey: makeInterviewKey,
    validateStatusUpdate: validateStatusUpdate,
    mergeInterviewStatuses: mergeInterviewStatuses,
    isClosedStatus: isClosedStatus
  };
});
